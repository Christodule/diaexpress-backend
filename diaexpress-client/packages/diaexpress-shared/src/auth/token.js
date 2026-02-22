const toTrimmedString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const uniqueList = (values = []) => {
  return Array.from(new Set(values.filter(Boolean)));
};

const env = typeof process !== 'undefined' && process?.env ? process.env : {};

const envTemplateCandidates = uniqueList([
  toTrimmedString(env.NEXT_PUBLIC_DIAEXPRESS_CLERK_JWT_TEMPLATE),
  toTrimmedString(env.NEXT_PUBLIC_DIAEXPRESS_CLERK_TEMPLATE),
  toTrimmedString(env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE),
  toTrimmedString(env.NEXT_PUBLIC_CLERK_TEMPLATE),
  toTrimmedString(env.NEXT_PUBLIC_CLERK_BACKEND_TOKEN_TEMPLATE),
  toTrimmedString(env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE_NAME),
  toTrimmedString(env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE_ID),
]);

const defaultTemplateCandidates = ['diaexpress-backend', 'backend'];

const templateCandidates = uniqueList([
  ...envTemplateCandidates,
  ...defaultTemplateCandidates,
]);

const tryGetToken = async (getToken, options) => {
  if (typeof getToken !== 'function') {
    return null;
  }

  try {
    const token = await getToken(options);
    return token || null;
  } catch (_error) {
    return null;
  }
};

export const resolveAuthToken = async (getToken, options = {}) => {
  if (typeof getToken !== 'function') {
    return null;
  }

  const directToken = await tryGetToken(getToken, options);
  if (directToken) {
    return directToken;
  }

  const baseOptions = { ...options };
  delete baseOptions.template;

  for (const template of templateCandidates) {
    const candidateOptions = template
      ? { ...baseOptions, template }
      : baseOptions;
    const token = await tryGetToken(getToken, candidateOptions);
    if (token) {
      return token;
    }
  }

  const fallbackToken = await tryGetToken(getToken, baseOptions);
  return fallbackToken;
};

export const buildAuthHeaders = async (getToken, headers = {}, options = {}) => {
  const token = await resolveAuthToken(getToken, options);
  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};
