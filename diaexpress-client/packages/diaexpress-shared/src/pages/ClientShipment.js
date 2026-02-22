import React, { useEffect, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { fetchClientShipments } from '../api/logistics';

const ClientShipments = () => {
  const { getToken } = useBackendAuth();
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = await getToken();
        const list = await fetchClientShipments(token);
        setShipments(list);
        setError('');
      } catch (err) {
        setError('Erreur réseau ou serveur');
      }
    };

    fetchShipments();
  }, [getToken]);

  return (
    <div className="client-shipments">
      <h2>📦 Mes envois</h2>

      {error && <p className="error">{error}</p>}

      {shipments.length === 0 && !error && (
        <p>Aucun envoi pour le moment.</p>
      )}

      <ul className="shipment-list">
        {shipments.map((s) => (
          <li key={s._id} className="shipment-card">
            <p><strong>Code :</strong> {s.trackingCode}</p>
            <p><strong>Statut :</strong> {s.status}</p>
            <p><strong>Origine :</strong> {s.origin}</p>
            <p><strong>Destination :</strong> {s.destination}</p>
            <p><strong>Transport :</strong> {s.transportType}</p>
            <p><strong>Estimation :</strong> {s.estimatedPrice} €</p>
            {s.packageTypeId && (
              <p><strong>Type de colis :</strong> {s.packageTypeId.name}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientShipments;
