'use client';

import { useEffect, useState } from 'react';
import { fetchQuoteMeta, type QuoteMetaOrigin } from '@/lib/api/quotes';

export function useQuoteMeta() {
  const [origins, setOrigins] = useState<QuoteMetaOrigin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchQuoteMeta();
        if (!isMounted) return;
        const nextOrigins = Array.isArray(data?.origins) ? data.origins : [];
        setOrigins(nextOrigins);

        if (!nextOrigins.length) {
          console.error('Quote meta loaded but contains no origins');
          setError(
            'Aucune origine disponible – configurez des tarifs dans la section Expédition / Tarifs.'
          );
        } else {
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Erreur lors du chargement des métadonnées devis :', err);
        setError(err?.message || 'Erreur lors du chargement des métadonnées devis.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const reload = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchQuoteMeta();
      const nextOrigins = Array.isArray(data?.origins) ? data.origins : [];
      setOrigins(nextOrigins);
      if (!nextOrigins.length) {
        setError(
          'Aucune origine disponible – configurez des tarifs dans la section Expédition / Tarifs.'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des métadonnées devis.');
    } finally {
      setLoading(false);
    }
  };

  return { origins, loading, error, reload };
}
