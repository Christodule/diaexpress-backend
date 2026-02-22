'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchShipments, type ShipmentListParams } from '@/src/services/api/logisticsShipments';
import type { Shipment } from '@/src/types/logistics';
import type { PaginatedResult } from '@/src/types/pagination';

export type UseShipmentsParams = ShipmentListParams & {
  refreshKey?: number;
};

export function useShipments({ pageSize = 10, page = 1, search = '', status, refreshKey }: UseShipmentsParams = {}) {
  const [data, setData] = useState<PaginatedResult<Shipment> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchShipments({ page, pageSize, search, status });
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

    void load();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search, status, refreshKey, reloadKey]);

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
    refresh: () => setReloadKey((value) => value + 1),
  };
}
