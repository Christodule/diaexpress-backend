import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { fetchShipmentById } from '@/src/services/api/logisticsShipments';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/src/lib/format';
import { resolveStatusLabel, shipmentStatusConfig } from '@/lib/status';

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  try {
    const shipment = await fetchShipmentById(params.id);
    const routeLabel =
      shipment.meta?.quote?.origin && shipment.meta?.quote?.destination
        ? `${shipment.meta.quote.origin} → ${shipment.meta.quote.destination}`
        : '—';
    return (
      <div className="page-stack">
        <PageHeader title={`Shipment ${shipment.trackingCode}`} description={routeLabel} />
        <div className="status-grid">
          <div className="stat-card">
            <p>Statut</p>
            <strong>{resolveStatusLabel(shipment.status, shipmentStatusConfig)}</strong>
          </div>
          <div className="stat-card">
            <p>Provider</p>
            <strong>{shipment.provider || 'internal'}</strong>
          </div>
          <div className="stat-card">
            <p>ETA</p>
            <strong>{formatDate(shipment.estimatedDelivery)}</strong>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
