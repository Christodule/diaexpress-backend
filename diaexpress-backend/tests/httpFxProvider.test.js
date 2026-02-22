const test = require('node:test');
const assert = require('node:assert/strict');

const { HttpFxProvider } = require('../diapay/cjs/httpFxProvider');

test('fetchLatestRates récupère et normalise les taux de change', async () => {
  const provider = new HttpFxProvider({
    baseUrl: 'https://example.test/latest',
    apiKey: 'secret-key',
    timeoutMs: 5000,
  });

  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (input, init = {}) => {
    calls.push([input, init]);
    return {
      ok: true,
      json: async () => ({
        base: 'USD',
        date: '2024-01-02',
        rates: {
          EUR: 0.92,
          gbp: 0.81,
        },
      }),
    };
  };

  try {
    const quotes = await provider.fetchLatestRates('usd', ['eur', 'gbp', 'eur', '']);

    assert.equal(calls.length, 1);
    const [url, init] = calls[0];
    const parsedUrl = new URL(String(url));
    assert.equal(parsedUrl.origin + parsedUrl.pathname, 'https://example.test/latest');
    assert.equal(parsedUrl.searchParams.get('base'), 'usd');
    assert.equal(parsedUrl.searchParams.get('symbols'), 'eur,gbp');
    assert.deepEqual(init.headers, { apikey: 'secret-key' });
    assert.ok(init.signal instanceof AbortSignal);

    assert.deepEqual(quotes, [
      {
        baseCurrency: 'usd',
        quoteCurrency: 'eur',
        rate: 0.92,
        fetchedAt: new Date('2024-01-02'),
      },
      {
        baseCurrency: 'usd',
        quoteCurrency: 'gbp',
        rate: 0.81,
        fetchedAt: new Date('2024-01-02'),
      },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('fetchLatestRates renvoie un tableau vide si aucun symbole valide', async () => {
  const provider = new HttpFxProvider();

  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async (...args) => {
    called = true;
    return originalFetch(...args);
  };

  try {
    const quotes = await provider.fetchLatestRates('usd', ['  ', null, undefined]);
    assert.deepEqual(quotes, []);
    assert.equal(called, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('fetchLatestRates propage une erreur HTTP', async () => {
  const provider = new HttpFxProvider();

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 502,
    statusText: 'Bad Gateway',
  });

  try {
    await assert.rejects(
      provider.fetchLatestRates('usd', ['eur']),
      /Failed to fetch FX rates: 502 Bad Gateway/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
