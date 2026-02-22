import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import ProfileAddresses from '@diaexpress/shared/pages/ProfileAddresses';

const ProfileAddressesPage = () => (
  <ProtectedRoute>
    <ProfileAddresses />
  </ProtectedRoute>
);

export default ProfileAddressesPage;
