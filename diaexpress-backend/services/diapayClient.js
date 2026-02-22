const axios = require("axios");

const DIAPAY_API_URL = process.env.DIAPAY_API_URL;
const DEFAULT_TIMEOUT = 10000;

const clientCache = new Map();

function normalizeBaseUrl(url) {
  if (!url) {
    return url;
  }
  return url.replace(/\/+$/, "");
}

function resolveTimeout() {
  const rawTimeout = process.env.DIAPAY_API_TIMEOUT ?? process.env.DIAPAY_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_TIMEOUT;
  }

  const parsed = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TIMEOUT;
}

function buildAuthHeaders({ includeApiKey = true, includeBearer = true } = {}) {
  const headers = {};

  if (includeApiKey && process.env.DIAPAY_API_KEY) {
    headers["x-api-key"] = process.env.DIAPAY_API_KEY;
  }

  if (includeBearer && process.env.DIAPAY_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIAPAY_BEARER_TOKEN}`;
  }

  return headers;
}

function applyAuthHeaders(headers = {}, options = {}) {
  const { includeApiKey = true, includeBearer = true } = options;
  const sanitized = { ...headers };

  if (!includeApiKey) {
    delete sanitized["x-api-key"];
    delete sanitized["X-Api-Key"];
  }

  if (!includeBearer) {
    delete sanitized.Authorization;
  }

  return {
    ...sanitized,
    ...buildAuthHeaders({ includeApiKey, includeBearer }),
  };
}

function getClient(options = {}) {
  const { includeApiKey = true, includeBearer = true } = options;
  const cacheKey = `${includeApiKey ? "key" : "nokey"}:${includeBearer ? "bearer" : "nobearer"}`;

  if (!clientCache.has(cacheKey)) {
    if (!DIAPAY_API_URL) {
      throw new Error("DIAPAY_API_URL must be configured to use diaPay");
    }

    const authOptions = { includeApiKey, includeBearer };

    const httpClient = axios.create({
      baseURL: normalizeBaseUrl(DIAPAY_API_URL),
      timeout: resolveTimeout(),
      headers: applyAuthHeaders(
        {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        authOptions,
      ),
    });

    httpClient.interceptors.request.use((config) => {
      config.headers = applyAuthHeaders(
        {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(config.headers || {}),
        },
        authOptions,
      );
      return config;
    });

    clientCache.set(cacheKey, httpClient);
  }

  return clientCache.get(cacheKey);
}

function getAdminClient() {
  return getClient({ includeApiKey: false, includeBearer: true });
}

function wrapError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      (data && (data.message || data.error || data.description)) || error.message || "Unknown error";
    const wrapped = new Error(`diaPay request failed: ${message}`);
    wrapped.status = status;
    if (data !== undefined) {
      wrapped.details = data;
    }
    if (error.response) {
      wrapped.response = error.response;
    }
    throw wrapped;
  }

  throw error;
}

function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null),
  );
}

function sanitizeParams(params = {}) {
  if (!params || typeof params !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

async function createPayment(payload = {}) {
  try {
    const body = { ...payload };
    if (body.metadata) {
      body.metadata = sanitizeMetadata(body.metadata);
    }

    const { data } = await getClient().post("/payments", body);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function createDiaExpressPayment(payload = {}) {
  try {
    const body = { ...payload };
    if (body.metadata) {
      body.metadata = sanitizeMetadata(body.metadata);
    }

    const { data } = await getClient().post("/diaexpress/payments", body);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function listDiaExpressPayments(params = {}) {
  try {
    const filtered = sanitizeParams(params);
    const { data } = await getClient().get("/diaexpress/payments", { params: filtered });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function getPayment(paymentId) {
  if (!paymentId) {
    throw new Error("paymentId is required to fetch diaPay payment");
  }

  try {
    const { data } = await getClient().get(`/payments/${paymentId}`);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function getPaymentById(paymentId) {
  if (!paymentId) {
    throw new Error("paymentId is required to fetch diaPay payment");
  }

  try {
    const { data } = await getClient().get(`/payments/${paymentId}`);
    return data?.payment ?? data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    wrapError(error);
  }
}

module.exports = {
  getClient,
  getAdminClient,
  createPayment,
  createDiaExpressPayment,
  listDiaExpressPayments,
  getPayment,
  getPaymentById,
  wrapError,
  sanitizeMetadata,
  sanitizeParams,
};
