const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const CryptoTransaction = require('../models/CryptoTransaction');
const { getCryptoProvider } = require('../src/providers/crypto');
const amlService = require('./compliance/amlService');
const blockchainQueue = require('./blockchainQueue');
const { confirmPayment, failPayment } = require('./paymentWorkflowService');

function normalizeOnChainStatus(status) {
  if (!status) return null;
  const normalized = status.toString().toUpperCase();

  if (['COMPLETED', 'CONFIRMED', 'PAID', 'FULFILLED', 'SUCCESS'].includes(normalized)) {
    return 'CONFIRMED';
  }

  if (['SUBMITTED', 'PENDING', 'WAITING_FOR_CONFIRMATIONS', 'WAITING', 'PROCESSING'].includes(normalized)) {
    return 'PENDING';
  }

  if (['AWAITING_FUNDS', 'OPEN'].includes(normalized)) {
    return 'AWAITING_FUNDS';
  }

  if (['FAILED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'DECLINED'].includes(normalized)) {
    return 'FAILED';
  }

  return normalized;
}

async function setupDeposit({ payment, custodian, assetSymbol, amountFiat, amountCrypto, network, customerRef }) {
  const provider = getCryptoProvider(custodian || payment.custodian || 'fireblocks');
  const deposit = await provider.createDepositAddress({
    assetSymbol,
    customerRef,
    network,
    amount: amountFiat,
    currency: payment.currency,
  });

  payment.custodian = custodian || payment.custodian;
  payment.blockchain = deposit.blockchain || assetSymbol;
  payment.network = deposit.network || network || payment.network;
  payment.onChain = {
    ...(payment.onChain || {}),
    depositAddress: deposit.address,
    status: 'AWAITING_FUNDS',
    confirmations: 0,
    requiredConfirmations: deposit.requiredConfirmations || payment.onChain?.requiredConfirmations || 1,
  };
  payment.providerRef = {
    ...(payment.providerRef || {}),
    custodian: custodian,
    addressId: deposit.addressId || deposit.chargeId,
    chargeId: deposit.chargeId,
  };
  payment.onChainMetadata = deposit.raw;

  await payment.save();

  let cryptoTx = null;
  if (payment.cryptoTransaction) {
    cryptoTx = await CryptoTransaction.findById(payment.cryptoTransaction);
  }

  if (!cryptoTx) {
    cryptoTx = await CryptoTransaction.create({
      payment: payment._id,
      custodian: payment.custodian || custodian,
      type: 'deposit',
      assetSymbol,
      address: deposit.address,
      status: 'AWAITING_FUNDS',
      confirmations: 0,
      requiredConfirmations: payment.onChain.requiredConfirmations,
      amountFiat: {
        value: amountFiat,
        currency: payment.currency,
      },
      amountCrypto: amountCrypto?.value
        ? amountCrypto
        : {
            value: amountCrypto?.value || payment.cryptoAmount,
            currency: amountCrypto?.currency || payment.cryptoCurrency || assetSymbol,
          },
      metadata: deposit.raw,
    });
    payment.cryptoTransaction = cryptoTx._id;
    await payment.save();
  } else {
    cryptoTx.address = deposit.address;
    cryptoTx.metadata = { ...(cryptoTx.metadata || {}), deposit: deposit.raw };
    cryptoTx.requiredConfirmations = payment.onChain.requiredConfirmations;
    await cryptoTx.save();
  }

  return {
    address: deposit.address,
    network: deposit.network || network,
    tag: deposit.tag,
    hostedUrl: deposit.hostedUrl,
    chargeId: deposit.chargeId,
    requiredConfirmations: payment.onChain.requiredConfirmations,
  };
}

async function initiateWithdrawal({ payment, custodian, assetSymbol, amountCrypto, toAddress, description }) {
  const provider = getCryptoProvider(custodian || payment.custodian || 'fireblocks');

  const response = await provider.initiateWithdrawal({
    assetSymbol,
    amount: amountCrypto,
    toAddress,
    customerRef: payment.user?.toString?.(),
    description,
    idempotencyKey: new mongoose.Types.ObjectId().toString(),
  });

  let cryptoTx = null;
  if (payment.cryptoTransaction) {
    cryptoTx = await CryptoTransaction.findById(payment.cryptoTransaction);
  }

  if (!cryptoTx) {
    cryptoTx = await CryptoTransaction.create({
      payment: payment._id,
      custodian: custodian || payment.custodian,
      type: 'withdrawal',
      assetSymbol,
      address: toAddress,
      txId: response.transactionId,
      status: normalizeOnChainStatus(response.status) || 'PENDING',
      confirmations: 0,
      requiredConfirmations: payment.onChain?.requiredConfirmations || 1,
      metadata: response.raw,
    });
    payment.cryptoTransaction = cryptoTx._id;
  } else {
    cryptoTx.type = 'withdrawal';
    cryptoTx.txId = response.transactionId;
    cryptoTx.status = normalizeOnChainStatus(response.status) || 'PENDING';
    cryptoTx.metadata = { ...(cryptoTx.metadata || {}), withdrawal: response.raw };
    await cryptoTx.save();
  }

  payment.onChain = {
    ...(payment.onChain || {}),
    withdrawalAddress: toAddress,
    txId: response.transactionId,
    status: normalizeOnChainStatus(response.status) || 'PENDING',
    confirmations: 0,
    lastCheckedAt: new Date(),
  };
  payment.providerRef = {
    ...(payment.providerRef || {}),
    txId: response.transactionId,
  };

  await payment.save();

  return response;
}

async function runComplianceAndFinalize(payment, transaction, statusPayload) {
  const amlResult = await amlService.runAmlChecks({
    amountFiat: payment.fiatAmount || payment.amount,
    assetSymbol: payment.cryptoCurrency || payment.method,
    originator: { name: payment?.user?.toString?.() },
    beneficiary: { name: 'DiaExpress' },
    onChainAddress: payment.onChain?.depositAddress || transaction.address,
    jurisdiction: payment.compliance?.jurisdiction,
  });

  transaction.compliance = {
    ...(transaction.compliance || {}),
    status: amlResult.status,
    amlScore: amlResult.amlScore,
    sanctions: amlResult.sanctions,
    travelRule: amlResult.travelRule,
    flags: amlResult.flags,
  };
  await transaction.save();

  const complianceUpdate = {
    status: amlResult.status,
    amlScore: amlResult.amlScore,
    sanctions: amlResult.sanctions,
    travelRule: amlResult.travelRule,
    flags: amlResult.flags,
  };

  if (amlResult.status === 'rejected') {
    await failPayment({
      paymentId: payment._id,
      reason: 'aml_rejected',
      providerRef: { ...(payment.providerRef || {}), txId: statusPayload.txId },
      updates: {
        compliance: complianceUpdate,
        onChain: payment.onChain,
        onChainMetadata: statusPayload.raw,
        failedAt: new Date(),
      },
    });
    return;
  }

  if (amlResult.status === 'flagged') {
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'ON_HOLD',
      compliance: complianceUpdate,
      onChain: payment.onChain,
      onChainMetadata: statusPayload.raw,
      providerRef: { ...(payment.providerRef || {}), txId: statusPayload.txId },
    });
    return;
  }

  await confirmPayment({
    paymentId: payment._id,
    providerRef: { ...(payment.providerRef || {}), txId: statusPayload.txId },
    updates: {
      compliance: complianceUpdate,
      onChain: payment.onChain,
      onChainMetadata: statusPayload.raw,
      confirmedAt: new Date(),
    },
  });
}

async function syncOnChainStatus({ paymentId, custodian, txId, reportedStatus, confirmations }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const provider = getCryptoProvider(custodian || payment.custodian || 'fireblocks');
  const statusResponse = await provider.getTransactionStatus({ transactionId: txId });

  const normalized = normalizeOnChainStatus(statusResponse.status || reportedStatus);
  const currentConfirmations =
    typeof confirmations === 'number'
      ? confirmations
      : statusResponse.confirmations ?? payment.onChain?.confirmations ?? 0;

  payment.onChain = {
    ...(payment.onChain || {}),
    txId,
    status: normalized,
    confirmations: currentConfirmations,
    requiredConfirmations:
      statusResponse.requiredConfirmations || payment.onChain?.requiredConfirmations || 1,
    lastCheckedAt: new Date(),
  };
  payment.onChainMetadata = statusResponse.raw;
  await payment.save();

  let transaction = null;
  if (payment.cryptoTransaction) {
    transaction = await CryptoTransaction.findById(payment.cryptoTransaction);
  }

  if (!transaction) {
    transaction = await CryptoTransaction.create({
      payment: payment._id,
      custodian: custodian || payment.custodian,
      type: 'deposit',
      assetSymbol: payment.cryptoCurrency || payment.method,
      address: payment.onChain?.depositAddress,
      txId,
      status: normalized,
      confirmations: currentConfirmations,
      requiredConfirmations: payment.onChain?.requiredConfirmations || 1,
      metadata: statusResponse.raw,
    });
    payment.cryptoTransaction = transaction._id;
    await payment.save();
  } else {
    transaction.txId = txId || transaction.txId;
    transaction.status = normalized;
    transaction.confirmations = currentConfirmations;
    transaction.requiredConfirmations =
      statusResponse.requiredConfirmations || transaction.requiredConfirmations;
    transaction.lastSyncedAt = new Date();
    transaction.metadata = { ...(transaction.metadata || {}), status: statusResponse.raw };
    await transaction.save();
  }

  if (normalized === 'FAILED') {
    await failPayment({
      paymentId: payment._id,
      reason: 'onchain_failed',
      providerRef: { ...(payment.providerRef || {}), txId },
      updates: {
        onChain: payment.onChain,
        onChainMetadata: statusResponse.raw,
        failedAt: new Date(),
      },
    });
    return;
  }

  const required = payment.onChain?.requiredConfirmations || 1;
  if (normalized === 'CONFIRMED' && currentConfirmations >= required) {
    await runComplianceAndFinalize(payment, transaction, {
      txId,
      raw: statusResponse.raw,
    });
  }
}

function enqueueOnChainSync(payload) {
  blockchainQueue.enqueue(async () => {
    await syncOnChainStatus(payload);
  }, payload);
}

module.exports = {
  setupDeposit,
  initiateWithdrawal,
  syncOnChainStatus,
  enqueueOnChainSync,
};
