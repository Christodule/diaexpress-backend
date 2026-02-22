import { useEffect, useState } from 'react';
import { fetchQuoteMeta } from '../api/logistics';

let cachedMeta = null;
let pendingPromise = null;

export function useQuoteMeta(initialOrigins = []) {
  const [origins, setOrigins] = useState(Array.isArray(initialOrigins) ? initialOrigins : []);
  const [loading, setLoading] = useState(!cachedMeta && origins.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadMeta = async () => {
      if (cachedMeta) {
        if (isMounted) {
          setOrigins(cachedMeta.origins || []);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        if (!pendingPromise) {
          pendingPromise = fetchQuoteMeta()
            .then((data) => {
              cachedMeta = data || {};
              return cachedMeta;
            })
            .finally(() => {
              pendingPromise = null;
            });
        }

        const meta = await pendingPromise;
        if (!isMounted) return;
        setOrigins(Array.isArray(meta?.origins) ? meta.origins : []);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Erreur lors du chargement des données.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchQuoteMeta();
      cachedMeta = data || {};
      setOrigins(Array.isArray(cachedMeta.origins) ? cachedMeta.origins : []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  return {
    origins,
    loading,
    error,
    refresh,
  };
}

export function resetQuoteMetaCache() {
  cachedMeta = null;
}
