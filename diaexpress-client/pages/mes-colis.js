import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import UserShipments from '@diaexpress/shared/pages/UserShipments';

const UserShipmentsPage = () => (
  <ProtectedRoute>
    <UserShipments />
  </ProtectedRoute>
);

export default UserShipmentsPage;
