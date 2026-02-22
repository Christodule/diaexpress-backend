import { apiClient } from '@/lib/api/client';
import type { LogisticsAddress } from '@/src/types/logistics';

export async function fetchAddresses() {
  const data = await apiClient<{ addresses: LogisticsAddress[] }>('api/addresses');
  return (data?.addresses ?? []).map((address) => ({
    ...address,
    street: address.street || (address as LogisticsAddress & { line1?: string }).line1
  }));
}

export async function upsertAddress(id: string | null, payload: Partial<LogisticsAddress>) {
  if (id) {
    return apiClient<LogisticsAddress>(`api/addresses/${id}`, {
      method: 'PUT',
      json: payload
    });
  }

  return apiClient<LogisticsAddress>('api/addresses', {
    method: 'POST',
    json: payload
  });
}
