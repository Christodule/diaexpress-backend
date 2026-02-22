const path = require('path');

const mode = (process.env.FEDEX_MODE || '').toLowerCase();
const sandboxFlag = String(process.env.FEDEX_USE_SANDBOX || '').toLowerCase();
const sandboxEnabled =
  sandboxFlag === 'true' ||
  sandboxFlag === '1' ||
  mode === 'sandbox' ||
  (!process.env.FEDEX_CLIENT_ID && !process.env.FEDEX_API_KEY);

const fixturesBasePath = path.join(__dirname, '..', 'fixtures', 'fedex');

module.exports = {
  api: {
    baseURL: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com',
    bookingPath: process.env.FEDEX_BOOKING_PATH || '/ship/v1/shipments',
    trackingPath: process.env.FEDEX_TRACKING_PATH || '/track/v1/trackingnumbers',
    timeout: Number(process.env.FEDEX_TIMEOUT_MS) || 10_000,
  },
  oauth: {
    tokenURL: process.env.FEDEX_TOKEN_URL || 'https://apis-sandbox.fedex.com/oauth/token',
    clientId: process.env.FEDEX_CLIENT_ID,
    clientSecret: process.env.FEDEX_CLIENT_SECRET,
    scope: process.env.FEDEX_SCOPE || 'oob',
  },
  apiKey: process.env.FEDEX_API_KEY,
  sandbox: {
    enabled: sandboxEnabled,
    fixtures: {
      booking:
        process.env.FEDEX_SANDBOX_BOOKING_FIXTURE_PATH ||
        path.join(fixturesBasePath, 'booking.sample.json'),
      tracking:
        process.env.FEDEX_SANDBOX_TRACKING_FIXTURE_PATH ||
        path.join(fixturesBasePath, 'tracking.sample.json'),
    },
  },
};
