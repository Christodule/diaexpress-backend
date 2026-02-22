const FireblocksProvider = require('./fireblocksProvider');
const CoinbaseCommerceProvider = require('./coinbaseCommerceProvider');

const providerClasses = {
  fireblocks: FireblocksProvider,
  'coinbase-commerce': CoinbaseCommerceProvider,
};

const providerAliases = {
  coinbase: 'coinbase-commerce',
  'coinbase commerce': 'coinbase-commerce',
  'coinbase_commerce': 'coinbase-commerce',
};

const providerCache = new Map();

const providers = {};

function defineProviderAlias(property, targetName) {
  Object.defineProperty(providers, property, {
    enumerable: true,
    configurable: false,
    get() {
      try {
        return getCryptoProvider(targetName);
      } catch (error) {
        if (error instanceof Error && /Unsupported crypto custodian provider/.test(error.message)) {
          return undefined;
        }
        throw error;
      }
    },
  });
}

function normaliseProviderKey(name = 'fireblocks') {
  if (typeof name !== 'string') {
    throw new TypeError('Crypto custodian provider name must be a string');
  }

  const trimmed = name.trim().toLowerCase();

  if (!trimmed) {
    throw new Error('Crypto custodian provider name cannot be empty');
  }

  return providerAliases[trimmed] || trimmed;
}

function getCryptoProvider(name = 'fireblocks', options = null) {
  const key = normaliseProviderKey(name);
  const Provider = providerClasses[key];

  if (!Provider) {
    throw new Error(`Unsupported crypto custodian provider: ${name}`);
  }

  const hasCustomOptions = options && Object.keys(options).length > 0;

  if (hasCustomOptions) {
    return new Provider(options);
  }

  if (!providerCache.has(key)) {
    providerCache.set(key, new Provider());
  }

  return providerCache.get(key);
}

defineProviderAlias('fireblocks', 'fireblocks');
defineProviderAlias('coinbase-commerce', 'coinbase-commerce');
defineProviderAlias('coinbase', 'coinbase');
defineProviderAlias('coinbase commerce', 'coinbase commerce');
defineProviderAlias('coinbase_commerce', 'coinbase_commerce');

module.exports = {
  getCryptoProvider,
  providers,
};
