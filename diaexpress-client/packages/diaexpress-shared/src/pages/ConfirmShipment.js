import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useBackendAuth } from '../auth/useBackendAuth';
import { fetchShipmentById } from '../api/logistics';

const ConfirmShipment = () => {
  const router = useRouter();
  const { id } = router.query;
  const { getToken, isSignedIn } = useBackendAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    (async () => {
      try {
        const token = isSignedIn ? await getToken() : undefined;
        const data = await fetchShipmentById(id, token);
        setShipment(data);
        setError('');
      } catch (err) {
        setShipment(null);
        setError(err?.message || 'Expédition introuvable.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, id, isSignedIn]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!shipment) return <p className="error">Expédition introuvable.</p>;

  return (
    <div>
      <h2>✅ Expédition confirmée</h2>
      <p>Tracking : <strong>{shipment.trackingCode}</strong></p>
      <p>Origine : {shipment.origin}</p>
      <p>Destination : {shipment.destination}</p>
      <p>Statut : {shipment.status}</p>
    </div>
  );
};

export default ConfirmShipment;
