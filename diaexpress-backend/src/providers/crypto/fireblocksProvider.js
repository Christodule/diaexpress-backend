const crypto = require('crypto');
const BaseCustodian = require('./BaseCustodian');

/**
 * Lightweight Fireblocks REST API wrapper exposing the subset of endpoints
 * required by the DiaExpress platform. It intentionally keeps the
 * implementation framework agnostic to ease future migrations.
 */
class FireblocksProvider extends BaseCustodian {
  constructor(options = {}) {
    super({
      baseURL: options.baseURL || process.env.FIREBLOCKS_API_BASE_URL || 'https://api.fireblocks.io',
      apiKey: options.apiKey || process.env.FIREBLOCKS_API_KEY,
      secret: options.secret || process.env.FIREBLOCKS_API_SECRET,
      axiosInstance: options.axiosInstance,
    });

    this.vaultAccountId = options.vaultAccountId || process.env.FIREBLOCKS_VAULT_ACCOUNT_ID;
    this.defaultConfirmations = Number(options.defaultConfirmations || process.env.FIREBLOCKS_REQUIRED_CONFIRMATIONS || 3);
  }

  buildHeaders(extraHeaders = {}, config = {}) {
    const headers = super.buildHeaders(extraHeaders, config);

    if (this.secret) {
      const nonce = Date.now().toString();
      const { method = 'GET', url = '' } = config;
      const payload = `${nonce}|${method.toUpperCase()}|${url}`;
      headers['X-Nonce'] = nonce;
      headers['X-Signature'] = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    }

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async createDepositAddress({ assetSymbol, customerRef, network }) {
    if (!this.vaultAccountId) {
      throw new Error('Fireblocks vault account id is not configured');
    }

    const asset = assetSymbol?.toUpperCase();
    const path = `/v1/vault/accounts/${this.vaultAccountId}/${asset}/addresses`;

    const data = await this.request({
      method: 'POST',
      url: path,
      data: {
        description: `DiaExpress deposit for ${customerRef || 'anonymous'}`,
        customerRef,
        ...(network ? { network } : {}),
      },
    });

    const address = data?.address || data?.id || data?.result?.address;
    const tag = data?.tag || data?.memo || null;

    return {
      address,
      addressId: data?.id,
      network: data?.network || network,
      blockchain: data?.blockchain,
      tag,
      requiredConfirmations: this.defaultConfirmations,
      raw: data,
    };
  }

  async initiateWithdrawal({ assetSymbol, amount, toAddress, idempotencyKey, customerRef, note, feeLevel = 'MEDIUM' }) {
    const asset = assetSymbol?.toUpperCase();
    const path = '/v1/transactions';

    const payload = {
      assetId: asset,
      source: {
        type: 'VAULT_ACCOUNT',
        id: this.vaultAccountId,
      },
      destination: {
        type: 'ONE_TIME_ADDRESS',
        oneTimeAddress: {
          address: toAddress,
        },
      },
      amount: amount?.toString?.() || amount,
      treatAsGrossAmount: false,
      note: note || `Withdrawal for ${customerRef || 'DiaExpress user'}`,
      feeLevel,
      ...(customerRef ? { customerRefId: customerRef } : {}),
    };

    const data = await this.request({
      method: 'POST',
      url: path,
      data: payload,
      idempotencyKey,
    });

    return {
      transactionId: data?.id,
      status: data?.status,
      submittedAt: data?.createdAt,
      raw: data,
    };
  }

  async getTransactionStatus({ transactionId }) {
    if (!transactionId) {
      throw new Error('transactionId is required to fetch Fireblocks status');
    }

    const data = await this.request({
      method: 'GET',
      url: `/v1/transactions/${transactionId}`,
    });

    return {
      transactionId,
      status: data?.status,
      confirmations: data?.numConfirmations || data?.confirmations || 0,
      requiredConfirmations: this.defaultConfirmations,
      completedAt: data?.lastUpdated,
      amount: data?.amount,
      destinationAddress: data?.destinationAddress,
      raw: data,
    };
  }
}

module.exports = FireblocksProvider;
