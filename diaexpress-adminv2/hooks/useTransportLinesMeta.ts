'use client';

import { useEffect, useState } from 'react';
import { fetchTransportLinesMeta } from '@/src/services/api/expeditions';

export function useTransportLinesMeta() {
  const [data, setData] = useState<{ origins: { origin: string; destinations: { destination: string; transportTypes: string[]; transportLineId: string; estimatedTransitDays?: number }[] }[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = await fetchTransportLinesMeta();
        setData(meta);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return { data, loading, error };
}
