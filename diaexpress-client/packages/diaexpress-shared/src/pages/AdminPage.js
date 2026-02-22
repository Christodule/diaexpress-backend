import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminAuthGuard } from '../auth/useAdminAuthGuard';
import {
  fetchAdminQuotes as apiFetchAdminQuotes,
  fetchAdminShipments as apiFetchAdminShipments,
  fetchAdminPricing as apiFetchAdminPricing,
  fetchCurrentUser as apiFetchCurrentUser,
} from '../api/logistics';

const QUOTE_STATUS_VARIANTS = {
  pending: { label: 'En attente', tone: 'warning', icon: '⏳' },
  confirmed: { label: 'Confirmé', tone: 'success', icon: '✅' },
  dispatched: { label: 'Expédié', tone: 'info', icon: '🚚' },
  paid: { label: 'Payé', tone: 'success', icon: '💳' },
  rejected: { label: 'Rejeté', tone: 'danger', icon: '❌' },
};

const resolveQuoteStatus = (status) => QUOTE_STATUS_VARIANTS[status] || QUOTE_STATUS_VARIANTS.pending;

const formatCurrency = (value, currency = 'EUR') => {
  if (!Number.isFinite(Number(value))) {
    return '-';
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${Number(value).toFixed(0)} ${currency}`;
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const AdminPage = () => {
  const { requireAdminToken, isAdminReady } = useAdminAuthGuard();
  const [quotes, setQuotes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [pricing, setPricing] = useState([]);
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

        const [quotesData, shipmentsData, pricingData, me] = await Promise.all([
          apiFetchAdminQuotes(token),
          apiFetchAdminShipments(token),
          apiFetchAdminPricing(token),
          apiFetchCurrentUser(token).catch(() => null),
        ]);

        setQuotes(Array.isArray(quotesData) ? quotesData : []);
        setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
        setPricing(Array.isArray(pricingData) ? pricingData : []);
        setCurrentUser(me);
        setError('');
      } catch (err) {
        console.error('Erreur chargement dashboard', err);
        setError(err.message || "Impossible de charger les données du dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminReady, requireAdminToken]);

  const quoteSummary = useMemo(() => {
    const counts = {
      total: quotes.length,
      pending: 0,
      confirmed: 0,
      dispatched: 0,
      rejected: 0,
      revenue: 0,
      clients: new Set(),
    };

    quotes.forEach((quote) => {
      const status = quote.status || 'pending';
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
      const estimated = Number(quote.estimatedPrice ?? quote.price ?? 0);
      if (Number.isFinite(estimated)) {
        counts.revenue += estimated;
      }
      if (quote.userEmail) {
        counts.clients.add(quote.userEmail);
      }
    });

    return {
      total: counts.total,
      pending: counts.pending,
      confirmed: counts.confirmed,
      dispatched: counts.dispatched,
      rejected: counts.rejected,
      revenue: counts.revenue,
      clients: counts.clients.size,
      confirmationRate: counts.total ? Math.round((counts.confirmed / counts.total) * 100) : 0,
    };
  }, [quotes]);

  const shipmentSummary = useMemo(() => {
    const statusCounts = {
      total: shipments.length,
      inTransit: 0,
      delivered: 0,
      blocked: 0,
    };

    shipments.forEach((shipment) => {
      const status = shipment.status || '';
      if (['En transit', 'En livraison', 'Préparation', 'booked'].includes(status)) {
        statusCounts.inTransit += 1;
      }
      if (['Livré', 'Arrivé à destination', 'delivered'].includes(status)) {
        statusCounts.delivered += 1;
      }
      if (['Bloqué douane', 'blocked'].includes(status)) {
        statusCounts.blocked += 1;
      }
    });

    return statusCounts;
  }, [shipments]);

  const pricingSummary = useMemo(() => {
    const routes = new Set();
    pricing.forEach((pricingItem) => {
      routes.add(`${pricingItem.origin}→${pricingItem.destination}`);
    });

    return {
      total: pricing.length,
      routes: routes.size,
    };
  }, [pricing]);

  const recentQuotes = useMemo(() => {
    return [...quotes]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [quotes]);

  const recentShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [shipments]);

  return (
    <div className="dx-dashboard-shell">
      <div className="dx-dashboard">
        <header className="dx-dashboard__header">
          <span className="dx-dashboard__eyebrow">administration diaexpress</span>
          <h1 className="dx-dashboard__title">Pilotage logistique centralisé</h1>
          <p className="dx-dashboard__subtitle">
            Suivez vos devis, expéditions et grilles tarifaires en temps réel pour arbitrer les priorités
            opérationnelles.
          </p>
          <div className="dx-dashboard__actions">
            <Link href="/admin/quotes" className="dx-button dx-button--primary dx-button--sm">
              Consulter les devis
            </Link>
            <Link href="/admin/shipments" className="dx-button dx-button--ghost dx-button--sm">
              Suivre les expéditions
            </Link>
            <Link href="/admin/pricing" className="dx-button dx-button--ghost dx-button--sm">
              Ajuster les tarifs
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="dx-empty">Chargement du dashboard…</div>
        ) : error ? (
          <div className="dx-empty">{error}</div>
        ) : (
          <>
            <section className="dx-section dx-section--surface">
              <div className="dx-section__header">
                <span className="dx-section__eyebrow">indicateurs clés</span>
                <h2 className="dx-section__title">Vue synthétique du pipeline</h2>
                <p className="dx-section__subtitle">
                  Un aperçu des volumes traités et des actions prioritaires côté devis et expéditions.
                </p>
              </div>
              <div className="dx-grid dx-grid--four">
                <div className="dx-card">
                  <span className="dx-card__title">Devis suivis</span>
                  <span className="dx-card__value">{quoteSummary.total}</span>
                  <p className="dx-card__subtitle">{quoteSummary.clients} clients actifs ce mois-ci</p>
                </div>
                <div className="dx-card">
                  <span className="dx-card__title">Taux de confirmation</span>
                  <span className="dx-card__value">{quoteSummary.confirmationRate}%</span>
                  <p className="dx-card__subtitle">{quoteSummary.confirmed} devis validés</p>
                </div>
                <div className="dx-card">
                  <span className="dx-card__title">Expéditions en cours</span>
                  <span className="dx-card__value">{shipmentSummary.inTransit}</span>
                  <p className="dx-card__subtitle">{shipmentSummary.delivered} livrées, {shipmentSummary.blocked} en alerte</p>
                </div>
                <div className="dx-card">
                  <span className="dx-card__title">Routes tarifaires</span>
                  <span className="dx-card__value">{pricingSummary.routes}</span>
                  <p className="dx-card__subtitle">{pricingSummary.total} configurations actives</p>
                </div>
              </div>
            </section>

            <section className="dx-section">
              <div className="dx-section__header">
                <span className="dx-section__eyebrow">activité récente</span>
                <h2 className="dx-section__title">Derniers devis clients</h2>
                <p className="dx-section__subtitle">
                  Surveillez les demandes à traiter et orientez vos équipes commerciales vers les devis chauds.
                </p>
              </div>
              {recentQuotes.length === 0 ? (
                <div className="dx-empty">Aucun devis enregistré pour le moment.</div>
              ) : (
                <div className="dx-table-wrapper">
                  <table className="dx-table">
                    <thead>
                      <tr>
                        <th>Réf.</th>
                        <th>Client</th>
                        <th>Origine</th>
                        <th>Destination</th>
                        <th>Transport</th>
                        <th>Montant estimé</th>
                        <th>Statut</th>
                        <th>MAJ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuotes.map((quote) => {
                        const status = resolveQuoteStatus(quote.status);
                        return (
                          <tr key={quote._id}>
                            <td>{quote._id?.slice(-6)}</td>
                            <td>
                              <div className="dx-meta">
                                <strong>{quote.userEmail || 'Client direct'}</strong>
                                {quote.provider && <span>Offre {quote.provider}</span>}
                              </div>
                            </td>
                            <td>{quote.origin}</td>
                            <td>{quote.destination}</td>
                            <td>{quote.transportType}</td>
                            <td>{formatCurrency(quote.estimatedPrice ?? quote.price, quote.currency || 'EUR')}</td>
                            <td>
                              <span className={`dx-status dx-status--${status.tone}`}>
                                <span aria-hidden>{status.icon}</span>
                                <span>{status.label}</span>
                              </span>
                            </td>
                            <td>{formatDate(quote.updatedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="dx-actions">
                <Link href="/admin/quotes" className="dx-button dx-button--primary dx-button--sm">
                  Gérer les devis
                </Link>
                <Link href="/admin/quotes" className="dx-button dx-button--ghost dx-button--sm">
                  Voir tous les devis
                </Link>
              </div>
            </section>

            <section className="dx-section">
              <div className="dx-section__header">
                <span className="dx-section__eyebrow">suivi opérationnel</span>
                <h2 className="dx-section__title">Expéditions en attention</h2>
                <p className="dx-section__subtitle">
                  Identifiez les expéditions à risque et partagez les prochaines étapes avec les équipes terrain.
                </p>
              </div>
              {recentShipments.length === 0 ? (
                <div className="dx-empty">Aucune expédition en cours.</div>
              ) : (
                <div className="dx-grid dx-grid--two">
                  {recentShipments.map((shipment) => (
                    <div key={shipment._id} className="dx-card">
                      <div className="dx-card__title">Tracking {shipment.trackingCode}</div>
                      <div className="dx-meta">
                        <span>{shipment.status}</span>
                        <span>{shipment.quoteId?.origin} → {shipment.quoteId?.destination}</span>
                      </div>
                      <p className="dx-card__subtitle">
                        Dernière mise à jour : {formatDate(shipment.updatedAt || shipment.createdAt)}
                      </p>
                      <Link href="/admin/shipments" className="dx-button dx-button--ghost dx-button--sm">
                        Ouvrir la fiche
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="dx-section">
              <div className="dx-section__header">
                <span className="dx-section__eyebrow">tarification</span>
                <h2 className="dx-section__title">Vos routes configurées</h2>
                <p className="dx-section__subtitle">
                  Vérifiez en un coup d'œil les corridors couverts par vos grilles internes.
                </p>
              </div>
              {pricing.length === 0 ? (
                <div className="dx-empty">Aucune grille tarifaire enregistrée.</div>
              ) : (
                <div className="dx-table-wrapper">
                  <table className="dx-table">
                    <thead>
                      <tr>
                        <th>Origine</th>
                        <th>Destination</th>
                        <th>Modes</th>
                        <th>Dernière MAJ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.slice(0, 6).map((price) => (
                        <tr key={price._id}>
                          <td>{price.origin}</td>
                          <td>{price.destination}</td>
                          <td>{(price.transportPrices || []).map((tp) => tp.transportType).join(', ') || '-'}</td>
                          <td>{formatDate(price.updatedAt || price.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="dx-actions">
                <Link href="/admin/pricing" className="dx-button dx-button--primary dx-button--sm">
                  Modifier les grilles
                </Link>
              </div>
            </section>

            {currentUser && (
              <section className="dx-section dx-section--surface">
                <div className="dx-section__header">
                  <span className="dx-section__eyebrow">votre session</span>
                  <h2 className="dx-section__title">Responsable connecté</h2>
                  <p className="dx-section__subtitle">
                    Conservez la trace de l’administrateur actuellement aux commandes.
                  </p>
                </div>
                <div className="dx-grid dx-grid--two">
                  <div className="dx-card">
                    <div className="dx-card__title">{currentUser.fullName || currentUser.firstName || 'Administrateur'}</div>
                    <div className="dx-meta">
                      <span>{currentUser.email}</span>
                      {currentUser.role && <span>Rôle : {currentUser.role}</span>}
                    </div>
                    <p className="dx-card__subtitle">Dernière connexion : {formatDate(currentUser.updatedAt || currentUser.createdAt)}</p>
                  </div>
                  <div className="dx-card">
                    <div className="dx-card__title">Synthèse</div>
                    <div className="dx-meta">
                      <span>{quoteSummary.total} devis suivis</span>
                      <span>{shipmentSummary.total} expéditions actives</span>
                      <span>{pricingSummary.total} grilles tarifaires</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
