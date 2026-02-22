'use client';

import { useEffect, useState } from 'react';
import { fetchTransportLines } from '@/src/services/api/expeditions';
import type { TransportLine } from '@/src/types/logistics';

export function useTransportLinesOptions() {
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const result = await fetchTransportLines({ page: 1, pageSize: 200 });
        if (!mounted) return;
        setLines(result.items);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message || 'Impossible de charger les lignes');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return { lines, loading, error };
}
