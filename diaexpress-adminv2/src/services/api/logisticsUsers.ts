import { apiClient } from '@/lib/api/client';
import type { LogisticsUser } from '@/src/types/logistics';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';

type AdminUsersResponse = {
  data?: Array<LogisticsUser & { username?: string; fullName?: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function fetchUsers(params: PaginatedParams = {}): Promise<PaginatedResult<LogisticsUser>> {
  const data = await apiClient<AdminUsersResponse>('api/admin/users', {
    searchParams: {
      page: params.page,
      limit: params.pageSize,
      search: params.search
    }
  });

  const items = (data.data ?? []).map((user) => ({
    ...user,
    name: user.name || user.fullName || user.username
  }));

  return {
    items,
    total: data.pagination?.total ?? items.length,
    page: data.pagination?.page ?? params.page ?? 1,
    pageSize: data.pagination?.limit ?? params.pageSize ?? (items.length || 1)
  };
}

export async function updateUser(id: string, payload: Partial<LogisticsUser>) {
  const data = await apiClient<{ user: LogisticsUser }>(`api/admin/users/${id}`, {
    method: 'PATCH',
    json: payload
  });
  return data.user;
}
