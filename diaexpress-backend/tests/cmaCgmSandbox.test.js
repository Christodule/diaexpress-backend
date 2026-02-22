const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const originalEnv = { ...process.env };

function clearModule(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch (err) {
    // module not loaded yet
  }
}

function resetModule() {
  clearModule('../config/cmaCgm');
  clearModule('../services/cmaCgmService');
}

function restoreEnv() {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);
}

test('CMA CGM sandbox fixture is returned when sandbox mode is enabled', async (t) => {
  process.env.CMACGM_MODE = 'sandbox';
  process.env.CMACGM_SANDBOX_FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'cma-cgm', 'quote.sample.json');
  resetModule();
  const { getCmaCgmQuote } = require('../services/cmaCgmService');

  const quote = await getCmaCgmQuote({ origin: 'FOS', destination: 'DLA', transportType: 'sea' });

  assert.ok(quote, 'quote should not be null');
  assert.equal(quote.provider, 'cma-cgm');
  assert.equal(quote.estimatedPrice, 865.5);
  assert.equal(quote.currency, 'USD');
  assert.equal(quote.appliedRule, 'Sandbox Spot');
  assert.equal(quote.meta.mode, 'sandbox');
  assert.equal(quote.meta.fixture, 'quote.sample.json');

  t.after(() => {
    restoreEnv();
    resetModule();
  });
});
