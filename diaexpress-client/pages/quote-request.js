import React from 'react';
import QuoteRequest from '@diaexpress/shared/pages/QuoteRequest';
import { fetchQuoteMeta } from '@diaexpress/shared/api/logistics';

const QuoteRequestPage = ({ initialOrigins = [] }) => {
  return <QuoteRequest initialOrigins={initialOrigins} />;
};

export async function getServerSideProps() {
  try {
    const data = await fetchQuoteMeta();
    const origins = Array.isArray(data?.origins) ? data.origins : [];

    return {
      props: {
        initialOrigins: origins,
      },
    };
  } catch (error) {
    console.error('Failed to preload quote request metadata', error);
    return {
      props: {
        initialOrigins: [],
      },
    };
  }
}

export default QuoteRequestPage;
