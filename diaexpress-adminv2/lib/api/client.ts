import { applyAuthHeader, handleAuthFailure } from './auth';

const DEFAULT_TIMEOUT = 15000;

const LOGISTICS_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ||
  process.env.NEXT_PUBLIC_LOGISTICS_API_BASE_URL ||
  'http://localhost:4000';
const DIAPAY_BASE_URL = process.env.NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL || 'http://localhost:4001/v1/admin';

export type ApiTarget = 'logistics' | 'diapay';

export type ApiRequestOptions = RequestInit & {
  target?: ApiTarget;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  /**
   * Pass a plain object to stringify as JSON. If you need to send FormData or a string body,
   * provide it directly via `body`.
   */
  json?: Record<string, unknown>;
};

export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: T
  ) {
    super(message);
  }
}

const BASE_URLS: Record<ApiTarget, string> = {
  logistics: LOGISTICS_BASE_URL,
  diapay: DIAPAY_BASE_URL
};

export function getApiBaseUrl(target: ApiTarget = 'logistics') {
  return BASE_URLS[target];
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

export function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') return;
    search.set(key, String(rawValue));
  });

  return search.toString();
}

export function buildApiUrl(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined | null>,
  target: ApiTarget = 'logistics'
) {
  const base = ensureTrailingSlash(BASE_URLS[target]);
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, base);

  const queryString = buildQueryString(searchParams);
  if (queryString) {
    url.search = queryString;
  }

  return url.toString();
}

function isJsonContentType(contentType: string | null) {
  return contentType?.includes('application/json') ?? false;
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get('content-type');
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (isJsonContentType(contentType)) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  const trimmed = text.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim().length) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const maybePayload = payload as { message?: string; error?: string; errors?: unknown };
    if (typeof maybePayload.message === 'string' && maybePayload.message.trim().length) {
      return maybePayload.message;
    }
    if (typeof maybePayload.error === 'string' && maybePayload.error.trim().length) {
      return maybePayload.error;
    }
    if (Array.isArray(maybePayload.errors) && maybePayload.errors.length) {
      return String(maybePayload.errors[0]);
    }
  }

  return fallback;
}

function logApiError(details: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.error('[adminv2/api]', details);
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, json, searchParams, target = 'logistics', ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(rest.headers);
  await applyAuthHeader(headers);

  let body = rest.body;
  if (json) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  if (!headers.has('Content-Type') && body && typeof body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = buildApiUrl(path, searchParams, target);

  try {
    const response = await fetch(url, {
      ...rest,
      body,
      headers,
      credentials: rest.credentials ?? 'include',
      signal: controller.signal
    });

    const payload = await parsePayload(response);

    if (!response.ok) {
      handleAuthFailure(response.status);
      const message = extractErrorMessage(payload, response.statusText || 'Erreur API');
      logApiError({ url, status: response.status, message, payload });
      throw new ApiError(message, response.status, payload as T);
    }

    return payload as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Requête expirée', 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    logApiError({ url, error });
    throw new ApiError('Impossible de contacter le serveur', 503);
  } finally {
    clearTimeout(timeout);
  }
}
