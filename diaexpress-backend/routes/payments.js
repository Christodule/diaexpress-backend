const express = require("express");
const mongoose = require("mongoose");

const Quote = require("../models/Quote");
const Payment = require("../models/Payment");

const {
  failPayment,
  confirmPaymentByRemoteId,
  failPaymentByRemoteId,
  syncPaymentStatusByRemoteId,
} = require("../services/paymentWorkflowService");
const cryptoCustodyService = require("../services/cryptoCustodyService");
const {
  createDiaExpressPayment,
} = require("../services/diapayClient");
const { push: notify } = require("../services/notificationService");
const { requireAuth } = require("../middleware/auth");
const syncUser = require("../middleware/syncUser");

const router = express.Router();

function normaliseCurrency(value, fallback = "USD") {
  return (value || fallback).toUpperCase();
}

function mapDiaPayStatusToQuote(status) {
  switch (status) {
    case "succeeded":
      return { paymentStatus: "confirmed", quoteStatus: "confirmed", paymentDate: new Date() };
    case "failed":
      return { paymentStatus: "failed", quoteStatus: "rejected", paymentDate: null };
    case "processing":
    case "pending":
    default:
      return { paymentStatus: "pending", quoteStatus: "pending", paymentDate: null };
  }
}

function applyQuoteStatus(quote, status) {
  if (!quote) return;
  const { paymentStatus, quoteStatus, paymentDate } = mapDiaPayStatusToQuote(status);

  quote.paymentStatus = paymentStatus;
  if (quoteStatus) {
    quote.status = quoteStatus;
  }
  if (paymentDate !== null) {
    quote.paymentDate = paymentDate;
  } else if (status !== "succeeded") {
    quote.paymentDate = undefined;
  }
}

function buildDiaPayMetadata({ quote, userId, localPaymentId, successUrl, cancelUrl, extraMetadata = {} }) {
  const metadata = {
    quoteId: quote._id.toString(),
    quoteMongoId: quote._id.toString(),
    quoteStatus: quote.status,
    userId: (quote.userId || userId)?.toString?.(),
    localPaymentId,
    successUrl,
    cancelUrl,
    ...extraMetadata,
  };

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

router.post("/create", requireAuth, syncUser, async (req, res) => {
  let payment;
  let failureContext = null;

  try {
    const {
      quoteId,
      currency: requestedCurrency = "USD",
      successUrl,
      cancelUrl,
      provider: requestedProvider = "diapay",
      method = "card",
      custodian = "fireblocks",
      network,
      cryptoAmount,
      cryptoCurrency,
      customerEmail,
      description,
      remoteProvider,
      metadata: requestMetadata = {},
    } = req.body;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: "Devis introuvable" });
    }
    if (quote.paymentStatus && quote.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Le devis n'est pas en attente de paiement" });
    }

    const userId = quote.userId || req.dbUser?._id;
    if (!userId) {
      return res.status(500).json({ message: "Profil utilisateur introuvable pour ce paiement" });
    }

    req.userId = userId;

    const amount = quote.finalPrice ?? quote.estimatedPrice;
    if (!amount) {
      return res.status(400).json({ message: "Aucun montant disponible pour ce devis" });
    }

    const isCryptoProvider = requestedProvider === "crypto";

    const localPaymentId = new mongoose.Types.ObjectId();
    const storageCurrency = normaliseCurrency(requestedCurrency || quote.currency || "USD");
    const metadataOverrides = {
      method,
      currency: storageCurrency,
      ...requestMetadata,
    };
    const remoteMetadata = buildDiaPayMetadata({
      quote,
      userId,
      localPaymentId: localPaymentId.toString(),
      successUrl,
      cancelUrl,
      extraMetadata: metadataOverrides,
    });

    const payload = {
      amount,
      currency: storageCurrency,
      description: description || `DiaExpress quote ${quote._id} settlement`,
      customerEmail: customerEmail || quote.userEmail || undefined,
      quoteReference: quote._id.toString(),
      quoteId: quote._id.toString(),
      userId: userId?.toString?.(),
      localPaymentId: localPaymentId.toString(),
      successUrl,
      cancelUrl,
      method,
      metadata: remoteMetadata,
    };

    const requestedRemoteProvider =
      remoteProvider || (requestedProvider !== "diapay" ? requestedProvider : undefined);
    if (requestedRemoteProvider && requestedRemoteProvider !== "crypto") {
      payload.provider = requestedRemoteProvider;
    }

    const diaPayResponse = await createDiaExpressPayment(payload);
    const diaPayStatus = diaPayResponse?.status || "pending";
    const remotePaymentId = diaPayResponse?.paymentId;
    const statusSyncedAt = diaPayResponse?.payment?.statusUpdatedAt
      ? new Date(diaPayResponse.payment.statusUpdatedAt)
      : new Date();

    const computedCryptoCurrency =
      cryptoCurrency || (method && method !== "card" ? method.toUpperCase() : null);

    const amounts = {
      fiat: {
        value: amount,
        currency: storageCurrency,
      },
    };
    if (cryptoAmount !== undefined && cryptoAmount !== null) {
      amounts.crypto = {
        value: cryptoAmount,
        currency: computedCryptoCurrency || undefined,
      };
    }

    payment = await Payment.create({
      _id: localPaymentId,
      diapayPaymentId: remotePaymentId,
      quote: quote._id,
      user: userId,
      provider: isCryptoProvider ? "crypto" : "diapay",
      method,
      amount,
      currency: storageCurrency,
      fiatAmount: amount,
      fiatCurrency: storageCurrency,
      cryptoAmount: cryptoAmount ?? null,
      cryptoCurrency: computedCryptoCurrency,
      amounts,
      compliance: {
        status: "pending",
        sanctions: { status: "clear", provider: "internal", checkedAt: new Date(), lists: [] },
        travelRule: { status: "not_required", checkedAt: new Date() },
        flags: [],
      },
      status: diaPayStatus,
      statusSyncedAt,
    });

    quote.paymentId = payment._id;
    applyQuoteStatus(quote, diaPayStatus);
    await quote.save();

    if (isCryptoProvider) {
      payment.custodian = custodian;
      payment.network = network;
      await payment.save();

      const deposit = await cryptoCustodyService.setupDeposit({
        payment,
        custodian,
        assetSymbol: payment.cryptoCurrency || method,
        amountFiat: amount,
        amountCrypto: payment.amounts?.crypto,
        network,
        customerRef: userId.toString(),
      });

      const refreshedPayment = await Payment.findById(payment._id);

      return res.json({
        payment: refreshedPayment,
        deposit,
      });
    }

    const providerRef = {
      diapayPaymentId: remotePaymentId,
      remoteStatus: diaPayStatus,
      remoteProvider: diaPayResponse?.provider,
      providerResponse: diaPayResponse?.providerResponse,
    };

    failureContext = {
      reason: "diapay_error",
      providerRef: {
        ...providerRef,
        stage: "create",
      },
    };

    let updatedPayment;
    switch (diaPayStatus) {
      case "succeeded":
        updatedPayment = await confirmPaymentByRemoteId({
          remotePaymentId,
          providerRef,
          fallbackPaymentId: payment._id,
        });
        break;
      case "failed":
        updatedPayment = await failPaymentByRemoteId({
          remotePaymentId,
          reason: "diapay_failed",
          providerRef,
          fallbackPaymentId: payment._id,
        });
        break;
      case "processing":
      case "pending":
      default:
        updatedPayment = await syncPaymentStatusByRemoteId({
          remotePaymentId,
          remoteStatus: diaPayStatus,
          providerRef,
          fallbackPaymentId: payment._id,
        });
        break;
    }

    failureContext = null;

    const responsePayment = updatedPayment || (await Payment.findById(payment._id));

    return res.status(201).json({
      payment: responsePayment,
      diapay: diaPayResponse,
    });
  } catch (error) {
    console.error("Payment create error:", error);

    if (payment && failureContext) {
      try {
        await failPayment({
          paymentId: payment._id,
          reason: failureContext.reason,
          providerRef: {
            ...failureContext.providerRef,
            error: error.details || error.message,
          },
        });
      } catch (failError) {
        console.error("Unable to mark payment as failed:", failError);
      }
    }

    const statusCode = error.status || error?.response?.status || 500;
    const message = error?.response?.data?.error || error.message || "Erreur diaPay";

    return res.status(statusCode).json({ message });
  }
});

router.get("/mine", requireAuth, syncUser, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/callbacks/diapay", async (req, res) => {
  try {
    const payload = req.body || {};
    const remotePaymentId = payload.paymentId;
    const remoteStatus = payload.status;
    const metadata = payload.metadata || {};

    if (!remotePaymentId) {
      return res.status(400).json({ message: "paymentId requis" });
    }

    if (!remoteStatus) {
      return res.status(400).json({ message: "status requis" });
    }

    const fallbackPaymentId =
      typeof metadata.localPaymentId === "string" ? metadata.localPaymentId : undefined;

    const providerRef = {
      diapayPaymentId: remotePaymentId,
      remoteStatus,
      notificationPayload: payload,
    };

    let payment;

    if (remoteStatus === "succeeded") {
      payment = await confirmPaymentByRemoteId({
        remotePaymentId,
        providerRef,
        fallbackPaymentId,
      });

      if (payment) {
        await notify({
          userId: payment.user,
          type: "payment",
          title: "Paiement confirmé",
          message: `Votre paiement pour le devis ${payment.quote} est confirmé.`,
          entity: { entityType: "Payment", entityId: payment._id },
        });
      }
    } else if (remoteStatus === "failed") {
      payment = await failPaymentByRemoteId({
        remotePaymentId,
        reason: "diapay_failed",
        providerRef,
        fallbackPaymentId,
      });
    } else if (remoteStatus === "processing" || remoteStatus === "pending") {
      payment = await syncPaymentStatusByRemoteId({
        remotePaymentId,
        remoteStatus,
        providerRef,
        fallbackPaymentId,
      });
    } else {
      console.warn("Unhandled diaPay status", remoteStatus);
      return res.status(202).json({
        acknowledged: false,
        message: `Statut diaPay inconnu: ${remoteStatus}`,
      });
    }

    if (!payment) {
      return res.status(404).json({ message: "Paiement associé introuvable" });
    }

    res.json({ acknowledged: true });
  } catch (error) {
    console.error("diaPay callback error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/webhook/crypto", (_req, res) => {
  res.status(410).json({ message: "Les paiements on-chain sont désormais gérés par diaPay" });
});

module.exports = router;
