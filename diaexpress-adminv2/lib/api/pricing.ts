import { apiClient } from './client';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { paginateCollection } from '@/src/lib/pagination';
import type { PricingRule } from '@/src/types/logistics';

export async function fetchPricing(params: PaginatedParams = {}): Promise<PaginatedResult<PricingRule>> {
  const data = await apiClient<PricingRule[]>('/api/pricing');
  const pricing = Array.isArray(data) ? data : [];

  return paginateCollection(
    pricing,
    params,
    (rule, searchTerm) =>
      [rule.route, rule.origin, rule.destination, rule.provider, rule.transportType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTerm))
  );
}
