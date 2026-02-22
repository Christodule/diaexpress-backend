import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  SHIPMENT_STATUS_FLOW,
  formatStatusComment,
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
  const [inputError, setInputError] = useState('');
  const [hasSearched, setHasSearched] = useState(Boolean(initialCode));

  const handleSearch = useCallback(
    async (code) => {
      const codeToSearch = (code ?? trackingCode).trim();
      if (!codeToSearch) return;

      try {
        setIsLoading(true);
        setHasSearched(true);
        setInputError('');
        setError('');
        setShipment(null);
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
        const message = err?.message?.toLowerCase().includes('introuvable') ||
          err?.message?.toLowerCase().includes('not')
            ? 'Aucun colis trouvé pour ce code. Vérifiez votre numéro.'
            : err?.message || 'Impossible de récupérer le suivi. Réessayez dans un instant.';
        setError(message);
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

  const resolveTone = (status) => {
    if (!status) return 'info';
    const normalized = status.toLowerCase();
    if (normalized.includes('livr')) return 'success';
    if (normalized.includes('annul') || normalized.includes('rejet')) return 'danger';
    if (normalized.includes('attente') || normalized.includes('prépa')) return 'warning';
    return 'info';
  };

  const handleSubmitSearch = (event) => {
    event.preventDefault();
    const trimmed = trackingCode.trim();
    if (!trimmed) {
      setInputError('Veuillez saisir un code de suivi.');
      setHasSearched(false);
      return;
    }
    handleSearch(trimmed);
  };

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
    <div className="dx-dashboard-shell track-shipment-page">
      <div className="dx-dashboard">
        <header className="dx-dashboard__header">
          <span className="dx-dashboard__eyebrow">suivi en temps réel</span>
          <h1 className="dx-dashboard__title">Suivi de colis</h1>
          <p className="dx-dashboard__subtitle">
            Saisissez votre code de suivi DiaExpress pour voir l’état de votre envoi.
          </p>
        </header>

        <div className="dx-grid dx-grid--two track-shipment__layout">
          <section className="dx-card track-shipment__search-card">
            <h2 className="track-shipment__card-title">Rechercher un envoi</h2>
            <form className="dx-form track-shipment__form" onSubmit={handleSubmitSearch}>
              <div className="dx-form__group">
                <label className="dx-label" htmlFor="trackingCode">
                  Code de suivi
                </label>
                <input
                  id="trackingCode"
                  type="text"
                  className="dx-input"
                  placeholder="Ex. DEX-2025-00045"
                  value={trackingCode}
                  onChange={(e) => {
                    setTrackingCode(e.target.value);
                    setInputError('');
                    setError('');
                  }}
                />
                {inputError && (
                  <p className="track-shipment__input-error">{inputError}</p>
                )}
              </div>
              <div className="track-shipment__actions">
                <button
                  type="submit"
                  className="dx-button dx-button--primary"
                  disabled={isLoading || !trackingCode.trim()}
                >
                  {isLoading ? 'Recherche…' : 'Rechercher'}
                </button>
              </div>
            </form>
          </section>

          <section className="dx-card track-shipment__details-card">
            {isLoading ? (
              <div className="track-shipment__empty">Recherche en cours…</div>
            ) : shipment ? (
              <>
                <div className="track-shipment__status-header">
                  <div>
                    <span className="track-shipment__code-label">Code suivi</span>
                    <p className="track-shipment__code">{shipment.trackingCode || trackingCode}</p>
                    <span className="track-shipment__helper">
                      Dernière mise à jour : {renderTimestamp(shipment.updatedAt || shipment.statusHistory?.slice(-1)[0]?.timestamp)}
                    </span>
                  </div>
                  {shipment.status && (
                    <span className={`dx-status dx-status--${resolveTone(shipment.status)} track-shipment__status-badge`}>
                      {SHIPMENT_STATUS_MAP[shipment.status]?.label || shipment.status}
                    </span>
                  )}
                </div>

                <div className="track-shipment__highlights">
                  <div>
                    <span className="track-shipment__meta-label">Origine</span>
                    <span className="track-shipment__meta-value">
                      {shipment.quoteId?.origin || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="track-shipment__meta-label">Destination</span>
                    <span className="track-shipment__meta-value">
                      {shipment.quoteId?.destination || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="track-shipment__meta-label">Transport</span>
                    <span className="track-shipment__meta-value">
                      {shipment.quoteId?.transportType || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="track-shipment__meta-label">Marchandise</span>
                    <span className="track-shipment__meta-value">
                      {shipment.quoteId?.productType || '—'}
                    </span>
                  </div>
                </div>

                <div className="track-shipment__progress">
                  {SHIPMENT_STATUS_FLOW.map((step, index) => (
                    <div
                      key={step.value}
                      className={`track-shipment__progress-step ${
                        index <= currentStepIndex && currentStepIndex !== -1
                          ? 'track-shipment__progress-step--active'
                          : ''
                      }`}
                    >
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="track-shipment__timeline">
                  <h3>Historique des statuts</h3>
                  {statusHistory.length === 0 ? (
                    <p className="track-shipment__helper">Aucun historique disponible.</p>
                  ) : (
                    <ol>
                      {statusHistory.map((entry, idx) => {
                        const meta = SHIPMENT_STATUS_MAP[entry.status] || {
                          label: entry.status,
                        };

                        return (
                          <li key={`${entry.status}-${entry.timestamp || idx}`}>
                            <div className="track-shipment__timeline-item">
                              <span className="track-shipment__timeline-dot" />
                              <div className="track-shipment__timeline-content">
                                <div className="track-shipment__timeline-header">
                                  <span className={`dx-status dx-status--${resolveTone(entry.status)}`}>
                                    {meta.label}
                                  </span>
                                  <span className="track-shipment__timeline-date">
                                    {renderTimestamp(entry.timestamp)}
                                  </span>
                                </div>
                                <p className="track-shipment__timeline-comment">
                                  {entry.comment || formatStatusComment(entry.status)}
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </>
            ) : hasSearched ? (
              <div className="track-shipment__empty track-shipment__empty--notice">
                {error || 'Aucun colis trouvé pour ce code. Vérifiez votre numéro.'}
              </div>
            ) : (
              <div className="track-shipment__empty">
                Saisissez un code de suivi pour visualiser le parcours de votre envoi.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default TrackShipment;
