import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminAuthGuard } from '../auth/useAdminAuthGuard';
import {
  fetchAdminQuotes as apiFetchAdminQuotes,
  fetchAdminShipments as apiFetchAdminShipments,
  fetchCurrentUser as apiFetchCurrentUser,
} from '../api/logistics';

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const AdminUsers = () => {
  const { requireAdminToken, isAdminReady } = useAdminAuthGuard();
  const [quotes, setQuotes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminReady) {
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const token = await requireAdminToken();

        const [quotesData, shipmentsData, me] = await Promise.all([
          apiFetchAdminQuotes(token),
          apiFetchAdminShipments(token),
          apiFetchCurrentUser(token).catch(() => null),
        ]);

        setQuotes(Array.isArray(quotesData) ? quotesData : []);
        setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
        setCurrentUser(me);
        setError('');
      } catch (err) {
        console.error('Erreur chargement utilisateurs admin', err);
        setError(err.message || "Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminReady, requireAdminToken]);

  const clientStats = useMemo(() => {
    const stats = new Map();

    quotes.forEach((quote) => {
      const key = quote.userEmail || quote.requestedBy || 'contact-direct';
      const entry = stats.get(key) || {
        id: key,
        email: quote.userEmail || null,
        label: quote.company || quote.requestedByLabel || quote.userEmail || 'Contact direct',
        quotes: 0,
        shipments: 0,
        lastActivity: quote.updatedAt || quote.createdAt,
      };
      entry.quotes += 1;
      const lastQuoteDate = quote.updatedAt || quote.createdAt;
      if (!entry.lastActivity || new Date(lastQuoteDate) > new Date(entry.lastActivity)) {
        entry.lastActivity = lastQuoteDate;
      }
      stats.set(key, entry);
    });

    shipments.forEach((shipment) => {
      const key = shipment.principalId || shipment.quoteId?.requestedBy || shipment.quoteId?.userEmail || 'contact-direct';
      const entry = stats.get(key) || {
        id: key,
        email: shipment.quoteId?.userEmail || null,
        label: shipment.quoteId?.requestedByLabel || shipment.quoteId?.userEmail || 'Contact direct',
        quotes: 0,
        shipments: 0,
        lastActivity: shipment.updatedAt || shipment.createdAt,
      };
      entry.shipments += 1;
      const lastShipmentDate = shipment.updatedAt || shipment.createdAt;
      if (!entry.lastActivity || new Date(lastShipmentDate) > new Date(entry.lastActivity)) {
        entry.lastActivity = lastShipmentDate;
      }
      stats.set(key, entry);
    });

    return Array.from(stats.values())
      .sort((a, b) => b.quotes - a.quotes)
      .slice(0, 10);
  }, [quotes, shipments]);

  const totals = useMemo(() => {
    const uniqueClients = new Set(quotes.map((quote) => quote.userEmail || quote.requestedBy));
    const activeShipments = shipments.filter((shipment) => shipment.status && shipment.status !== 'Livré');
    return {
      clients: uniqueClients.size,
      quotes: quotes.length,
      shipments: shipments.length,
      activeShipments: activeShipments.length,
    };
  }, [quotes, shipments]);

  return (
    <div className="dx-dashboard-shell">
      <div className="dx-dashboard">
        <header className="dx-dashboard__header">
          <span className="dx-dashboard__eyebrow">collaboration</span>
          <h1 className="dx-dashboard__title">Utilisateurs & comptes clients</h1>
          <p className="dx-dashboard__subtitle">
            Visualisez les interlocuteurs actifs, leurs volumes de devis et les expéditions associées pour mieux
            prioriser vos actions commerciales.
          </p>
        </header>

        {loading ? (
          <div className="dx-empty">Chargement des utilisateurs…</div>
        ) : error ? (
          <div className="dx-empty">{error}</div>
        ) : (
          <>
            <section className="dx-section dx-section--surface">
              <div className="dx-grid dx-grid--four">
                <div className="dx-card">
                  <span className="dx-card__title">Clients identifiés</span>
                  <span className="dx-card__value">{totals.clients}</span>
                  <p className="dx-card__subtitle">Adresses email distinctes ayant demandé un devis</p>
                </div>
                <div className="dx-card">
                  <span className="dx-card__title">Devis suivis</span>
                  <span className="dx-card__value">{totals.quotes}</span>
                  <p className="dx-card__subtitle">Total des demandes enregistrées</p>
                </div>
                <div className="dx-card">
                  <span className="dx-card__title">Expéditions créées</span>
                  <span className="dx-card__value">{totals.shipments}</span>
                  <p className="dx-card__subtitle">Dont {totals.activeShipments} en cours</p>
                </div>
                {currentUser && (
                  <div className="dx-card">
                    <span className="dx-card__title">Administrateur connecté</span>
                    <p className="dx-card__subtitle">{currentUser.fullName || currentUser.firstName || 'Administrateur'}</p>
                    <span className="dx-meta">{currentUser.email}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="dx-section">
              <div className="dx-section__header">
                <span className="dx-section__eyebrow">clients actifs</span>
                <h2 className="dx-section__title">Top 10 des contacts</h2>
                <p className="dx-section__subtitle">
                  Analysez les clients les plus actifs pour anticiper leurs besoins logistiques.
                </p>
              </div>
              {clientStats.length === 0 ? (
                <div className="dx-empty">Encore aucun client enregistré.</div>
              ) : (
                <div className="dx-table-wrapper">
                  <table className="dx-table">
                    <thead>
                      <tr>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Devis</th>
                        <th>Expéditions</th>
                        <th>Dernière activité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientStats.map((client) => (
                        <tr key={client.id}>
                          <td>{client.label}</td>
                          <td>{client.email || '-'}</td>
                          <td>{client.quotes}</td>
                          <td>{client.shipments}</td>
                          <td>{formatDate(client.lastActivity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="dx-actions">
                <Link href="/admin/quotes" className="dx-button dx-button--primary dx-button--sm">
                  Voir les dossiers clients
                </Link>
                <Link href="/admin/shipments" className="dx-button dx-button--ghost dx-button--sm">
                  Suivre les expéditions
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
