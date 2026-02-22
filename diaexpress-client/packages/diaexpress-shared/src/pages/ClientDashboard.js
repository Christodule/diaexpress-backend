import React, { useEffect, useMemo, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import Link from 'next/link';
import { normaliseCountry } from '../utils/addressValidation';
import { fetchAddresses } from '../api/addresses';
import { fetchClientQuotes, fetchClientShipments, apiRequest } from '../api/logistics';

const ClientDashboard = () => {
  const { getToken, isLoaded } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const [quoteList, shipmentList, addressList] = await Promise.all([
        fetchClientQuotes(token),
        fetchClientShipments(token),
        fetchAddresses(token),
      ]);

      setQuotes(Array.isArray(quoteList) ? quoteList : []);
      setShipments(Array.isArray(shipmentList) ? shipmentList : []);
      setAddresses(Array.isArray(addressList) ? addressList : []);
      setError('');
    } catch (err) {
      setError(`❌ ${err.message}`);
      setQuotes([]);
      setShipments([]);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    fetchData();
  }, [isLoaded]);

  const handleCreateShipment = async (quoteId) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      await apiRequest('/api/shipments', {
        method: 'POST',
        token,
        body: { quoteId },
      });
      alert('✅ Envoi créé !');
      fetchData();
    } catch (err) {
      alert(`❌ ${err.message}`);
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

  const awaitingShipment = useMemo(
    () =>
      quotes.filter(
        (q) => !shipments.find((s) => s.quoteId === q._id || s.quoteId?._id === q._id)
      ).length,
    [quotes, shipments]
  );

  const stats = useMemo(
    () => ({
      quotes: quotes.length,
      shipments: shipments.length,
      addresses: addresses.length,
      awaitingShipment,
    }),
    [quotes.length, shipments.length, addresses.length, awaitingShipment]
  );

  return (
    <div className="dx-dashboard-shell">
      <div className="dx-dashboard">
        <header className="dx-dashboard__header">
          <span className="dx-dashboard__eyebrow">votre espace logistique</span>
          <h1 className="dx-dashboard__title">Pilotez vos devis et expéditions</h1>
          <p className="dx-dashboard__subtitle">
            Retrouvez l’ensemble de vos demandes de transport, vos envois confirmés et vos
            adresses préférées. Chaque action est à portée de clic pour accélérer vos
            expéditions.
          </p>
        </header>

        <section className="dx-section dx-section--surface">
          <div className="dx-section__header">
            <span className="dx-section__eyebrow">vue synthétique</span>
            <h2 className="dx-section__title">Vos indicateurs du moment</h2>
            <p className="dx-section__subtitle">
              Mesurez en un coup d’œil vos demandes en cours et les expéditions qui
              nécessitent une action.
            </p>
          </div>
          <div className="dx-grid dx-grid--four">
            <div className="dx-card">
              <span className="dx-card__title">Devis enregistrés</span>
              <span className="dx-card__value">{stats.quotes}</span>
              <p className="dx-card__subtitle">
                Vos demandes tarifaires récentes et en attente de validation.
              </p>
            </div>
            <div className="dx-card">
              <span className="dx-card__title">Envois en cours</span>
              <span className="dx-card__value">{stats.shipments}</span>
              <p className="dx-card__subtitle">
                Suivez vos colis et consultez leur progression en temps réel.
              </p>
            </div>
            <div className="dx-card">
              <span className="dx-card__title">Adresses sauvegardées</span>
              <span className="dx-card__value">{stats.addresses}</span>
              <p className="dx-card__subtitle">
                Centralisez vos lieux de collecte et de livraison favoris.
              </p>
            </div>
            <div className="dx-card">
              <span className="dx-card__title">Prêts à expédier</span>
              <span className="dx-card__value">{stats.awaitingShipment}</span>
              <p className="dx-card__subtitle">
                Finalisez ces devis pour déclencher immédiatement l’expédition.
              </p>
            </div>
          </div>
        </section>

        <section className="dx-section">
          <div className="dx-section__header">
            <span className="dx-section__eyebrow">vos coordonnées</span>
            <h2 className="dx-section__title">Carnet d’adresses intelligent</h2>
            <p className="dx-section__subtitle">
              Enregistrez vos points de chargement et de livraison pour accélérer vos
              futures demandes.
            </p>
          </div>
          {lastAddress ? (
            <div className="dx-card">
              <div className="dx-card__title">{lastAddress.label || 'Adresse sans libellé'}</div>
              <div className="dx-meta">
                <span>{lastAddress.line1}</span>
                {lastAddress.line2 && <span>{lastAddress.line2}</span>}
                <span>
                  {lastAddress.postalCode} {lastAddress.city}{' '}
                  {normaliseCountry(lastAddress.country)}
                </span>
                {lastAddress.phone && <span>📞 {lastAddress.phone}</span>}
              </div>
              <Link href="/profile/addresses" className="dx-button dx-button--ghost dx-button--sm">
                Gérer mes adresses
              </Link>
            </div>
          ) : (
            <div className="dx-empty">
              Aucune adresse sauvegardée pour le moment. Ajoutez vos sites pour éviter la
              saisie manuelle.
            </div>
          )}
        </section>

        <section className="dx-section">
          <div className="dx-section__header">
            <span className="dx-section__eyebrow">vos devis</span>
            <h2 className="dx-section__title">Historique et actions rapides</h2>
            <p className="dx-section__subtitle">
              Visualisez chaque devis et transformez-le en expédition confirmée en un clic.
            </p>
          </div>
          {loading ? (
            <div className="dx-empty">Chargement de vos informations…</div>
          ) : quotes.length === 0 ? (
            <div className="dx-empty">
              Aucun devis trouvé. Lancez une estimation pour planifier votre prochain envoi.
            </div>
          ) : (
            <div className="dx-grid dx-grid--two">
              {quotes.map((quote) => {
                const alreadyShipped = shipments.find(
                  (shipment) =>
                    shipment.quoteId === quote._id || shipment.quoteId?._id === quote._id
                );
                return (
                  <div key={quote._id} className="dx-card">
                    <div className="dx-card__title">{quote.productType}</div>
                    <div className="dx-meta">
                      <span>{quote.origin} → {quote.destination}</span>
                      <span>Transport : {quote.transportType}</span>
                      {quote.price && <span>Montant estimé : {quote.price} €</span>}
                    </div>
                    {!alreadyShipped && (
                      <button
                        className="dx-button dx-button--primary dx-button--sm"
                        onClick={() => handleCreateShipment(quote._id)}
                      >
                        Créer un envoi 📦
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="dx-actions">
            <Link href="/quote-request" className="dx-button dx-button--primary dx-button--sm">
              Demander un nouveau devis
            </Link>
            <Link href="/payments" className="dx-button dx-button--ghost dx-button--sm">
              Consulter mes paiements
            </Link>
          </div>
        </section>

        <section className="dx-section">
          <div className="dx-section__header">
            <span className="dx-section__eyebrow">vos expéditions</span>
            <h2 className="dx-section__title">Suivi des colis confirmés</h2>
            <p className="dx-section__subtitle">
              Retrouvez vos numéros de suivi et vos statuts à tout moment.
            </p>
          </div>
          {loading ? (
            <div className="dx-empty">Chargement de vos expéditions…</div>
          ) : shipments.length === 0 ? (
            <div className="dx-empty">Vous n’avez pas encore d’expédition active.</div>
          ) : (
            <div className="dx-grid dx-grid--two">
              {shipments.map((shipment) => (
                <div key={shipment._id} className="dx-card">
                  <div className="dx-card__title">Tracking : {shipment.trackingCode}</div>
                  <div className="dx-meta">
                    <span>Statut : {shipment.status}</span>
                    <Link
                      href={`/track-shipment?code=${encodeURIComponent(shipment.trackingCode || '')}`}
                      className="dx-button dx-button--ghost dx-button--sm"
                    >
                      Suivre mon colis
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <div className="dx-empty">{error}</div>}
      </div>
    </div>
  );
};

export default ClientDashboard;
