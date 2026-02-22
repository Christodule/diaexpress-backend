import { apiClient } from '@/lib/api/client';
import type { ApiKey, DiaPayAdminUser, NotificationJob, Payment, PaymentSummary } from '@/src/types/diapay';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { paginateCollection } from '@/src/lib/pagination';

export async function fetchPayments(params: PaginatedParams = {}): Promise<PaginatedResult<Payment>> {
  const data = await apiClient<{ items: Payment[]; total: number; page: number; pageSize: number }>('payments', {
    target: 'diapay',
    searchParams: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status as string | undefined,
      search: params.search
    }
  });

  if ('items' in data) {
    return {
      items: data.items,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize
    };
  }

  const list = (data as unknown as Payment[]) || [];
  return paginateCollection(list, params);
}

export function fetchPaymentSummary() {
  return apiClient<PaymentSummary>('payments/summary', { target: 'diapay' });
}

export function fetchPaymentById(id: string) {
  return apiClient<Payment>(`payments/${id}`, { target: 'diapay' });
}

export function fetchPaymentEvents(id: string) {
  return apiClient<{ events: Array<{ id: string; status: string; createdAt: string }> }>(`payments/${id}/events`, {
    target: 'diapay'
  });
}

export async function fetchJobs(params: PaginatedParams = {}): Promise<PaginatedResult<NotificationJob>> {
  const data = await apiClient<{ jobs: NotificationJob[] }>('notifications/jobs', { target: 'diapay' });
  return paginateCollection(data.jobs ?? [], params);
}

export function fetchJob(jobId: string) {
  return apiClient<NotificationJob>(`notifications/jobs/${jobId}`, { target: 'diapay' });
}

export async function fetchApiKeys(params: PaginatedParams = {}): Promise<PaginatedResult<ApiKey>> {
  const data = await apiClient<{ keys: ApiKey[] }>('api-keys', { target: 'diapay' });
  return paginateCollection(data.keys ?? [], params);
}

export function createApiKey(payload: Partial<ApiKey>) {
  return apiClient<ApiKey>('api-keys', {
    target: 'diapay',
    method: 'POST',
    json: payload
  });
}

export function updateApiKey(id: string, payload: Partial<ApiKey>) {
  return apiClient<ApiKey>(`api-keys/${id}`, {
    target: 'diapay',
    method: 'PATCH',
    json: payload
  });
}

export function deleteApiKey(id: string) {
  return apiClient<{ success: boolean }>(`api-keys/${id}`, {
    target: 'diapay',
    method: 'DELETE'
  });
}

export async function fetchAdminUsers(params: PaginatedParams = {}): Promise<PaginatedResult<DiaPayAdminUser>> {
  const data = await apiClient<{ users: DiaPayAdminUser[] }>('users', { target: 'diapay' });
  return paginateCollection(data.users ?? [], params);
}
