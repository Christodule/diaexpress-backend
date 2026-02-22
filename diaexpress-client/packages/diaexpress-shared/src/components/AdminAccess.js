import React from 'react';
import { RedirectToSignIn } from '@clerk/nextjs';
import RoleProtected from './RoleProtected';
import { useDevAdminSession } from '../auth/useDevAdminSession';
import { useSafeUser } from '../auth/useSafeClerk';

const AdminAccess = ({ role = 'admin', children }) => {
  const devSession = useDevAdminSession();
  const { isLoaded, isSignedIn } = useSafeUser();

  if (devSession.isActive) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <RoleProtected role={role}>{children}</RoleProtected>;
};

export default AdminAccess;
