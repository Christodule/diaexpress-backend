const BaseCustodian = require('./BaseCustodian');

/**
 * Coinbase Commerce integration for hosted invoices and charge monitoring.
 * The provider exposes address creation, withdrawal initiation (via payouts)
 * and transaction polling capabilities.
 */
class CoinbaseCommerceProvider extends BaseCustodian {
  constructor(options = {}) {
    super({
      baseURL: options.baseURL || process.env.COINBASE_COMMERCE_API_BASE_URL || 'https://api.commerce.coinbase.com',
      apiKey: options.apiKey || process.env.COINBASE_COMMERCE_API_KEY,
      axiosInstance: options.axiosInstance,
    });

    this.defaultConfirmations = Number(options.defaultConfirmations || process.env.COINBASE_REQUIRED_CONFIRMATIONS || 2);
  }

  buildHeaders(extraHeaders = {}, config = {}) {
    return super.buildHeaders(
      {
        'Content-Type': 'application/json',
        'X-CC-Version': extraHeaders['X-CC-Version'] || '2018-03-22',
        ...extraHeaders,
      },
      config
    );
  }

  async createDepositAddress({ assetSymbol, customerRef, amount, currency, metadata = {} }) {
    const payload = {
      pricing_type: amount ? 'fixed_price' : 'no_price',
      local_price: amount
        ? {
            amount: amount?.toString?.() || amount,
            currency: currency || 'USD',
          }
        : undefined,
      metadata: {
        customerRef,
        assetSymbol,
        ...metadata,
      },
    };

    const data = await this.request({
      method: 'POST',
      url: '/charges',
      data: payload,
    });

    const charge = data?.data || data;
    const address = charge?.addresses?.[assetSymbol?.toUpperCase?.() || 'USDC'] || null;

    return {
      chargeId: charge?.id,
      hostedUrl: charge?.hosted_url,
      address,
      network: charge?.pricing_type,
      blockchain: assetSymbol,
      requiredConfirmations: this.defaultConfirmations,
      raw: charge,
    };
  }

  async initiateWithdrawal({ amount, currency, destination, idempotencyKey, description }) {
    const payload = {
      amount: amount?.toString?.() || amount,
      currency,
      destination,
      description,
    };

    const data = await this.request({
      method: 'POST',
      url: '/payouts',
      data: payload,
      idempotencyKey,
    });

    const payout = data?.data || data;

    return {
      transactionId: payout?.id,
      status: payout?.status,
      submittedAt: payout?.created_at,
      raw: payout,
    };
  }

  async getTransactionStatus({ transactionId }) {
    const data = await this.request({
      method: 'GET',
      url: `/charges/${transactionId}`,
    });

    const charge = data?.data || data;
    const timeline = charge?.timeline || [];
    const last = timeline[timeline.length - 1] || {};

    return {
      transactionId: charge?.id,
      status: last?.status || charge?.status,
      confirmations: charge?.payments?.[0]?.block?.confirmations || 0,
      requiredConfirmations: this.defaultConfirmations,
      completedAt: last?.time,
      amount: charge?.pricing?.local?.amount,
      destinationAddress: charge?.addresses,
      raw: charge,
    };
  }
}

module.exports = CoinbaseCommerceProvider;
