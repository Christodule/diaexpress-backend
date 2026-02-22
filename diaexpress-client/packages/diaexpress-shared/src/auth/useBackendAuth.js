import { useCallback } from 'react';
import { useDevAdminSession } from './useDevAdminSession';
import { resolveAuthToken } from './token';
import { useSafeAuth } from './useSafeClerk';

const pickEnvValue = (...keys) => {
  if (typeof process === 'undefined' || !process?.env) {
    return '';
  }

  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const DEFAULT_TEMPLATE = (() => {
  const envTemplate = pickEnvValue(
    'NEXT_PUBLIC_DIAEXPRESS_BACKEND_TEMPLATE',
    'NEXT_PUBLIC_DIAEXPRESS_CLERK_BACKEND_TEMPLATE',
    'NEXT_PUBLIC_DIAEXPRESS_CLERK_TEMPLATE',
    'NEXT_PUBLIC_CLERK_BACKEND_TEMPLATE',
    'NEXT_PUBLIC_CLERK_JWT_TEMPLATE',
  );

  if (envTemplate) {
    return envTemplate;
  }

  return 'diaexpress-backend';
})();

export const useBackendAuth = () => {
  const auth = useSafeAuth();
  const devSession = useDevAdminSession();
  const { isActive: devActive, getToken: getDevToken } = devSession;

  const getBackendToken = useCallback(
    async (options = {}) => {
      if (devActive) {
        return getDevToken();
      }

      const token = await resolveAuthToken(auth.getToken, {
        template: DEFAULT_TEMPLATE,
        ...options,
      });
      return token;
    },
    [auth.getToken, devActive, getDevToken],
  );

  const requireToken = useCallback(
    async (options = {}) => {
      const token = await getBackendToken(options);

      if (!token) {
        throw new Error('Authentification requise pour contacter l’API DiaExpress.');
      }

      return token;
    },
    [getBackendToken],
  );

  return {
    ...auth,
    isLoaded: devActive ? true : auth.isLoaded,
    isSignedIn: devActive ? true : auth.isSignedIn,
    getToken: getBackendToken,
    getBackendToken,
    requireToken,
    devSession,
  };
};
