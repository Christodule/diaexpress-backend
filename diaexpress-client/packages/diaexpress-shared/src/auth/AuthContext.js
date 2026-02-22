import { useEffect, createContext, useContext, useState } from 'react';
import { buildApiUrl } from '../api/api';
import { useBackendAuth } from './useBackendAuth';
import { useSafeUser } from './useSafeClerk';

export const UserContext = createContext();

export const AuthProvider = ({
  children,
  clerkUser: clerkUserOverride,
  isUserLoaded: isUserLoadedOverride,
  getToken: getTokenOverride,
}) => {
  const { user: hookUser, isLoaded: hookIsLoaded } = useSafeUser();
  const { getToken: hookGetToken } = useBackendAuth();

  const clerkUser = clerkUserOverride ?? hookUser;
  const isUserLoaded = isUserLoadedOverride ?? hookIsLoaded;
  const getToken = getTokenOverride ?? hookGetToken;

  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    if (!isUserLoaded || !clerkUser || !getToken) {
      return;
    }

    let isActive = true;

    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(buildApiUrl('/api/users/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || 'Impossible de synchroniser le profil utilisateur'
          );
        }

        if (isActive) {
          setDbUser(data.user);
        }
      } catch (err) {
        if (isActive) {
          console.error('❌ Sync error:', err);
        }
      }
    };

    syncUser();

    return () => {
      isActive = false;
    };
  }, [clerkUser, getToken, isUserLoaded]);

  return (
    <UserContext.Provider value={{ clerkUser, dbUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuthUser = () => useContext(UserContext);
