import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  SHIPMENT_STATUS_FLOW,
  formatStatusComment,
  getStatusBadgeClass,
  getStatusIndex,
  SHIPMENT_STATUS_MAP,
} from '../constants/shipmentStatus';
import { trackShipment } from '../api/shipments';

const TrackShipment = () => {
  const router = useRouter();
  const queryCode = router.query.code;
  const initialCode = typeof queryCode === 'string' ? queryCode : '';
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(
    async (code) => {
      const codeToSearch = (code ?? trackingCode).trim();
      if (!codeToSearch) return;

      try {
        setIsLoading(true);
        const data = await trackShipment(codeToSearch);
        const mergedShipment = data?.shipment
          ? {
              ...data.shipment,
              statusHistory:
                data.shipment.statusHistory || data.statusHistory || [],
            }
          : null;
        setShipment(mergedShipment);
        setError('');
      } catch (err) {
        setShipment(null);
        setError(err.message || 'Erreur');
      } finally {
        setIsLoading(false);
      }
    },
    [trackingCode]
  );

  useEffect(() => {
    if (!router.isReady) return;
    if (!initialCode) return;
    setTrackingCode(initialCode);
    handleSearch(initialCode);
  }, [router.isReady, initialCode, handleSearch]);

  const statusHistory = useMemo(() => {
    if (!shipment?.statusHistory || !Array.isArray(shipment.statusHistory)) {
      return [];
    }

    return [...shipment.statusHistory]
      .filter((entry) => entry?.status)
      .sort((a, b) => {
        const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return aTime - bTime;
      });
  }, [shipment]);

  const currentStepIndex = shipment?.status
    ? getStatusIndex(shipment.status)
    : -1;

  const renderTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="track-shipment-page">
      <h2>🔍 Suivi de colis</h2>
      <div className="track-form">
        <input
          type="text"
          placeholder="Entrez le code de tracking"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {shipment && (
        <div className="shipment-info">
          <h3>Détails de l'envoi :</h3>
          <p><strong>Produit :</strong> {shipment.quoteId?.productType || '—'}</p>
          <p><strong>Origine :</strong> {shipment.quoteId?.origin || '—'}</p>
          <p><strong>Destination :</strong> {shipment.quoteId?.destination || '—'}</p>
          <p><strong>Transport :</strong> {shipment.quoteId?.transportType || '—'}</p>
          <p><strong>Statut actuel :</strong> {shipment.status}</p>

          <div className="progress-bar">
            {SHIPMENT_STATUS_FLOW.map((step, index) => (
              <div
                key={index}
                className={`progress-step ${
                  index <= currentStepIndex && currentStepIndex !== -1 ? 'active' : ''
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>

          <div className="status-history">
            <h4>Historique des statuts</h4>
            {statusHistory.length === 0 ? (
              <p className="empty-history">Aucun historique disponible.</p>
            ) : (
              <ul>
                {statusHistory.map((entry, idx) => {
                  const meta = SHIPMENT_STATUS_MAP[entry.status] || {
                    label: entry.status,
                    badgeClass: 'bg-gray-100 text-gray-700',
                  };

                  return (
                    <li key={`${entry.status}-${entry.timestamp || idx}`}>
                      <div className="history-item">
                        <div className="history-marker" />
                        <div className="history-content">
                          <div className="history-header">
                            <span className={`history-status ${getStatusBadgeClass(entry.status)}`}>
                              {meta.label}
                            </span>
                            <span className="history-date">{renderTimestamp(entry.timestamp)}</span>
                          </div>
                          <p className="history-comment">
                            {entry.comment || formatStatusComment(entry.status)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackShipment;
