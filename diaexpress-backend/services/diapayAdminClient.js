const axios = require('axios');
const { getAdminClient, wrapError } = require('./diapayClient');

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== ''),
  );
}

async function listPayments(filters = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/payments', {
      params: sanitizeParams(filters),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function getPaymentSummary(filters = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/payments/summary', {
      params: sanitizeParams(filters),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function findPaymentById(paymentId) {
  if (!paymentId) {
    throw new Error('paymentId is required to fetch diaPay payment');
  }

  try {
    const { data } = await getAdminClient().get(`/admin/payments/${paymentId}`);
    return data?.payment ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    wrapError(error);
  }
}

async function getPaymentEvents(paymentId) {
  if (!paymentId) {
    throw new Error('paymentId is required to fetch diaPay payment events');
  }

  try {
    const { data } = await getAdminClient().get(`/admin/payments/${paymentId}/events`);
    return data?.events ?? [];
  } catch (error) {
    wrapError(error);
  }
}

async function listNotificationJobs(filters = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/notifications/jobs', {
      params: sanitizeParams(filters),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function listProviders() {
  try {
    const { data } = await getAdminClient().get('/admin/providers');
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function listProviderConfigs(filters = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/providers/configs', {
      params: sanitizeParams(filters),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function createProviderConfig(payload) {
  try {
    const { data } = await getAdminClient().post('/admin/providers/configs', payload);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function updateProviderConfig(configId, payload) {
  if (!configId) {
    throw new Error('configId is required to update provider configuration');
  }

  try {
    const { data } = await getAdminClient().patch(`/admin/providers/configs/${configId}`, payload);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function deleteProviderConfig(configId) {
  if (!configId) {
    throw new Error('configId is required to delete provider configuration');
  }

  try {
    const { data } = await getAdminClient().delete(`/admin/providers/configs/${configId}`);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function listProviderErrors(filters = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/providers/errors', {
      params: sanitizeParams(filters),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function findNotificationJobById(jobId) {
  if (!jobId) {
    throw new Error('jobId is required to fetch diaPay notification job');
  }

  try {
    const { data } = await getAdminClient().get(`/admin/notifications/jobs/${jobId}`);
    return data?.job ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    wrapError(error);
  }
}

async function listApiKeys({ includeRevoked } = {}) {
  try {
    const { data } = await getAdminClient().get('/admin/api-keys', {
      params: sanitizeParams({ includeRevoked }),
    });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function getApiKeyById(keyId) {
  if (!keyId) {
    throw new Error('keyId is required to fetch diaPay API key');
  }

  try {
    const { data } = await getAdminClient().get(`/admin/api-keys/${keyId}`);
    return data?.apiKey ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    wrapError(error);
  }
}

async function createApiKey(payload) {
  try {
    const { data } = await getAdminClient().post('/admin/api-keys', payload);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function updateApiKeyName(keyId, name) {
  if (!keyId) {
    throw new Error('keyId is required to update diaPay API key');
  }

  try {
    const { data } = await getAdminClient().patch(`/admin/api-keys/${keyId}`, { name });
    return data;
  } catch (error) {
    wrapError(error);
  }
}

async function revokeApiKey(keyId) {
  if (!keyId) {
    throw new Error('keyId is required to revoke diaPay API key');
  }

  try {
    const { data } = await getAdminClient().delete(`/admin/api-keys/${keyId}`);
    return data;
  } catch (error) {
    wrapError(error);
  }
}

module.exports = {
  listPayments,
  getPaymentSummary,
  findPaymentById,
  getPaymentEvents,
  listNotificationJobs,
  findNotificationJobById,
  listApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKeyName,
  revokeApiKey,
  listProviders,
  listProviderConfigs,
  createProviderConfig,
  updateProviderConfig,
  deleteProviderConfig,
  listProviderErrors,
};
