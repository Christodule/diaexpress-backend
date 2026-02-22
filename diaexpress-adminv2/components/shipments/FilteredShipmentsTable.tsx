'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { fetchShipments } from '@/src/services/api/logisticsShipments';
import { formatDate } from '@/src/lib/format';
import { resolveStatusLabel, shipmentStatusConfig } from '@/lib/status';
import type { Shipment } from '@/src/types/logistics';

export function FilteredShipmentsTable({
  statuses,
  title,
  description,
}: {
  statuses: Shipment['status'][];
  title: string;
  description: string;
}) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const result = await fetchShipments({ page: 1, pageSize: 200 });
        if (!mounted) return;
        setShipments(result.items);
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message || 'Impossible de charger les expéditions clients');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return shipments
      .filter((shipment) => statuses.includes(shipment.status))
      .filter((shipment) =>
        lower
          ? [shipment.trackingCode, shipment.origin, shipment.destination]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(lower))
          : true,
      );
  }, [search, shipments, statuses]);

  return (
    <Card>
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Input
          placeholder="Rechercher une expédition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
      </div>

      <div className="card-content table-wrapper">
        {error ? <div className="alert alert--error">{error}</div> : null}
        <Table>
          <TableHeader>
            <tr>
              <th>Tracking</th>
              <th>Route</th>
              <th>Transport</th>
              <th>Statut</th>
              <th>Mise à jour</th>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={5}>Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>Aucune expédition à afficher.</td>
              </tr>
            ) : (
              filtered.map((shipment) => (
                <tr key={shipment._id}>
                  <td className="mono">{shipment.trackingCode}</td>
                  <td>
                    <div className="cell-stack">
                      <strong>
                        {shipment.origin} → {shipment.destination}
                      </strong>
                      <span className="muted text-xs">{shipment.provider || 'internal'}</span>
                    </div>
                  </td>
                  <td>{shipment.carrier || shipment.provider || '—'}</td>
                  <td>{resolveStatusLabel(shipment.status, shipmentStatusConfig)}</td>
                  <td>{formatDate(shipment.updatedAt)}</td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="card-footer flex justify-end">
        <Button type="button" variant="ghost" onClick={() => setSearch('')} disabled={loading}>
          Réinitialiser la recherche
        </Button>
      </div>
    </Card>
  );
}
