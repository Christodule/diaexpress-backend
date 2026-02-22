import { apiClient } from './client';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { paginateCollection } from '@/src/lib/pagination';
import type { LogisticsAddress } from '@/src/types/logistics';

export async function fetchAddresses(params: PaginatedParams = {}): Promise<PaginatedResult<LogisticsAddress>> {
  const data = await apiClient<{ addresses?: LogisticsAddress[] } | LogisticsAddress[]>('/api/addresses');
  const addresses = (Array.isArray(data) ? data : Array.isArray(data?.addresses) ? data.addresses : []).map(
    (address) => ({
      ...address,
      street: address.street || (address as LogisticsAddress & { line1?: string }).line1
    })
  );

  return paginateCollection(
    addresses,
    params,
    (address, searchTerm) =>
      [address.label, address.city, address.country, address.type]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTerm))
  );
}
