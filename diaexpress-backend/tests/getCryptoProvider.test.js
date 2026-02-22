const { test } = require('node:test');
const assert = require('node:assert');

const { getCryptoProvider } = require('../src/providers/crypto');

test('returns cached instance when no options are provided', () => {
  const first = getCryptoProvider('fireblocks');
  const second = getCryptoProvider('fireblocks');

  assert.strictEqual(first, second);
});

test('creates isolated instance when custom options are supplied', () => {
  const defaultInstance = getCryptoProvider('fireblocks');
  const customHttp = {};
  const customized = getCryptoProvider('fireblocks', { axiosInstance: customHttp });

  assert.notStrictEqual(customized, defaultInstance);
  assert.strictEqual(customized.http, customHttp);
  assert.strictEqual(getCryptoProvider('fireblocks'), defaultInstance);
});

test('supports relaxed naming for Coinbase Commerce', () => {
  const withSpace = getCryptoProvider('Coinbase Commerce');
  const canonical = getCryptoProvider('coinbase-commerce');

  assert.strictEqual(withSpace.constructor, canonical.constructor);
});
