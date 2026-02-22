import React from 'react';
import { ClerkProvider, SignInButton, UserButton } from '@clerk/nextjs';
import Header from '@diaexpress/shared/components/Header';
import { AuthProvider } from '@diaexpress/shared/auth/AuthContext';
import '@diaexpress/shared/styles/App.css';
import '../src/styles/diaexpress-theme.css';
import { useBackendAuth } from '@diaexpress/shared/auth/useBackendAuth';
import { useSafeClerk, useSafeUser } from '@diaexpress/shared/auth/useSafeClerk';

const clerkPubKey = 'pk_test_YWxsb3dpbmctcG9sbGl3b2ctMjYuY2xlcmsuYWNjb3VudHMuZGV2JA';

const AppWithClerk = ({ Component, pageProps }) => {
  const { user, isLoaded } = useSafeUser();
  const { getToken } = useBackendAuth();
  const { signOut } = useSafeClerk();

  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSignOut = React.useCallback(() => {
    signOut(() => (window.location.href = '/'));
  }, [signOut]);

  const canRenderAuthUI = hasMounted && isLoaded;

  const resolvedUser = canRenderAuthUI ? user : null;
  const resolvedSignInButton = canRenderAuthUI ? SignInButton : null;
  const resolvedUserButton = canRenderAuthUI ? UserButton : null;
  const resolvedSignOut = canRenderAuthUI ? handleSignOut : undefined;

  return (
    <AuthProvider clerkUser={resolvedUser} isUserLoaded={isLoaded} getToken={getToken}>
      <Header
        user={resolvedUser}
        onSignOut={resolvedSignOut}
        SignInButtonComponent={resolvedSignInButton}
        UserButtonComponent={resolvedUserButton}
        isAuthReady={canRenderAuthUI}
      />
      <Component {...pageProps} />
    </AuthProvider>
  );
};

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider publishableKey={clerkPubKey} {...pageProps}>
      <AppWithClerk Component={Component} pageProps={pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
