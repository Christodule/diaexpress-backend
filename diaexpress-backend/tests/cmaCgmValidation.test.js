const test = require('node:test');
const assert = require('node:assert/strict');

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

test('CMA CGM quote gracefully returns null when origin/destination missing', async (t) => {
  process.env.CMACGM_MODE = 'live';
  process.env.CMACGM_USE_SANDBOX = 'false';
  process.env.CMACGM_API_URL = 'https://example.com';
  process.env.CMACGM_QUOTE_PATH = '/v1/quotes';
  resetModule();

  const { getCmaCgmQuote } = require('../services/cmaCgmService');

  const quote = await getCmaCgmQuote({ transportType: 'sea' });
  assert.equal(quote, null);

  t.after(() => {
    restoreEnv();
    resetModule();
  });
});
