'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate, toTitle } from '@/src/lib/format';
import { resolveStatusClass, resolveStatusLabel, shipmentStatusConfig } from '@/lib/status';
import type { Embarkment, Shipment } from '@/src/types/logistics';

export type ShipmentStatusUpdate = {
  status?: Shipment['status'];
  location?: string;
  note?: string;
};

type ShipmentDetailsDrawerProps = {
  open: boolean;
  shipment: Shipment | null;
  embarkments: Embarkment[];
  loading?: boolean;
  onClose: () => void;
  onSaveStatus: (payload: ShipmentStatusUpdate) => void;
  onAssignEmbarkment: (embarkmentId: string) => void;
};

const STATUS_OPTIONS: Shipment['status'][] = [
  'pending',
  'booked',
  'dispatched',
  'scheduled',
  'in_transit',
  'arrived',
  'delivered',
  'cancelled',
];

export function ShipmentDetailsDrawer({
  open,
  shipment,
  embarkments,
  loading,
  onClose,
  onSaveStatus,
  onAssignEmbarkment,
}: ShipmentDetailsDrawerProps) {
  const [status, setStatus] = useState<Shipment['status']>('pending');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [embarkmentId, setEmbarkmentId] = useState('');

  useEffect(() => {
    if (!open || !shipment) return;
    setStatus(shipment.status || 'pending');
    setLocation(shipment.currentLocation || '');
    setNote('');
    setEmbarkmentId(shipment.embarkmentId || '');
  }, [open, shipment]);

  const sortedUpdates = useMemo(() => {
    const updates = shipment?.trackingUpdates ? [...shipment.trackingUpdates] : [];
    return updates.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }, [shipment?.trackingUpdates]);

  if (!open || !shipment) return null;

  const routeLabel = shipment.meta?.quote?.origin && shipment.meta?.quote?.destination
    ? `${shipment.meta.quote.origin} → ${shipment.meta.quote.destination}`
    : '—';

  return (
    <div className="drawer">
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">Shipment {shipment.trackingCode}</div>
            <p className="panel__muted">{routeLabel} · {toTitle(shipment.provider || 'internal')}</p>
          </div>
          <div className="panel__actions">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="drawer__content stack gap-4">
          <div className="summary-grid">
            <div>
              <strong>Statut actuel</strong>
              <Badge className={resolveStatusClass(shipment.status, shipmentStatusConfig)}>
                {resolveStatusLabel(shipment.status, shipmentStatusConfig)}
              </Badge>
            </div>
            <div>
              <strong>Localisation</strong>
              <p>{shipment.currentLocation || '—'}</p>
            </div>
            <div>
              <strong>ETA</strong>
              <p>{formatDate(shipment.estimatedDelivery)}</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <div className="panel__title">Mettre à jour le suivi</div>
                <p className="panel__muted">Ajoutez un événement de tracking ou changez le statut.</p>
              </div>
            </div>
            <div className="panel__content stack gap-3">
              <label className="stack">
                <span className="text-sm font-medium">Nouveau statut</span>
                <Select value={status} onChange={(event) => setStatus(event.target.value as Shipment['status'])}>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {resolveStatusLabel(value, shipmentStatusConfig)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="stack">
                <span className="text-sm font-medium">Localisation</span>
                <Input
                  placeholder="Douala, CM"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </label>
              <label className="stack">
                <span className="text-sm font-medium">Note interne</span>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Décrivez la mise à jour"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <div className="panel__actions">
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => onSaveStatus({ status, location: location || undefined, note: note || undefined })}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer le suivi'}
                </Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <div className="panel__title">Assigner un embarquement</div>
                <p className="panel__muted">Reliez le shipment à un embarquement planifié.</p>
              </div>
            </div>
            <div className="panel__content stack gap-3">
              <Select value={embarkmentId} onChange={(event) => setEmbarkmentId(event.target.value)}>
                <option value="">Sélectionner un embarquement</option>
                {embarkments.map((embarkment) => (
                  <option key={embarkment._id} value={embarkment._id}>
                    {embarkment.label || `Embarquement ${embarkment._id.slice(-6)}`} – {embarkment.startDate?.slice(0, 10)}
                  </option>
                ))}
              </Select>
              <div className="panel__actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !embarkmentId}
                  onClick={() => onAssignEmbarkment(embarkmentId)}
                >
                  Assigner
                </Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <div className="panel__title">Timeline</div>
                <p className="panel__muted">Historique des événements liés au shipment.</p>
              </div>
            </div>
            <div className="panel__content">
              {sortedUpdates.length ? (
                <div className="stack gap-3">
                  {sortedUpdates.map((update, index) => (
                    <div key={index} className="border p-3 rounded">
                      <div className="flex items-center justify-between">
                        <Badge className={resolveStatusClass(update.status || shipment.status, shipmentStatusConfig)}>
                          {resolveStatusLabel(update.status || shipment.status, shipmentStatusConfig)}
                        </Badge>
                        <span className="text-xs text-muted">{formatDate(update.timestamp)}</span>
                      </div>
                      <p className="text-sm">{update.location || shipment.currentLocation || '—'}</p>
                      {update.note ? <p className="text-xs text-muted">{update.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucun événement enregistré.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
