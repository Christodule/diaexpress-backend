import React from 'react';
import { useSafeUser } from '@diaexpress/shared/auth/useSafeClerk';

const RoleProtected = ({ role, children }) => {
  const { user } = useSafeUser();
  const currentRole = user?.publicMetadata?.role || 'client';

  if (role && currentRole !== role) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        ⛔ Accès non autorisé
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleProtected;
