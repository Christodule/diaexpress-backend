import { apiClient } from './client';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { paginateCollection } from '@/src/lib/pagination';
import type { LogisticsUser } from '@/src/types/logistics';

export async function fetchUsers(params: PaginatedParams = {}): Promise<PaginatedResult<LogisticsUser>> {
  const data = await apiClient<{ data?: LogisticsUser[]; pagination?: { page: number; limit: number; total: number } }>(
    '/api/admin/users',
    {
      searchParams: {
        page: params.page,
        limit: params.pageSize,
        search: params.search
      }
    }
  );
  const users = Array.isArray(data?.data) ? data.data : [];

  if (data?.pagination) {
    return {
      items: users,
      total: data.pagination.total,
      page: data.pagination.page,
      pageSize: data.pagination.limit
    };
  }

  return paginateCollection(
    users,
    params,
    (user, searchTerm) =>
      [user.email, user.name, user.role, user.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchTerm))
  );
}
