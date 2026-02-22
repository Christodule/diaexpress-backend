import React from 'react';
import ProtectedRoute from '@diaexpress/shared/components/ProtectedRoute';
import Quotes from '@diaexpress/shared/pages/Quotes';

const QuotesPage = () => (
  <ProtectedRoute>
    <Quotes />
  </ProtectedRoute>
);

export default QuotesPage;
