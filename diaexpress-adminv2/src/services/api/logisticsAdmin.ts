import { apiClient } from '@/lib/api/client';
import type { AdminAddress, Country, Embarkment, MarketPoint, TransportLine } from '@/src/types/logistics';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';

export type CountryFilters = PaginatedParams & { active?: boolean };

export async function fetchCountries(filters: CountryFilters = {}): Promise<PaginatedResult<Country>> {
  return apiClient('api/admin/countries', {
    searchParams: {
      page: filters.page,
      limit: filters.pageSize,
      active: typeof filters.active === 'boolean' ? String(filters.active) : undefined,
    },
  });
}

export async function createCountry(payload: Partial<Country>) {
  return apiClient<Country>('api/admin/countries', {
    method: 'POST',
    json: payload,
  });
}

export async function updateCountry(id: string, payload: Partial<Country>) {
  return apiClient<Country>(`api/admin/countries/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function disableCountry(id: string) {
  return apiClient<Country>(`api/admin/countries/${id}`, { method: 'DELETE' });
}

export type MarketPointFilters = PaginatedParams & { countryId?: string; active?: boolean; search?: string };

export async function fetchMarketPoints(filters: MarketPointFilters = {}): Promise<PaginatedResult<MarketPoint>> {
  return apiClient('api/admin/market-points', {
    searchParams: {
      page: filters.page,
      limit: filters.pageSize,
      countryId: filters.countryId,
      active: typeof filters.active === 'boolean' ? String(filters.active) : undefined,
      search: filters.search,
    },
  });
}

export async function createMarketPoint(payload: Partial<MarketPoint>) {
  return apiClient<MarketPoint>('api/admin/market-points', {
    method: 'POST',
    json: payload,
  });
}

export async function updateMarketPoint(id: string, payload: Partial<MarketPoint>) {
  return apiClient<MarketPoint>(`api/admin/market-points/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function disableMarketPoint(id: string) {
  return apiClient<MarketPoint>(`api/admin/market-points/${id}`, { method: 'DELETE' });
}

export type AddressFilters = PaginatedParams & { marketPointId?: string; active?: boolean };

export async function fetchLogisticsAddresses(filters: AddressFilters = {}): Promise<PaginatedResult<AdminAddress>> {
  return apiClient('api/admin/addresses', {
    searchParams: {
      page: filters.page,
      limit: filters.pageSize,
      marketPointId: filters.marketPointId,
      active: typeof filters.active === 'boolean' ? String(filters.active) : undefined,
    },
  });
}

export async function createLogisticsAddress(payload: Partial<AdminAddress>) {
  return apiClient<AdminAddress>('api/admin/addresses', {
    method: 'POST',
    json: payload,
  });
}

export async function updateLogisticsAddress(id: string, payload: Partial<AdminAddress>) {
  return apiClient<AdminAddress>(`api/admin/addresses/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function disableLogisticsAddress(id: string) {
  return apiClient<AdminAddress>(`api/admin/addresses/${id}`, { method: 'DELETE' });
}

export type TransportLineFilters = PaginatedParams & {
  originMarketPointId?: string;
  destinationMarketPointId?: string;
  transportType?: string;
  active?: boolean;
};

export async function fetchTransportLinesAdmin(
  filters: TransportLineFilters = {},
): Promise<PaginatedResult<TransportLine>> {
  return apiClient('api/admin/expedition-lines', {
    searchParams: {
      page: filters.page,
      limit: filters.pageSize,
      originMarketPointId: filters.originMarketPointId,
      destinationMarketPointId: filters.destinationMarketPointId,
      transportType: filters.transportType,
      active: typeof filters.active === 'boolean' ? String(filters.active) : undefined,
    },
  });
}

export async function createTransportLineAdmin(payload: Partial<TransportLine>) {
  return apiClient<TransportLine>('api/admin/expedition-lines', {
    method: 'POST',
    json: payload,
  });
}

export async function updateTransportLineAdmin(id: string, payload: Partial<TransportLine>) {
  return apiClient<TransportLine>(`api/admin/expedition-lines/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function disableTransportLineAdmin(id: string) {
  return apiClient<TransportLine>(`api/admin/expedition-lines/${id}`, { method: 'DELETE' });
}

export type EmbarkmentFilters = PaginatedParams & {
  transportLineId?: string;
  status?: string;
  transportType?: string;
  active?: boolean;
  departureFrom?: string;
  departureTo?: string;
};

export async function fetchEmbarkments(filters: EmbarkmentFilters = {}): Promise<PaginatedResult<Embarkment>> {
  return apiClient('api/admin/embarkments', {
    searchParams: {
      page: filters.page,
      limit: filters.pageSize,
      transportLineId: filters.transportLineId,
      status: filters.status,
      transportType: filters.transportType,
      active: typeof filters.active === 'boolean' ? String(filters.active) : undefined,
      departureFrom: filters.departureFrom,
      departureTo: filters.departureTo,
    },
  });
}

export async function createEmbarkment(payload: Partial<Embarkment>) {
  return apiClient<Embarkment>('api/admin/embarkments', {
    method: 'POST',
    json: payload,
  });
}

export async function updateEmbarkment(id: string, payload: Partial<Embarkment>) {
  return apiClient<Embarkment>(`api/admin/embarkments/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function disableEmbarkment(id: string) {
  return apiClient<Embarkment>(`api/admin/embarkments/${id}`, { method: 'DELETE' });
}
