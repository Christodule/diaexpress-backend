const ADMIN_BEARER_TOKEN = process.env.NEXT_PUBLIC_ADMIN_BEARER_TOKEN;
const CLERK_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE ||
  process.env.NEXT_PUBLIC_CLERK_TEMPLATE ||
  process.env.NEXT_PUBLIC_CLERK_TOKEN_TEMPLATE;

type ClerkWindow = Window & {
  Clerk?: {
    session?: {
      getToken: (options?: { template?: string }) => Promise<string | null>;
    };
  };
};

async function resolveBrowserClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const clerk = (window as ClerkWindow).Clerk;
  if (!clerk?.session?.getToken) {
    return null;
  }

  try {
    const token = await clerk.session.getToken(CLERK_TEMPLATE ? { template: CLERK_TEMPLATE } : undefined);
    return token || null;
  } catch (error) {
    console.warn('Unable to resolve Clerk token for adminv2:', (error as Error).message || error);
    return null;
  }
}

export async function resolveAuthToken(): Promise<string | null> {
  const clerkToken = await resolveBrowserClerkToken();
  if (clerkToken) {
    return clerkToken;
  }

  return ADMIN_BEARER_TOKEN || null;
}

export async function applyAuthHeader(headers: Headers): Promise<void> {
  if (headers.has('Authorization')) {
    return;
  }

  const token = await resolveAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

export function handleAuthFailure(status: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (status === 401) {
    window.location.assign('/sign-in');
    return;
  }

  if (status === 403) {
    window.location.assign('/access-denied');
  }
}
