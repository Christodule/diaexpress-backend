import { apiClient } from '@/lib/api/client';
import type { Expedition, TransportLine } from '@/src/types/logistics';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';

export type TransportLineFilters = PaginatedParams & {
  origin?: string;
  destination?: string;
  transportType?: string;
  isActive?: boolean;
  search?: string;
};

export async function fetchTransportLines(params: TransportLineFilters = {}): Promise<PaginatedResult<TransportLine>> {
  const data = await apiClient<PaginatedResult<TransportLine>>('api/expeditions/transport-lines', {
    searchParams: {
      page: params.page,
      pageSize: params.pageSize,
      origin: params.origin,
      destination: params.destination,
      transportType: params.transportType,
      isActive: typeof params.isActive === 'boolean' ? String(params.isActive) : undefined,
      search: params.search,
    },
  });

  return data;
}

export async function fetchTransportLineById(id: string) {
  return apiClient<TransportLine>(`api/expeditions/transport-lines/${id}`);
}

export async function createTransportLine(payload: Partial<TransportLine>) {
  return apiClient<TransportLine>('api/expeditions/transport-lines', {
    method: 'POST',
    json: payload,
  });
}

export async function updateTransportLine(id: string, payload: Partial<TransportLine>) {
  return apiClient<TransportLine>(`api/expeditions/transport-lines/${id}`, {
    method: 'PUT',
    json: payload,
  });
}

export async function disableTransportLine(id: string) {
  return apiClient<TransportLine>(`api/expeditions/transport-lines/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchTransportLinesMeta() {
  return apiClient<{ origins: { origin: string; destinations: { destination: string; transportTypes: string[]; transportLineId: string; estimatedTransitDays?: number }[] }[] }>(
    'api/expeditions/transport-lines/meta'
  );
}

export type ExpeditionFilters = PaginatedParams & {
  status?: string;
  origin?: string;
  destination?: string;
  transportType?: string;
  transportLineId?: string;
  departureFrom?: string;
  departureTo?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
};

export async function fetchExpeditions(params: ExpeditionFilters = {}): Promise<PaginatedResult<Expedition>> {
  return apiClient<PaginatedResult<Expedition>>('api/expeditions', {
    searchParams: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      origin: params.origin,
      destination: params.destination,
      transportType: params.transportType,
      transportLineId: params.transportLineId,
      departureFrom: params.departureFrom,
      departureTo: params.departureTo,
      arrivalFrom: params.arrivalFrom,
      arrivalTo: params.arrivalTo,
    },
  });
}

export async function createExpedition(payload: Partial<Expedition>) {
  return apiClient<Expedition>('api/expeditions', {
    method: 'POST',
    json: payload,
  });
}

export async function updateExpedition(id: string, payload: Partial<Expedition>) {
  return apiClient<Expedition>(`api/expeditions/${id}`, {
    method: 'PUT',
    json: payload,
  });
}

export async function fetchExpeditionById(id: string) {
  return apiClient<Expedition>(`api/expeditions/${id}`);
}
