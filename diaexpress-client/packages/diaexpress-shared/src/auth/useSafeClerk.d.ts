export interface SafeClerkAuth {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  actor: unknown;
  orgId: string | null;
  orgRole: string | null;
  orgSlug: string | null;
  getToken: (options?: Record<string, unknown>) => Promise<string | null>;
  getActiveSession: () => Promise<unknown>;
  setActive: (...args: unknown[]) => Promise<void>;
  setSession: (...args: unknown[]) => Promise<void>;
  signOut: (...args: unknown[]) => Promise<void>;
}

export interface SafeUserState {
  isLoaded: boolean;
  isSignedIn: boolean;
  isSignedOut: boolean;
  user: Record<string, unknown> | null;
}

export interface SafeClerkActions {
  client: unknown;
  session: unknown;
  signOut: (...args: unknown[]) => Promise<void>;
  openSignIn: (...args: unknown[]) => Promise<void>;
  closeSignIn: () => void;
  openUserProfile: (...args: unknown[]) => Promise<void>;
  closeUserProfile: () => void;
}

export const useSafeAuth: () => SafeClerkAuth;
export const useSafeUser: () => SafeUserState;
export const useSafeClerk: () => SafeClerkActions;
