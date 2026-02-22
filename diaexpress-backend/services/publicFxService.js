const { HttpFxProvider } = require('../diapay/cjs/httpFxProvider.js');

const DEFAULT_BASE_CURRENCY = 'USD';
const DEFAULT_SUPPORTED = ['EUR', 'GBP'];
const DEFAULT_PROVIDER_URL = 'https://api.exchangerate.host/latest';

function resolveSupportedCurrencies(raw) {
  if (!raw) {
    return DEFAULT_SUPPORTED;
  }
  return raw
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length === 3);
}

const FX_PROVIDER_URL = process.env.FX_PROVIDER_URL || DEFAULT_PROVIDER_URL;
const FX_PROVIDER_API_KEY = process.env.FX_PROVIDER_API_KEY || undefined;
const FX_PROVIDER_TIMEOUT = process.env.FX_PROVIDER_TIMEOUT_MS
  ? Number.parseInt(process.env.FX_PROVIDER_TIMEOUT_MS, 10)
  : undefined;
const FX_BASE_CURRENCY = (process.env.FX_BASE_CURRENCY || DEFAULT_BASE_CURRENCY).toUpperCase();
const FX_SUPPORTED_CURRENCIES = resolveSupportedCurrencies(process.env.FX_SUPPORTED_CURRENCIES);

const fxProvider = new HttpFxProvider({
  baseUrl: FX_PROVIDER_URL,
  apiKey: FX_PROVIDER_API_KEY,
  timeoutMs: Number.isFinite(FX_PROVIDER_TIMEOUT) ? FX_PROVIDER_TIMEOUT : undefined,
  name: 'public-fx-provider',
});

function getQuoteCurrencies() {
  const filtered = FX_SUPPORTED_CURRENCIES.filter((currency) => currency !== FX_BASE_CURRENCY);
  if (filtered.length > 0) {
    return filtered;
  }
  return DEFAULT_SUPPORTED.filter((currency) => currency !== FX_BASE_CURRENCY);
}

async function fetchPublicRates() {
  const quoteCurrencies = getQuoteCurrencies();
  if (quoteCurrencies.length === 0) {
    return [];
  }
  return fxProvider.fetchLatestRates(FX_BASE_CURRENCY.toLowerCase(), quoteCurrencies.map((value) => value.toLowerCase()));
}

function toIsoString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}

function formatFxQuotes(quotes) {
  return quotes.map((quote) => ({
    baseCurrency: quote.baseCurrency.toUpperCase(),
    quoteCurrency: quote.quoteCurrency.toUpperCase(),
    midMarketRate: quote.rate,
    updatedAt: toIsoString(quote.fetchedAt),
  }));
}

module.exports = {
  fetchPublicRates,
  formatFxQuotes,
  fxProvider,
  FX_BASE_CURRENCY,
  FX_SUPPORTED_CURRENCIES,
};
