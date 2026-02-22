import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchQuoteMeta, confirmQuote, fetchQuotes } from '@/lib/api/quotes';

global.fetch = vi.fn();

const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;

const buildResponse = (body: unknown, ok = true, status = 200) =>
  new Response(JSON.stringify(body), { status, statusText: ok ? 'OK' : 'Error' });

describe('api/quotes client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchQuoteMeta retourne les origines', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse({ origins: [{ origin: 'Paris', destinations: [] }] }));

    const result = await fetchQuoteMeta();

    expect(result.origins).toEqual([{ origin: 'Paris', destinations: [] }]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/quotes/meta'), expect.any(Object));
  });

  it('confirmQuote envoie un payload de confirmation', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse({ quote: { _id: '1', status: 'confirmed' } }));

    const data = await confirmQuote('1', { finalPrice: 1200 });

    expect(data.status).toBe('confirmed');
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.method).toBe('POST');
    expect(options?.body).toContain('1200');
  });

  it('fetchQuotes mappe la réponse { quotes }', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse({ quotes: [{ _id: 'q1', status: 'pending' }] }));

    const result = await fetchQuotes({ pageSize: 5 });

    expect(result.total).toBe(1);
    expect(result.items[0]?._id).toBe('q1');
  });
});
