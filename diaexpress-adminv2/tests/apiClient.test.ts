import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError, buildApiUrl } from '@/lib/api/client';

global.fetch = vi.fn();

const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;

const buildResponse = (body: unknown, ok = true, status = 200) =>
  new Response(JSON.stringify(body), { status, statusText: ok ? 'OK' : 'Error' });

describe('api client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('buildApiUrl ajoute les query params valides', () => {
    const url = buildApiUrl('/api/quotes', { status: 'pending', empty: '' });
    expect(url).toContain('/api/quotes');
    expect(url).toContain('status=pending');
    expect(url).not.toContain('empty=');
  });

  it('apiClient expose un message clair sur erreur JSON', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse({ message: 'Bad request' }, false, 400));

    let thrown: unknown;
    try {
      await apiClient('/api/test');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).message).toBe('Bad request');
  });
});
