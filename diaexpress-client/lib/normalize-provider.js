const DEFAULT_PROVIDER = 'unknown';

/**
 * Normalise a payment provider identifier so it can be safely used in URLs,
 * APIs or as lookup keys.
 *
 * - Strings are trimmed.
 * - Accents are removed.
 * - Whitespaces and underscores are converted to hyphens.
 * - Multiple hyphens are collapsed into one.
 * - The value is lower-cased.
 *
 * Falsy values fallback to the `unknown` provider which keeps downstream code
 * predictable and avoids subtle `undefined` checks.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeProvider(value) {
  if (typeof value !== 'string') {
    return DEFAULT_PROVIDER;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_PROVIDER;
  }

  const normalized = trimmed
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return normalized || DEFAULT_PROVIDER;
}

module.exports = { normalizeProvider, DEFAULT_PROVIDER };
