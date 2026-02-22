import React, { useEffect, useMemo, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { fetchClientShipments } from '../api/logistics';

const PAGE_SIZE = 6;

const STATUS_TONES = {
  'En attente': 'warning',
  Préparation: 'info',
  'En transit': 'info',
  'En livraison': 'info',
  'Arrivé à destination': 'success',
  Livré: 'success',
  Rejeté: 'danger',
  'Bloqué douane': 'danger',
};

const resolveStatusTone = (status) => STATUS_TONES[status] || 'info';

const Shipments = () => {
  const { getToken, isLoaded } = useBackendAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const data = await fetchClientShipments(token);
        setShipments(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        console.error('Erreur chargement expéditions client', err);
        setError(err.message || 'Impossible de charger vos expéditions.');
        setShipments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded]);

  const paginatedShipments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return shipments.slice(start, start + PAGE_SIZE);
  }, [page, shipments]);

  const totalPages = Math.max(1, Math.ceil(shipments.length / PAGE_SIZE));

  return (
    <div className="dx-dashboard-shell">
      <div className="dx-dashboard">
        <header className="dx-dashboard__header">
          <span className="dx-dashboard__eyebrow">mes expéditions</span>
          <h1 className="dx-dashboard__title">Suivi de vos envois DiaExpress</h1>
          <p className="dx-dashboard__subtitle">
            Visualisez la progression de vos colis et consultez leur statut pour anticiper vos prochaines actions.
          </p>
        </header>

        {loading ? (
          <div className="dx-empty">Chargement de vos expéditions…</div>
        ) : error ? (
          <div className="dx-empty">{error}</div>
        ) : shipments.length === 0 ? (
          <div className="dx-empty">Vous n’avez pas encore d’expédition enregistrée.</div>
        ) : (
          <section className="dx-section">
            <div className="dx-section__header">
              <span className="dx-section__eyebrow">liste opérationnelle</span>
              <h2 className="dx-section__title">Historique de vos envois</h2>
              <p className="dx-section__subtitle">
                Retrouvez le mode de transport, le code de suivi et le statut actuel de chacun de vos colis.
              </p>
            </div>
            <div className="dx-table-wrapper">
              <table className="dx-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Transport</th>
                    <th>Tracking</th>
                    <th>Statut</th>
                    <th>Mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShipments.map((shipment) => {
                    const tone = resolveStatusTone(shipment.status);
                    return (
                      <tr key={shipment._id}>
                        <td>{shipment._id?.slice(-6)}</td>
                        <td>{shipment.quoteId?.transportType || shipment.transportType || '—'}</td>
                        <td>{shipment.trackingCode || shipment.trackingNumber || '—'}</td>
                        <td>
                          <span className={`dx-status dx-status--${tone}`}>
                            {shipment.status || 'En suivi'}
                          </span>
                        </td>
                        <td>{new Date(shipment.updatedAt || shipment.createdAt || 0).toLocaleString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="dx-pagination">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageIndex) => (
                  <button
                    key={pageIndex}
                    className={pageIndex === page ? 'active' : undefined}
                    onClick={() => setPage(pageIndex)}
                  >
                    {pageIndex}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Shipments;
