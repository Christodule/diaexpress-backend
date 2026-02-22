const { afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const reservationController = require('../controllers/reservationController');
const Reservation = require('../models/Reservation');
const Pricing = require('../models/Pricing');

const original = {
  reservationSave: Reservation.prototype.save,
  reservationFind: Reservation.find,
  reservationFindById: Reservation.findById,
  pricingFindOne: Pricing.findOne,
};

afterEach(() => {
  Reservation.prototype.save = original.reservationSave;
  Reservation.find = original.reservationFind;
  Reservation.findById = original.reservationFindById;
  Pricing.findOne = original.pricingFindOne;
});

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

test('createReservation associe le user et valide le transport', async () => {
  const userId = new mongoose.Types.ObjectId();
  const req = {
    body: {
      origin: 'Dakar',
      destination: 'Paris',
      transportType: ' Air ',
      type: 'FCL',
      provider: 'INTERNAL',
      departureDate: new Date(),
    },
    dbUser: { _id: userId },
  };
  const res = createMockRes();

  const savedReservations = [];
  let capturedQuery;

  Reservation.prototype.save = async function saveMock() {
    savedReservations.push(this);
  };
  Pricing.findOne = async (query) => {
    capturedQuery = query;
    return {};
  };

  await reservationController.createReservation(req, res);

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(savedReservations.length, 1);
  const [stored] = savedReservations;
  assert.ok(stored.user, 'la réservation doit référencer un utilisateur');
  assert.ok(
    typeof stored.user.equals === 'function'
      ? stored.user.equals(userId)
      : String(stored.user) === String(userId),
    'la réservation doit cibler le bon utilisateur',
  );
  assert.deepEqual(capturedQuery, {
    origin: 'Dakar',
    destination: 'Paris',
    transportPrices: { $elemMatch: { transportType: 'air' } },
  });
});

test('getMyReservations filtre par utilisateur authentifié', async () => {
  const userId = new mongoose.Types.ObjectId();
  const expectedReservations = [{ id: 'res1' }];
  let capturedFilter;
  let sortCalled = false;

  Reservation.find = (filter) => {
    capturedFilter = filter;
    return {
      sort: (sortQuery) => {
        sortCalled = true;
        assert.deepEqual(sortQuery, { createdAt: -1 });
        return Promise.resolve(expectedReservations);
      },
    };
  };

  const req = { dbUser: { _id: userId } };
  const res = createMockRes();

  await reservationController.getMyReservations(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(sortCalled, 'la requête doit être triée par date de création');
  assert.deepEqual(capturedFilter, { user: userId });
  assert.strictEqual(res.payload, expectedReservations);
});

test('uploadDocument refuse un autre client mais accepte le propriétaire', async () => {
  const ownerId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();
  let saved = false;

  const reservation = new Reservation({
    user: ownerId,
    type: 'FCL',
    origin: 'Dakar',
    destination: 'Paris',
    provider: 'INTERNAL',
    departureDate: new Date(),
    documents: [],
  });
  reservation.save = async () => {
    saved = true;
  };

  Reservation.findById = async () => reservation;

  const res = createMockRes();
  const forbiddenReq = {
    params: { id: reservation._id.toString() },
    body: { type: 'invoice', url: 'https://example.com/invoice.pdf' },
    dbUser: { _id: otherId, role: 'client' },
  };

  await reservationController.uploadDocument(forbiddenReq, res);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(saved, false);

  const okRes = createMockRes();
  const ownerReq = {
    params: { id: reservation._id.toString() },
    body: { type: 'invoice', url: 'https://example.com/invoice.pdf' },
    dbUser: { _id: ownerId, role: 'client' },
  };

  await reservationController.uploadDocument(ownerReq, okRes);
  assert.strictEqual(okRes.statusCode, 200);
  assert.ok(saved);
  assert.strictEqual(reservation.documents.length, 1);
  const [document] = reservation.documents;
  assert.strictEqual(document.type, 'invoice');
  assert.strictEqual(document.url, 'https://example.com/invoice.pdf');
  assert.ok(document.uploadedAt instanceof Date);
});
