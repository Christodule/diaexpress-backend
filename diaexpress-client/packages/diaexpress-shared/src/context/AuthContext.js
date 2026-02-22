import { createContext, useContext, useState, useEffect } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { useSafeUser } from '../auth/useSafeClerk';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken } = useBackendAuth();
  const { user, isLoaded } = useSafeUser();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      try {
        if (!isLoaded || !user) return;
        const token = await getToken();
        if (!token) {
          return;
        }
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const res = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setBackendUser(data.user);
      } catch (err) {
        console.error('Sync error:', err);
        setBackendUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, user, getToken]);

  return (
    <AuthContext.Provider value={{ user, backendUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => useContext(AuthContext);
