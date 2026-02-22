import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import DeliveryPage from '@diaexpress/shared/pages/DeliveryPage';
import RoleProtected from '@diaexpress/shared/components/RoleProtected';

const DeliveryHomePage = () => (
  <ProtectedRoute>
    <RoleProtected role="delivery">
      <DeliveryPage />
    </RoleProtected>
  </ProtectedRoute>
);

export default DeliveryHomePage;
