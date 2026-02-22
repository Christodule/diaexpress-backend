import { ClerkProvider } from '@clerk/nextjs';

import '../styles/AdminCommon.css';
import '../styles/AdminExternalPricing.css';
import '../styles/AdminPackageType.css';
import '../styles/AdminSchedules.css';
import '../styles/AdminShipments.css';
import '../styles/ClientDashboard.css';
import '../styles/ClientShipments.css';
import '../styles/NewShipmentPage.css';
import '../styles/PaymentDialog.css';
import '../styles/ProfileAddresses.css';
import '../styles/QuoteRequest.css';
import '../styles/Shipments.css';
import '../styles/TrackShipment.css';
import '../styles/UserQuotes.css';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const App = ({ Component, pageProps }) => {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default App;
