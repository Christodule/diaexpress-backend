'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchShipmentTracking } from '@/src/services/api/logisticsShipments';
import type { Shipment } from '@/src/types/logistics';
import { formatDate, toTitle } from '@/src/lib/format';

export function TrackingSearch() {
  const [trackingCode, setTrackingCode] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShipmentTracking(trackingCode);
      const resolvedShipment = result?.shipment ?? null;
      setShipment(resolvedShipment);
      if (!resolvedShipment) {
        setError('Aucun colis trouvé pour ce tracking.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-widget">
      <form onSubmit={handleSubmit} className="resource-table__filters">
        <Input
          placeholder="Tracking code"
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          Chercher
        </Button>
      </form>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {shipment ? (
        <div className="tracking-card">
          <div>
            <strong>{shipment.trackingCode}</strong>
            <p>
              {shipment.origin} → {shipment.destination}
            </p>
          </div>
          <div>
            <Badge>{toTitle(shipment.status)}</Badge>
            <p>ETA {formatDate(shipment.estimatedDelivery)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
