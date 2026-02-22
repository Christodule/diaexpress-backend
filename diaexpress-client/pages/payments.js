import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import Payments from '@diaexpress/shared/pages/Payments';
import RoleProtected from '@diaexpress/shared/components/RoleProtected';

const PaymentsPage = () => (
  <ProtectedRoute>
    <RoleProtected role="client">
      <Payments />
    </RoleProtected>
  </ProtectedRoute>
);

export default PaymentsPage;
