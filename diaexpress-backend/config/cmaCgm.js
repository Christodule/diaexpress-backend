const path = require('path');

const mode = (process.env.CMACGM_MODE || '').toLowerCase();
const sandboxFlag = String(process.env.CMACGM_USE_SANDBOX || '').toLowerCase();
const sandboxEnabled =
  sandboxFlag === 'true' ||
  sandboxFlag === '1' ||
  mode === 'sandbox' ||
  (!process.env.CMACGM_CLIENT_ID && !process.env.CMACGM_API_KEY);

const fixturesBasePath = path.join(__dirname, '..', 'fixtures', 'cma-cgm');

const quoteFixturePath =
  process.env.CMACGM_SANDBOX_QUOTE_FIXTURE_PATH ||
  process.env.CMACGM_SANDBOX_FIXTURE_PATH ||
  path.join(fixturesBasePath, 'quote.sample.json');

const bookingFixturePath =
  process.env.CMACGM_SANDBOX_BOOKING_FIXTURE_PATH ||
  path.join(fixturesBasePath, 'booking.sample.json');

const trackingFixturePath =
  process.env.CMACGM_SANDBOX_TRACKING_FIXTURE_PATH ||
  path.join(fixturesBasePath, 'tracking.sample.json');

module.exports = {
  api: {
    baseURL: process.env.CMACGM_API_URL || 'https://sandbox.apis.cma-cgm.com',
    quotePath: process.env.CMACGM_QUOTE_PATH || '/v1/quotes',
    bookingPath: process.env.CMACGM_BOOKING_PATH || '/v1/bookings',
    trackingPath: process.env.CMACGM_TRACKING_PATH || '/v1/tracking',
    timeout: Number(process.env.CMACGM_TIMEOUT_MS) || 10_000,
    accountNumber: process.env.CMACGM_ACCOUNT_NUMBER,
    apiKey: process.env.CMACGM_API_KEY,
  },
  oauth: {
    tokenURL: process.env.CMACGM_TOKEN_URL,
    clientId: process.env.CMACGM_CLIENT_ID,
    clientSecret: process.env.CMACGM_CLIENT_SECRET,
    scope: process.env.CMACGM_SCOPE,
  },
  sandbox: {
    enabled: sandboxEnabled,
    fixtures: {
      quote: quoteFixturePath,
      booking: bookingFixturePath,
      tracking: trackingFixturePath,
    },
  },
};
