const test = require('node:test');
const assert = require('node:assert/strict');

const originalEnv = { ...process.env };

function clearModule(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch (error) {
    // ignore
  }
}

function resetModules() {
  ['../config/cmaCgm', '../config/fedex', '../services/cmaCgmService', '../services/fedexService', '../services/carrierIntegrationService'].forEach(clearModule);
}

function restoreEnv() {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });

  Object.assign(process.env, originalEnv);
}

test('createCarrierBooking normalises CMA CGM sandbox fixture', async (t) => {
  process.env.CMACGM_USE_SANDBOX = 'true';
  resetModules();

  const { createCarrierBooking } = require('../services/carrierIntegrationService');

  const quote = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    origin: 'Le Havre',
    destination: 'Shanghai',
    transportType: 'sea',
    weight: 1,
    volume: 0.5,
  };

  const booking = await createCarrierBooking({ provider: 'cma-cgm', quote, options: {} });

  assert.equal(booking.provider, 'cma-cgm');
  assert.equal(booking.bookingReference, 'CMA123456789');
  assert.equal(booking.trackingCode, 'CMA-TRACK-987654');
  assert.ok(Array.isArray(booking.events));
  assert.ok(booking.meta.fixture.endsWith('booking.sample.json'));

  t.after(() => {
    resetModules();
    restoreEnv();
  });
});

test('getCarrierTracking returns FedEx sandbox events', async (t) => {
  process.env.FEDEX_USE_SANDBOX = 'true';
  resetModules();

  const { getCarrierTracking } = require('../services/carrierIntegrationService');

  const tracking = await getCarrierTracking({ provider: 'fedex', trackingNumber: '449044304137821', identity: {} });

  assert.equal(tracking.provider, 'fedex');
  assert.equal(tracking.status, 'in_transit');
  assert.ok(tracking.events.length >= 1);
  assert.ok(tracking.meta.fixture.endsWith('tracking.sample.json'));

  t.after(() => {
    resetModules();
    restoreEnv();
  });
});
