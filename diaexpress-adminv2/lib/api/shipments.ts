import { apiClient } from './client';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { paginateCollection } from '@/src/lib/pagination';
import type { Shipment } from '@/src/types/logistics';

export async function fetchShipments(params: PaginatedParams = {}): Promise<PaginatedResult<Shipment>> {
  const data = await apiClient<{ shipments?: Shipment[] } | Shipment[]>('/api/shipments');
  const shipments = Array.isArray(data) ? data : Array.isArray(data?.shipments) ? data.shipments : [];

  return paginateCollection(
    shipments,
    params,
    (shipment, searchTerm) =>
      [shipment.trackingCode, shipment.origin, shipment.destination, shipment.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTerm))
  );
}
