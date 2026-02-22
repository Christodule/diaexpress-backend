'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveAuthToken } from '@/lib/api/auth';

export function useAdminAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolved = await resolveAuthToken();
      setToken(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { token, loading, error, refresh };
}
