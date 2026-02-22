const { beforeEach, test } = require('node:test');
const assert = require('node:assert');

// Stub notification service before requiring the controller
const notificationServicePath = require.resolve('../services/notificationService');
require.cache[notificationServicePath] = { exports: { push: async () => ({}) } };

const Quote = require('../models/Quote');
const adminQuoteController = require('../controllers/adminQuoteController');

const quotes = new Map();

function createQuote(data) {
  const quote = new Quote(data);
  const validationError = quote.validateSync();
  if (validationError) {
    throw validationError;
  }
  quotes.set(quote._id.toString(), quote);
  return quote;
}

Quote.findById = async (id) => {
  const key = id?.toString();
  return quotes.get(key) || null;
};

Quote.findByIdAndUpdate = async (id, update, options = {}) => {
  const key = id?.toString();
  const quote = quotes.get(key);
  if (!quote) return null;

  quote.set(update);
  const validationError = quote.validateSync();
  if (validationError) {
    throw validationError;
  }

  return options.new ? quote : quote;
};

beforeEach(() => {
  quotes.clear();
});

function createMockRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test('approve transition stores a confirmed quote status', { concurrency: false }, async () => {
  const quote = createQuote({ origin: 'Paris', destination: 'Lomé', transportType: 'air' });

  const req = {
    params: { id: quote._id.toString() },
    body: { finalPrice: 1200, currency: 'USD' }
  };
  const res = createMockRes();

  await adminQuoteController.approve(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.payload?.quote);
  assert.strictEqual(res.payload.quote.status, 'confirmed');

  const stored = await Quote.findById(quote._id);
  assert.strictEqual(stored.status, 'confirmed');
});

test('reject transition stores a rejected quote status', { concurrency: false }, async () => {
  const quote = createQuote({ origin: 'Paris', destination: 'Accra', transportType: 'sea' });

  const req = {
    params: { id: quote._id.toString() },
    body: { reason: 'Tarif indisponible' }
  };
  const res = createMockRes();

  await adminQuoteController.reject(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.payload?.quote);
  assert.strictEqual(res.payload.quote.status, 'rejected');
  assert.strictEqual(res.payload.quote.rejectionReason, 'Tarif indisponible');

  const stored = await Quote.findById(quote._id);
  assert.strictEqual(stored.status, 'rejected');
  assert.strictEqual(stored.rejectionReason, 'Tarif indisponible');
});

test('dispatch transition stores a dispatched quote status and delivery state', { concurrency: false }, async () => {
  const quote = createQuote({ origin: 'Paris', destination: 'Cotonou', transportType: 'air' });

  const req = {
    params: { id: quote._id.toString() },
    body: { carrier: 'DHL', trackingNumber: 'TRACK-123' }
  };
  const res = createMockRes();

  await adminQuoteController.dispatch(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.payload?.quote);
  assert.strictEqual(res.payload.quote.status, 'dispatched');
  assert.strictEqual(res.payload.quote.deliveryStatus, 'dispatched');
  assert.strictEqual(res.payload.quote.trackingNumber, 'TRACK-123');

  const stored = await Quote.findById(quote._id);
  assert.strictEqual(stored.status, 'dispatched');
  assert.strictEqual(stored.deliveryStatus, 'dispatched');
  assert.strictEqual(stored.trackingNumber, 'TRACK-123');
});
