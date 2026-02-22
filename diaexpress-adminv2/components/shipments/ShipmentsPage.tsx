'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { ShipmentDetailsDrawer } from './ShipmentDetailsDrawer';
import { useToast } from '@/components/ui/toast';
import { useShipments } from '@/hooks/useShipments';
import { fetchEmbarkments } from '@/src/services/api/logisticsAdmin';
import { assignShipmentEmbarkment, updateShipmentStatus } from '@/src/services/api/logisticsShipments';
import { resolveStatusClass, resolveStatusLabel, shipmentStatusConfig } from '@/lib/status';
import { formatDate } from '@/src/lib/format';
import type { Embarkment, Shipment } from '@/src/types/logistics';

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

export function ShipmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [embarkments, setEmbarkments] = useState<Embarkment[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const { notify } = useToast();

  const { items, total, totalPages, loading, error, refresh } = useShipments({
    page,
    pageSize: 20,
    search,
    status: status || undefined,
  });

  useEffect(() => {
    let mounted = true;
    const loadEmbarkments = async () => {
    try {
      const data = await fetchEmbarkments({ page: 1, pageSize: 200, active: true });
      if (!mounted) return;
      setEmbarkments(data.items || []);
    } catch (err) {
      if (!mounted) return;
      const message = (err as Error).message || 'Impossible de charger les embarquements';
      setActionError(message);
      notify({ title: 'Chargement embarquements', message, type: 'error' });
    }
  };

    void loadEmbarkments();
    return () => {
      mounted = false;
    };
  }, []);

  const resetFeedback = () => {
    setActionMessage(null);
    setActionError(null);
  };

  const handleStatusUpdate = async (payload: { status?: Shipment['status']; location?: string; note?: string }) => {
    if (!selected) return;
    try {
      setDrawerLoading(true);
      await updateShipmentStatus(selected._id, payload);
      setActionMessage('Shipment mis à jour.');
      notify({ title: 'Shipment mis à jour', type: 'success' });
      refresh();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de mettre à jour le shipment.';
      setActionError(message);
      notify({ title: 'Mise à jour échouée', message, type: 'error' });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleAssign = async (embarkmentId: string) => {
    if (!selected) return;
    try {
      setDrawerLoading(true);
      await assignShipmentEmbarkment(selected._id, embarkmentId);
      setActionMessage('Shipment assigné à l’embarquement.');
      notify({ title: 'Shipment assigné', type: 'success' });
      refresh();
    } catch (err) {
      const message = (err as Error).message || 'Impossible d’assigner le shipment.';
      setActionError(message);
      notify({ title: 'Assignation échouée', message, type: 'error' });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    resetFeedback();
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Shipments"
        description="Suivez les shipments issus des devis et pilotez le tracking opérationnel."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'Shipments' }]}
      />

      <div className="panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">Filtres & recherche</div>
            <p className="panel__muted">Recherchez un shipment par tracking, devis ou client.</p>
          </div>
          <div className="panel__actions">
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              Rafraîchir
            </Button>
          </div>
        </div>
        <form className="filters" onSubmit={(event) => event.preventDefault()}>
          <Input
            placeholder="Tracking, route, devis..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {resolveStatusLabel(value, shipmentStatusConfig)}
              </option>
            ))}
          </Select>
        </form>
      </div>

      {actionMessage ? <div className="alert alert--success">{actionMessage}</div> : null}
      {actionError ? <div className="alert alert--error">{actionError}</div> : null}
      {error ? <div className="alert alert--error">{error.message}</div> : null}

      <div className="panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">Tous les shipments</div>
            <p className="panel__muted">{total} shipment(s) trouvés.</p>
          </div>
        </div>
        <div className="table-wrapper">
          <Table>
            <TableHeader>
              <tr>
                <th>Tracking</th>
                <th>Route</th>
                <th>Quote</th>
                <th>Statut</th>
                <th>Dernière maj</th>
                <th>Actions</th>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <td key={`skeleton-cell-${cellIndex}`}>
                        <div className="skeleton" style={{ width: `${60 + cellIndex * 4}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Aucun shipment trouvé.</div>
                  </td>
                </tr>
              ) : (
                items.map((shipment) => (
                  <tr key={shipment._id}>
                    <td className="mono">{shipment.trackingCode}</td>
                    <td>
                      {shipment.meta?.quote?.origin && shipment.meta?.quote?.destination
                        ? `${shipment.meta.quote.origin} → ${shipment.meta.quote.destination}`
                        : '—'}
                    </td>
                    <td className="mono">{shipment.quoteId}</td>
                    <td>
                      <Badge className={resolveStatusClass(shipment.status, shipmentStatusConfig)}>
                        {resolveStatusLabel(shipment.status, shipmentStatusConfig)}
                      </Badge>
                    </td>
                    <td>{formatDate(shipment.updatedAt)}</td>
                    <td>
                      <Button type="button" variant="ghost" onClick={() => setSelected(shipment)}>
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pagination">
          <span>
            Page {page} / {totalPages} – {total} éléments
          </span>
          <div className="pagination__actions">
            <Button type="button" variant="ghost" disabled={page <= 1 || loading} onClick={() => handlePageChange(page - 1)}>
              Précédent
            </Button>
            <Button type="button" variant="ghost" disabled={page >= totalPages || loading} onClick={() => handlePageChange(page + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      </div>

      <ShipmentDetailsDrawer
        open={Boolean(selected)}
        shipment={selected}
        embarkments={embarkments}
        loading={drawerLoading}
        onClose={() => setSelected(null)}
        onSaveStatus={handleStatusUpdate}
        onAssignEmbarkment={handleAssign}
      />
    </div>
  );
}
