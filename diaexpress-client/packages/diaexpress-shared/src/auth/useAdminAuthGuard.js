import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useBackendAuth } from './useBackendAuth';

const SIGN_IN_PATH = '/sign-in';

export const useAdminAuthGuard = () => {
  const router = useRouter();
  const auth = useBackendAuth();
  const { isLoaded, isSignedIn } = auth;

  const isAdminReady = useMemo(() => isLoaded && isSignedIn, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;

    const target = new URL(SIGN_IN_PATH, window.location.href);
    target.searchParams.set('reason', 'unauthenticated');
    router.replace(target.toString());
  }, [isLoaded, isSignedIn, router]);

  const requireAdminToken = useCallback(
    async (options = {}) => {
      if (!isAdminReady) {
        throw new Error('Authentification requise pour les pages administrateur.');
      }
      return auth.requireToken(options);
    },
    [auth, isAdminReady],
  );

  return { ...auth, isAdminReady, requireAdminToken };
};

export default useAdminAuthGuard;
