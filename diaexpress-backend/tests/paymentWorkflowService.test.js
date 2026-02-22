const { beforeEach, test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const payments = new Map();
const quotes = new Map();
const remotePayments = new Map();

function normaliseId(value) {
  return value?.toString();
}

const paymentModelPath = require.resolve("../models/Payment");
const originalPaymentModule = require.cache[paymentModelPath];
const PaymentStub = {
  async findById(id) {
    return payments.get(normaliseId(id)) || null;
  },
  async findOne(filter = {}) {
    if (filter.diapayPaymentId) {
      for (const payment of payments.values()) {
        if (payment.diapayPaymentId === filter.diapayPaymentId) {
          return payment;
        }
      }
    }
    return null;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    const key = normaliseId(id);
    const payment = payments.get(key);
    if (!payment) {
      return null;
    }

    Object.assign(payment, update);
    payments.set(key, payment);
    return options.new ? payment : payment;
  },
};
require.cache[paymentModelPath] = { exports: PaymentStub };

const quoteModelPath = require.resolve("../models/Quote");
const originalQuoteModule = require.cache[quoteModelPath];
const QuoteStub = {
  async findById(id) {
    return quotes.get(normaliseId(id)) || null;
  },
  async findByIdAndUpdate(id, update) {
    const key = normaliseId(id);
    const quote = quotes.get(key);
    if (!quote) {
      return null;
    }

    if (update.$set) {
      for (const [field, value] of Object.entries(update.$set)) {
        quote[field] = value;
      }
    }

    if (update.$unset) {
      for (const field of Object.keys(update.$unset)) {
        delete quote[field];
      }
    }

    quotes.set(key, quote);
    return quote;
  },
};
require.cache[quoteModelPath] = { exports: QuoteStub };

const diapayClientPath = require.resolve("../services/diapayClient");
const originalDiaPayModule = require.cache[diapayClientPath];
const diaPayStub = {
  async getPaymentById(id) {
    if (!remotePayments.has(id)) {
      const error = new Error("Payment not found");
      error.response = { status: 404 };
      throw error;
    }
    return remotePayments.get(id);
  },
};
require.cache[diapayClientPath] = { exports: diaPayStub };

const paymentWorkflowService = require("../services/paymentWorkflowService");

if (originalPaymentModule) {
  require.cache[paymentModelPath] = originalPaymentModule;
} else {
  delete require.cache[paymentModelPath];
}

if (originalQuoteModule) {
  require.cache[quoteModelPath] = originalQuoteModule;
} else {
  delete require.cache[quoteModelPath];
}

if (originalDiaPayModule) {
  require.cache[diapayClientPath] = originalDiaPayModule;
} else {
  delete require.cache[diapayClientPath];
}

function createQuote(overrides = {}) {
  const _id = overrides._id || new mongoose.Types.ObjectId();
  const quote = {
    _id,
    paymentStatus: "pending",
    status: "pending",
    ...overrides,
  };
  quotes.set(_id.toString(), quote);
  return quote;
}

function createPayment(overrides = {}) {
  const _id = overrides._id || new mongoose.Types.ObjectId();
  const payment = {
    _id,
    quote: overrides.quote || new mongoose.Types.ObjectId(),
    status: "pending",
    legacy: undefined,
    ...overrides,
  };
  payments.set(_id.toString(), payment);
  return payment;
}

beforeEach(() => {
  payments.clear();
  quotes.clear();
  remotePayments.clear();
});

test("confirmPaymentByRemoteId synchronises payment and quote", async () => {
  const quote = createQuote();
  const payment = createPayment({ quote: quote._id });
  const remotePaymentId = "remote-confirm";
  remotePayments.set(remotePaymentId, {
    id: remotePaymentId,
    status: "succeeded",
    status_updated_at: "2024-05-01T10:15:00.000Z",
  });

  const updated = await paymentWorkflowService.confirmPaymentByRemoteId({
    remotePaymentId,
    providerRef: { stage: "webhook" },
    fallbackPaymentId: payment._id.toString(),
  });

  assert.ok(updated);
  assert.strictEqual(updated.status, "succeeded");

  const storedPayment = payments.get(payment._id.toString());
  assert.strictEqual(storedPayment.status, "succeeded");
  assert.ok(storedPayment.statusSyncedAt instanceof Date);
  assert.strictEqual(
    storedPayment.statusSyncedAt.toISOString(),
    "2024-05-01T10:15:00.000Z",
  );
  assert.deepStrictEqual(storedPayment.legacy.providerRef, {
    diapayPaymentId: remotePaymentId,
    stage: "webhook",
  });

  const storedQuote = quotes.get(quote._id.toString());
  assert.strictEqual(storedQuote.paymentStatus, "confirmed");
  assert.strictEqual(storedQuote.status, "confirmed");
  assert.strictEqual(normaliseId(storedQuote.paymentId), payment._id.toString());
  assert.ok(storedQuote.paymentDate instanceof Date);
  assert.strictEqual(storedQuote.paymentDate.toISOString(), "2024-05-01T10:15:00.000Z");
});

test("failPaymentByRemoteId records failure reason and clears quote payment date", async () => {
  const quote = createQuote();
  const payment = createPayment({ quote: quote._id });
  const remotePaymentId = "remote-failure";
  remotePayments.set(remotePaymentId, {
    id: remotePaymentId,
    status: "failed",
    status_updated_at: "2024-05-02T08:30:00.000Z",
  });

  const updated = await paymentWorkflowService.failPaymentByRemoteId({
    remotePaymentId,
    reason: "provider_error",
    providerRef: { stage: "webhook" },
    fallbackPaymentId: payment._id.toString(),
  });

  assert.ok(updated);
  assert.strictEqual(updated.status, "failed");

  const storedPayment = payments.get(payment._id.toString());
  assert.strictEqual(storedPayment.status, "failed");
  assert.ok(storedPayment.statusSyncedAt instanceof Date);
  assert.strictEqual(
    storedPayment.statusSyncedAt.toISOString(),
    "2024-05-02T08:30:00.000Z",
  );
  assert.strictEqual(storedPayment.legacy.failureReason, "provider_error");
  assert.deepStrictEqual(storedPayment.legacy.providerRef, {
    diapayPaymentId: remotePaymentId,
    stage: "webhook",
  });

  const storedQuote = quotes.get(quote._id.toString());
  assert.strictEqual(storedQuote.paymentStatus, "failed");
  assert.strictEqual(storedQuote.status, "rejected");
  assert.strictEqual(normaliseId(storedQuote.paymentId), payment._id.toString());
  assert.ok(!("paymentDate" in storedQuote));
});

test("syncPaymentStatusByRemoteId utilise statusUpdatedAt camelCase lorsqu'il est fourni", async () => {
  const quote = createQuote();
  const payment = createPayment({ quote: quote._id });
  const remotePaymentId = "remote-camel";
  const updatedAt = "2024-06-10T12:00:00.000Z";

  remotePayments.set(remotePaymentId, {
    id: remotePaymentId,
    status: "processing",
    statusUpdatedAt: updatedAt,
  });

  const updated = await paymentWorkflowService.syncPaymentStatusByRemoteId({
    remotePaymentId,
    remoteStatus: "processing",
    providerRef: { stage: "webhook" },
    fallbackPaymentId: payment._id.toString(),
  });

  assert.ok(updated);
  const storedPayment = payments.get(payment._id.toString());
  assert.strictEqual(storedPayment.statusSyncedAt instanceof Date, true);
  assert.strictEqual(storedPayment.statusSyncedAt.toISOString(), updatedAt);
  assert.strictEqual(storedPayment.status, "processing");
});
