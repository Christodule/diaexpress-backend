const dotenv = require('dotenv');

dotenv.config();

const toNumber = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
    return false;
  }
  return defaultValue;
};

const toList = (value = '') =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

module.exports = {
  server: {
    port: toNumber(process.env.PORT, 5000),
    corsOrigins: toList(process.env.CORS_ORIGINS),
    enableRequestLogging: toBoolean(process.env.REQUEST_LOGGING, true),
  },
  monitoring: {
    enableQuoteEstimationProbe: toBoolean(process.env.ENABLE_QUOTE_ESTIMATION_PROBE, false),
  },
  services: {
    diaPay: {
      baseUrl: process.env.DIAPAY_BASE_URL || '',
      webhookSecret: process.env.DIAPAY_WEBHOOK_SECRET || '',
    },
    cmaCgm: {
      mode: process.env.CMACGM_MODE || '',
    },
    fedex: {
      mode: process.env.FEDEX_MODE || '',
    },
    integrations: {
      apiKeys: toList(process.env.INTEGRATION_API_KEYS),
    },
  },
};
