import React, { useEffect, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import {
  createShipmentFromQuote,
  deleteQuote as apiDeleteQuote,
  fetchClientQuotes,
} from '../api/logistics';

const UserQuotes = () => {
  const { getToken } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [error, setError] = useState('');

  const fetchQuotes = async () => {
    try {
      const token = await getToken();
      const list = await fetchClientQuotes(token);
      setQuotes(list);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    }
  };

  const handleCreateShipment = async (quoteId) => {
    try {
      const token = await getToken();
      const response = await createShipmentFromQuote(quoteId, token);
      if (!response?.shipment) {
        throw new Error(response?.message || 'Erreur création envoi');
      }
      alert('✅ Envoi créé avec succès !');
      fetchQuotes();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création de l’envoi');
    }
  };

  const handleDelete = async (quoteId) => {
    const token = await getToken();
    if (!window.confirm('❌ Supprimer ce devis ?')) return;
    try {
      await apiDeleteQuote(quoteId, token);
      fetchQuotes();
    } catch (err) {
      alert(err.message || 'Impossible de supprimer le devis');
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return (
    <div className="user-quotes">
      <h2>🧾 Mes devis</h2>
      {error && <p className="error">{error}</p>}
      {quotes.length === 0 ? <p>Aucun devis pour l’instant</p> : (
        <table className="quotes-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Transport</th>
              <th>Destination</th>
              <th>Poids</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q._id}>
                <td>{q.productType}</td>
                <td>{q.transportType}</td>
                <td>{q.destination}</td>
                <td>{q.weight} kg</td>
                <td><strong>{q.price} €</strong></td>
                <td>
                  <button onClick={() => setSelectedQuote(q)}>👁️</button>
                  <button onClick={() => handleCreateShipment(q._id)}>📦</button>
                  <button className="delete" onClick={() => handleDelete(q._id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedQuote && (
        <div className="quote-details">
          <h3>Détails du devis</h3>
          <p><strong>Produit :</strong> {selectedQuote.productType}</p>
          <p><strong>Origine :</strong> {selectedQuote.origin}</p>
          <p><strong>Destination :</strong> {selectedQuote.destination}</p>
          <p><strong>Transport :</strong> {selectedQuote.transportType}</p>
          <p><strong>Poids :</strong> {selectedQuote.weight} kg</p>
          <p><strong>Dimensions :</strong> {selectedQuote.length} × {selectedQuote.width} × {selectedQuote.height || '—'} cm</p>
          <p><strong>Volume :</strong> {selectedQuote.volume?.toFixed(2) || '—'} m³</p>
          <p><strong>Type de colis :</strong> {selectedQuote.packageTypeId || '—'}</p>
          <p><strong>Tarif appliqué :</strong> {selectedQuote.pricingId || '—'}</p>
          <p><strong>Prix final :</strong> <strong>{selectedQuote.price} €</strong></p>
          <button onClick={() => setSelectedQuote(null)}>Fermer</button>
        </div>
      )}
    </div>
  );
};

export default UserQuotes;
