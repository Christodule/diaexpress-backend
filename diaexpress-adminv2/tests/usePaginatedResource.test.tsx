import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePaginatedResource } from '@/src/hooks/usePaginatedResource';
import type { PaginatedResult } from '@/src/types/pagination';

const createResult = (page: number): PaginatedResult<number> => ({
  items: [page],
  total: 3,
  page,
  pageSize: 1
});

describe('usePaginatedResource', () => {
  it('charge les données initiales', async () => {
    const fetcher = vi.fn().mockResolvedValue(createResult(1));
    const { result } = renderHook(() => usePaginatedResource(fetcher, { page: 1, pageSize: 1 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledWith({ page: 1, pageSize: 1 });
    expect(result.current.items).toEqual([1]);
  });

  it('met à jour la pagination', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createResult(1))
      .mockResolvedValueOnce(createResult(2));

    const { result } = renderHook(() => usePaginatedResource(fetcher, { page: 1, pageSize: 1 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setParams({ page: 2 });
    });

    await waitFor(() => expect(result.current.page).toBe(2));
    expect(result.current.items).toEqual([2]);
  });
});
