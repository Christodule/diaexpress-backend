import React from 'react';
import QuoteWizard from '../components/quote/QuoteWizard';

const QuoteRequest = ({ initialOrigins = [] }) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <QuoteWizard initialOrigins={initialOrigins} />
    </div>
  );
};

export default QuoteRequest;
