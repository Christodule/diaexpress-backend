import { apiClient } from '@/lib/api/client';
import type { PackageType, PricingRule } from '@/src/types/logistics';

export async function fetchPricingRules() {
  const data = await apiClient<PricingRule[] | { pricing?: PricingRule[] }>('api/pricing');
  const pricing = Array.isArray(data) ? data : data.pricing || [];
  return { pricing };
}

export async function fetchPackageTypes() {
  const data = await apiClient<{ packageTypes: Array<PackageType & { name?: string }> }>('api/package-types');
  const packageTypes = (data.packageTypes || []).map((item) => ({
    ...item,
    label: item.label || item.name || ''
  }));
  return { packageTypes };
}

export async function createPackageType(payload: Partial<PackageType>) {
  const name = (payload as { name?: string }).name;
  const allowedTransportTypes = (payload as { allowedTransportTypes?: string[] }).allowedTransportTypes;
  const data = await apiClient<{ packageType: PackageType }>('api/package-types', {
    method: 'POST',
    json: {
      name: payload.label ?? name,
      description: payload.description,
      allowedTransportTypes
    }
  });
  return data.packageType;
}

export async function updatePackageType(id: string, payload: Partial<PackageType>) {
  const name = (payload as { name?: string }).name;
  const allowedTransportTypes = (payload as { allowedTransportTypes?: string[] }).allowedTransportTypes;
  const data = await apiClient<{ packageType: PackageType }>(`api/package-types/${id}`, {
    method: 'PUT',
    json: {
      name: payload.label ?? name,
      description: payload.description,
      allowedTransportTypes
    }
  });
  return data.packageType;
}

export async function createPricingRule(payload: Partial<PricingRule>) {
  return apiClient<PricingRule>('api/pricing', {
    method: 'POST',
    json: payload
  });
}

export async function updatePricingRule(id: string, payload: Partial<PricingRule>) {
  return apiClient<PricingRule>(`api/pricing/${id}`, {
    method: 'PUT',
    json: payload
  });
}
