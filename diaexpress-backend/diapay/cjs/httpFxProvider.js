function normaliseCurrency(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

function parseFetchedAt(payload) {
  if (!payload || typeof payload !== 'object') {
    return new Date();
  }

  const { time_last_update_unix: timeLastUpdateUnix, timestamp, date } = payload;

  if (Number.isFinite(timeLastUpdateUnix)) {
    return new Date(timeLastUpdateUnix * 1000);
  }

  if (Number.isFinite(timestamp)) {
    const milliseconds = timestamp > 1e12 ? timestamp : timestamp * 1000;
    return new Date(milliseconds);
  }

  if (date) {
    const parsedDate = new Date(date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return new Date();
}

class HttpFxProvider {
  constructor(options = {}) {
    const { baseUrl, apiKey, timeoutMs, name } = options;
    this.baseUrl = baseUrl || 'https://api.exchangerate.host/latest';
    this.apiKey = apiKey;
    this.timeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : undefined;
    this.name = name || 'http-fx-provider';
  }

  async fetchLatestRates(baseCurrency, quoteCurrencies) {
    const base = normaliseCurrency(baseCurrency);
    if (!base) {
      throw new TypeError('baseCurrency must be a non-empty string');
    }

    const uniqueQuotes = Array.isArray(quoteCurrencies)
      ? Array.from(
          new Set(
            quoteCurrencies
              .map(normaliseCurrency)
              .filter((currency) => currency && currency !== base),
          ),
        )
      : [];

    if (uniqueQuotes.length === 0) {
      return [];
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('base', base);
    url.searchParams.set('symbols', uniqueQuotes.join(','));

    const controller = this.timeoutMs ? new AbortController() : undefined;
    const headers = this.apiKey ? { apikey: this.apiKey } : undefined;
    const init = {};
    if (headers) {
      init.headers = headers;
    }
    let timeoutId;
    if (controller) {
      init.signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(`Failed to fetch FX rates: ${response.status} ${response.statusText || ''}`.trim());
      }

      const payload = await response.json();
      const rates = payload && typeof payload === 'object' ? payload.rates : undefined;
      if (!rates || typeof rates !== 'object') {
        return [];
      }

      const fetchedAt = parseFetchedAt(payload);
      const normalisedRates = new Map();
      Object.entries(rates).forEach(([currency, rate]) => {
        const key = normaliseCurrency(currency);
        if (!key) {
          return;
        }
        if (typeof rate === 'number' && Number.isFinite(rate)) {
          normalisedRates.set(key, rate);
        }
      });

      return uniqueQuotes
        .map((currency) => {
          const rate = normalisedRates.get(currency);
          if (typeof rate !== 'number') {
            return undefined;
          }
          return {
            baseCurrency: base,
            quoteCurrency: currency,
            rate,
            fetchedAt,
          };
        })
        .filter(Boolean);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}

module.exports = {
  HttpFxProvider,
};
