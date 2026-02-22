import React, { useEffect, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { useRouter } from 'next/router';
import { createShipmentFromQuote, fetchQuoteById } from '../api/logistics';

const NewShipmentPage = () => {
  const { getToken } = useBackendAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { quoteId } = router.query;

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        const data = await fetchQuoteById(quoteId, token);
        setQuote(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Erreur de chargement');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [getToken, quoteId]);

  const handleSend = async () => {
    if (!quote) {
      alert('Devis introuvable.');
      return;
    }

    try {
      const token = await getToken();
      const response = await createShipmentFromQuote(quote._id, token);
      if (!response?.shipment) {
        throw new Error(response?.message || 'Erreur à la création');
      }

      alert('✅ Envoi créé avec succès');
      router.push(`/track-shipment?code=${encodeURIComponent(response.shipment.trackingCode)}`);
    } catch (err) {
      alert(err.message || 'Erreur à la création');
    }
  };

  if (loading) return <p>⏳ Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!quote) return <p className="error">❌ Devis non trouvé.</p>;

  return (
    <div className="new-shipment-page">
      <h2>📦 Confirmer l’envoi du colis</h2>

      <div className="quote-summary">
        <p><strong>Origine :</strong> {quote.origin}</p>
        <p><strong>Destination :</strong> {quote.destination}</p>
        <p><strong>Transport :</strong> {quote.transportType}</p>

        {quote.packageType ? (
          <p><strong>Type de colis :</strong> {quote.packageType.name}</p>
        ) : (
          <>
            <p><strong>Poids :</strong> {quote.weight} kg</p>
            <p><strong>Dimensions :</strong> {quote.length} × {quote.width} × {quote.height} cm</p>
          </>
        )}

        <p><strong>Estimation :</strong> {quote.estimatedPrice} €</p>
      </div>

      <button className="confirm-btn" onClick={handleSend}>✅ Confirmer et envoyer</button>
    </div>
  );
};

export default NewShipmentPage;
