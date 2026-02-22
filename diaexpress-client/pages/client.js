import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import ClientPage from '@diaexpress/shared/pages/ClientPage';
import RoleProtected from '@diaexpress/shared/components/RoleProtected';

const ClientHomePage = () => (
  <ProtectedRoute>
    <RoleProtected role="client">
      <ClientPage />
    </RoleProtected>
  </ProtectedRoute>
);

export default ClientHomePage;
