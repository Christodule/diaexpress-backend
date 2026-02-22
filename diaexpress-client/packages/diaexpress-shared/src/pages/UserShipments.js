import React, { useEffect, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { fetchClientShipments } from '../api/logistics';

const UserShipments = () => {
  const { getToken } = useBackendAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = await getToken();
        const list = await fetchClientShipments(token);
        setShipments(list);
        setError('');
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des colis');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [getToken]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;

  if (shipments.length === 0) {
    return <p>🚫 Aucun envoi trouvé.</p>;
  }

  return (
    <div className="user-shipments">
      <h2>📦 Mes colis</h2>
      <table>
        <thead>
          <tr>
            <th>Origine</th>
            <th>Destination</th>
            <th>Transport</th>
            <th>Prix estimé</th>
            <th>Destinataire</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s._id}>
              <td>{s.origin}</td>
              <td>{s.destination}</td>
              <td>{s.transportType}</td>
              <td>{s.estimatedPrice} FCFA</td>
              <td>{s.receiverName} ({s.receiverPhone})</td>
              <td>{s.status || '🕒 En attente'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserShipments;
