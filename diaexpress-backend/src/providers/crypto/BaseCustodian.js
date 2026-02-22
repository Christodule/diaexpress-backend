const axios = require('axios');

/**
 * Base class providing shared helpers for custodian integrations.
 * Each concrete provider should override createDepositAddress,
 * initiateWithdrawal and getTransactionStatus with the provider specific
 * implementation.
 */
class BaseCustodian {
  constructor({ baseURL, apiKey, secret, axiosInstance } = {}) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.http = axiosInstance || axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  /**
   * Merge user supplied headers with the provider authentication headers.
   */
  buildHeaders(extraHeaders = {}, config = {}) {
    return {
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
      ...extraHeaders,
      ...(config.idempotencyKey ? { 'Idempotency-Key': config.idempotencyKey } : {}),
    };
  }

  /**
   * Perform an HTTP request while normalising provider errors to a uniform
   * structure so that the upper layers can rely on a consistent error payload.
   */
  async request(config) {
    try {
      const response = await this.http({
        ...config,
        headers: this.buildHeaders(config.headers, config),
      });
      return response.data;
    } catch (error) {
      const { response } = error;
      const message = response?.data?.message || response?.data?.error || error.message;
      const status = response?.status || 500;

      const normalizedError = new Error(message);
      normalizedError.status = status;
      normalizedError.details = response?.data;
      throw normalizedError;
    }
  }

  // ----- Interface definition -----

  async createDepositAddress() {
    throw new Error('createDepositAddress() must be implemented by subclasses');
  }

  async initiateWithdrawal() {
    throw new Error('initiateWithdrawal() must be implemented by subclasses');
  }

  async getTransactionStatus() {
    throw new Error('getTransactionStatus() must be implemented by subclasses');
  }
}

module.exports = BaseCustodian;
