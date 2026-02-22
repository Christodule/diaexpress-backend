import { useAuth, useClerk, useUser } from '@clerk/nextjs';

const isMissingClerkProviderError = (error) =>
  Boolean(
    error &&
      typeof error.message === 'string' &&
      error.message.toLowerCase().includes('clerkprovider'),
  );

const noop = () => {};
const asyncNoop = async () => {};

const authFallback = {
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  getToken: async () => null,
  getActiveSession: async () => null,
  setActive: asyncNoop,
  setSession: asyncNoop,
  signOut: asyncNoop,
};

const userFallback = {
  isLoaded: false,
  isSignedIn: false,
  isSignedOut: true,
  user: null,
};

const clerkFallback = {
  client: null,
  session: null,
  signOut: asyncNoop,
  openSignIn: asyncNoop,
  closeSignIn: noop,
  openUserProfile: asyncNoop,
  closeUserProfile: noop,
};

export const useSafeAuth = () => {
  try {
    return useAuth();
  } catch (error) {
    if (isMissingClerkProviderError(error)) {
      return authFallback;
    }
    throw error;
  }
};

export const useSafeUser = () => {
  try {
    return useUser();
  } catch (error) {
    if (isMissingClerkProviderError(error)) {
      return userFallback;
    }
    throw error;
  }
};

export const useSafeClerk = () => {
  try {
    return useClerk();
  } catch (error) {
    if (isMissingClerkProviderError(error)) {
      return clerkFallback;
    }
    throw error;
  }
};
