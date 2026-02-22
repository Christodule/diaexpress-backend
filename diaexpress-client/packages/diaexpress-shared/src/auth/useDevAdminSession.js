import { useCallback, useEffect, useMemo, useState } from 'react';

const toTrimmed = (value) =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const pickEnv = (...keys) => {
  if (typeof process === 'undefined' || !process?.env) {
    return '';
  }

  for (const key of keys) {
    const raw = process.env[key];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return '';
};

const NODE_ENV = typeof process !== 'undefined' ? process.env?.NODE_ENV : 'development';

const DEV_NAME =
  pickEnv('NEXT_PUBLIC_DIAEXPRESS_DEV_ADMIN_NAME', 'NEXT_PUBLIC_DIAEXPRESS_SANDBOX_ADMIN_NAME') ||
  'Sandbox Admin';

const DEV_EMAIL =
  pickEnv('NEXT_PUBLIC_DIAEXPRESS_DEV_ADMIN_EMAIL', 'NEXT_PUBLIC_DIAEXPRESS_SANDBOX_ADMIN_EMAIL') ||
  'sandbox-admin@diaexpress.test';

const DEV_TOKEN = (() => {
  const explicitToken = pickEnv(
    'NEXT_PUBLIC_DIAEXPRESS_DEV_ADMIN_TOKEN',
    'NEXT_PUBLIC_DIAEXPRESS_SANDBOX_ADMIN_TOKEN',
  );

  if (explicitToken) {
    return explicitToken;
  }

  if (NODE_ENV !== 'production') {
    return 'sandbox-admin-token';
  }

  return '';
})();

const STORAGE_KEY = 'diaexpress.admin.devAuth.disabled';

const splitName = (fullName) => {
  const trimmed = toTrimmed(fullName);
  if (!trimmed) {
    return { firstName: 'Admin', lastName: null };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || null };
};

const DEV_ENABLED = Boolean(DEV_TOKEN);

const INITIAL_IS_ACTIVE = DEV_ENABLED && NODE_ENV !== 'production';

const readStoredPreference = () => {
  if (!DEV_ENABLED || typeof window === 'undefined') {
    return INITIAL_IS_ACTIVE;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'disabled';
  } catch (_error) {
    return INITIAL_IS_ACTIVE;
  }
};

export const useDevAdminSession = () => {
  const [isActive, setIsActive] = useState(INITIAL_IS_ACTIVE);

  useEffect(() => {
    if (!DEV_ENABLED || typeof window === 'undefined') {
      return;
    }

    setIsActive(readStoredPreference());
  }, []);

  const disable = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, 'disabled');
      } catch (_error) {
        // ignore
      }
      window.location.reload();
    } else {
      setIsActive(false);
    }
  }, []);

  const enable = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (_error) {
        // ignore
      }
      window.location.reload();
    } else {
      setIsActive(true);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (!DEV_ENABLED || !isActive) {
      return null;
    }
    return DEV_TOKEN;
  }, [isActive]);

  const user = useMemo(() => {
    if (!DEV_ENABLED || !isActive) {
      return null;
    }

    const { firstName, lastName } = splitName(DEV_NAME);
    return {
      id: 'dev-admin',
      firstName,
      lastName,
      fullName: DEV_NAME,
      emailAddresses: [{ emailAddress: DEV_EMAIL }],
      primaryEmailAddress: { emailAddress: DEV_EMAIL },
      publicMetadata: { role: 'admin', roles: ['admin'], isAdmin: true },
      privateMetadata: { role: 'admin', roles: ['admin'], isAdmin: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [isActive]);

  return {
    isEnabled: DEV_ENABLED,
    isActive: DEV_ENABLED && isActive,
    isLoaded: DEV_ENABLED ? isActive : false,
    user,
    getToken,
    signOut: disable,
    enable,
  };
};

export default useDevAdminSession;
