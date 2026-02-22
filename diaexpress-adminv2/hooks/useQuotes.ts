'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchQuotes, type QuoteListParams } from '@/lib/api/quotes';
import type { Quote } from '@/src/types/logistics';
import type { PaginatedResult } from '@/src/types/pagination';

export type UseQuotesParams = QuoteListParams & {
  refreshKey?: number;
};

export function useQuotes({ pageSize = 10, page = 1, search = '', status, from, to, refreshKey }: UseQuotesParams = {}) {
  const [data, setData] = useState<PaginatedResult<Quote> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchQuotes({ page, pageSize, search, status, from, to });
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err as Error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search, status, from, to, refreshKey, reloadKey]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    totalPages,
    loading,
    error,
    refresh: () => setReloadKey((value) => value + 1)
  };
}
