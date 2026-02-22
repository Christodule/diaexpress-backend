import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as quotesService from '@/src/services/api/logisticsQuotes';
import { useQuotes } from '@/hooks/useQuotes';

vi.mock('@/src/services/api/logisticsQuotes', () => ({
  fetchQuotes: vi.fn()
}));

describe('useQuotes', () => {
  it('wrappe fetchQuotes avec les bons paramètres', async () => {
    const mockFetch = quotesService.fetchQuotes as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 });

    const { result } = renderHook(() => useQuotes({ status: 'pending' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', page: 1, pageSize: 10 }));
  });
});
