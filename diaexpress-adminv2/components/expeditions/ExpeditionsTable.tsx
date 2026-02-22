'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ExpeditionForm } from './ExpeditionForm';
import {
  createExpedition,
  fetchExpeditions,
  fetchTransportLines,
  updateExpedition,
  type ExpeditionFilters,
} from '@/src/services/api/expeditions';
import type { Expedition, TransportLine } from '@/src/types/logistics';
import type { PaginatedResult } from '@/src/types/pagination';
import { expeditionStatusConfig, resolveStatusClass, resolveStatusLabel } from '@/lib/status';

const STATUS_OPTIONS: Expedition['status'][] = ['pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'];

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function transportSummary(expedition: Expedition) {
  const line = expedition.transportLineId as TransportLine;
  return line?.origin && line?.destination ? `${line.origin} → ${line.destination}` : '—';
}

export function ExpeditionsTable() {
  const [filters, setFilters] = useState<ExpeditionFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<Expedition>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expedition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transportLines, setTransportLines] = useState<TransportLine[]>([]);
  const { notify } = useToast();

  const loadLines = async () => {
    try {
      const data = await fetchTransportLines({ page: 1, pageSize: 100 });
      setTransportLines(data.items);
    } catch (err) {
      const message = (err as Error).message || 'Impossible de charger les lignes';
      setError(new Error(message));
      notify({ title: 'Erreur lignes', message, type: 'error' });
    }
  };

  const load = async (params: Partial<ExpeditionFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const nextParams = { ...filters, ...params } as ExpeditionFilters;
      const data = await fetchExpeditions(nextParams);
      setPagination(data);
      setFilters(nextParams);
    } catch (err) {
      const message = (err as Error).message || 'Impossible de charger les expéditions';
      setError(new Error(message));
      notify({ title: 'Erreur expéditions', message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    void load({
      page: 1,
      status: (formData.get('status') as string) || undefined,
      origin: (formData.get('origin') as string) || undefined,
      destination: (formData.get('destination') as string) || undefined,
      transportType: (formData.get('transportType') as string) || undefined,
    });
  };

  const handleSave = async (payload: Partial<Expedition>) => {
    setSubmitting(true);
    try {
      if (editing?._id) {
        await updateExpedition(editing._id, payload);
        notify({ title: 'Expédition mise à jour', type: 'success' });
      } else {
        await createExpedition(payload);
        notify({ title: 'Expédition créée', type: 'success' });
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de sauvegarder l’expédition';
      setError(new Error(message));
      notify({ title: 'Erreur expédition', message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const { items, total, page, pageSize } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expéditions / Embarquements</h2>
          <p className="text-sm text-muted">Suivi des expéditions planifiées et en transit.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nouvelle expédition
        </Button>
      </div>

      <div className="card-content">
        <form className="grid grid-cols-5 gap-2 mb-4" onSubmit={handleSubmitFilters}>
          <Select name="status" defaultValue={filters.status ?? ''}>
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Input name="origin" placeholder="Origine" defaultValue={filters.origin} />
          <Input name="destination" placeholder="Destination" defaultValue={filters.destination} />
          <Select name="transportType" defaultValue={filters.transportType ?? ''}>
            <option value="">Tous les modes</option>
            <option value="air">Air</option>
            <option value="sea">Mer</option>
            <option value="road">Route</option>
          </Select>
          <Button type="submit" disabled={loading}>
            Filtrer
          </Button>
        </form>

        {error ? <div className="alert alert--error">{error.message}</div> : null}

        <div className="table-wrapper">
          <Table>
            <TableHeader>
              <tr>
                <th>Route</th>
                <th>Modes</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Statut</th>
                <th>Mise à jour</th>
                <th>Actions</th>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <td key={`skeleton-${cellIndex}`}>
                        <div className="skeleton" style={{ width: `${60 + cellIndex * 3}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">Aucune expédition.</div>
                  </td>
                </tr>
              ) : (
                items.map((expedition) => {
                  const line = expedition.transportLineId as TransportLine;
                  return (
                    <tr key={expedition._id}>
                      <td>{transportSummary(expedition)}</td>
                      <td>{line?.transportTypes?.join(', ') || '—'}</td>
                      <td>{formatDate(expedition.plannedDepartureDate)}</td>
                      <td>{formatDate(expedition.plannedArrivalDate)}</td>
                      <td>
                        <Badge className={resolveStatusClass(expedition.status, expeditionStatusConfig)}>
                          {resolveStatusLabel(expedition.status, expeditionStatusConfig)}
                        </Badge>
                      </td>
                      <td>{expedition.updatedAt ? new Date(expedition.updatedAt).toLocaleString() : '—'}</td>
                      <td className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(expedition);
                            setShowForm(true);
                          }}
                        >
                          Éditer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pagination mt-4">
          <span>
            Page {page} / {totalPages} – {total} expéditions
          </span>
          <div className="pagination__actions">
            <Button
              type="button"
              variant="ghost"
              disabled={page <= 1 || loading}
              onClick={() => load({ page: page - 1 })}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={page >= totalPages || loading}
              onClick={() => load({ page: page + 1 })}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="card-footer">
          <ExpeditionForm
            transportLines={transportLines}
            initialData={editing || undefined}
            onSubmit={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            submitting={submitting}
          />
        </div>
      ) : null}
    </Card>
  );
}
