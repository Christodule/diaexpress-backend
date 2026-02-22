const { test } = require('node:test');
const assert = require('node:assert');

const { normalizeProvider } = require('../apps/diaexpress-client/lib/normalize-provider.js');

test('création de paiement avec "Stripe" normalise le provider', () => {
  assert.strictEqual(normalizeProvider('Stripe'), 'stripe');
});

test('création de paiement avec "orange money" normalise le provider', () => {
  assert.strictEqual(normalizeProvider('orange money'), 'orange-money');
});
