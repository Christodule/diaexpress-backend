import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import Link from 'next/link';
import { buildApiUrl } from '../api/api';
import { normaliseCountry } from '../utils/addressValidation';

const ClientDashboard = () => {
  const { getToken } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const [quoteRes, shipRes, addressRes] = await Promise.all([
        fetch(buildApiUrl('/api/quotes/my'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(buildApiUrl('/api/shipments/my'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(buildApiUrl('/api/addresses'), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const quoteData = await quoteRes.json();
      const shipData = await shipRes.json();
      const addressData = await addressRes.json();

      if (!quoteRes.ok || !shipRes.ok || !addressRes.ok) throw new Error('Erreur chargement données');

      setQuotes(quoteData.quotes || []);
      setShipments(shipData.shipments || []);
      const list = Array.isArray(addressData?.addresses)
        ? addressData.addresses
        : Array.isArray(addressData)
        ? addressData
        : [];
      setAddresses(list);
      setError('');
    } catch (err) {
      setError('❌ Erreur de chargement : ' + err.message);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateShipment = async (quoteId) => {
    try {
      const token = await getToken();
      const res = await fetch(buildApiUrl('/api/shipments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("✅ Envoi créé !");
      fetchData();
    } catch (err) {
      alert("❌ Erreur création d'envoi : " + err.message);
    }
  };

  const lastAddress = useMemo(() => {
    if (!addresses.length) return null;
    return [...addresses].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [addresses]);

  return (
    <div className="client-dashboard">
      <section className="address-summary">
        <h2>📇 Mes adresses rapides</h2>
        {lastAddress ? (
          <div className="address-summary-card">
            <p><strong>{lastAddress.label || 'Adresse sans libellé'}</strong></p>
            <p>{lastAddress.line1}</p>
            {lastAddress.line2 && <p>{lastAddress.line2}</p>}
            <p>
              {lastAddress.postalCode} {lastAddress.city}{' '}
              {normaliseCountry(lastAddress.country)}
            </p>
            {lastAddress.phone && <p>📞 {lastAddress.phone}</p>}
          </div>
        ) : (
          <p>Aucune adresse sauvegardée pour le moment.</p>
        )}
        <Link href="/profile/addresses" className="address-summary-link">Gérer mes adresses</Link>
      </section>

      <h2>📄 Mes Devis</h2>
      <p style={{ marginBottom: '1rem' }}>
        💳 <Link href="/payments">Voir mes paiements</Link>
      </p>
      {quotes.length === 0 && <p>Aucun devis trouvé.</p>}
      {quotes.map(q => (
        <div key={q._id} className="quote-item">
          <p><strong>{q.productType}</strong> – {q.origin} → {q.destination}</p>
          <p>📦 Transport : {q.transportType} – 💰 {q.price} €</p>
          {!shipments.find(s => s.quoteId === q._id || s.quoteId?._id === q._id) && (
            <button onClick={() => handleCreateShipment(q._id)}>Créer un envoi 📦</button>
          )}
        </div>
      ))}

      <h2>🚚 Mes Envois</h2>
      {shipments.length === 0 && <p>Aucun envoi trouvé.</p>}
      {shipments.map(s => (
        <div key={s._id} className="shipment-item">
          <p><strong>Tracking :</strong> {s.trackingCode}</p>
          <p><strong>Statut :</strong> {s.status}</p>
        </div>
      ))}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ClientDashboard;
