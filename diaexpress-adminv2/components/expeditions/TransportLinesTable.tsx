'use client';

import { useEffect, useState } from 'react';
import { ActiveBadge } from '@/components/logistics/ActiveBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { MarketPoint, TransportLine, TransportMode } from '@/src/types/logistics';
import type { PaginatedResult } from '@/src/types/pagination';
import { fetchMarketPoints } from '@/src/services/api/logisticsAdmin';
import {
  createTransportLine,
  disableTransportLine,
  fetchTransportLines,
  updateTransportLine,
  type TransportLineFilters,
} from '@/src/services/api/expeditions';

const TRANSPORT_OPTIONS: TransportMode[] = ['air', 'sea', 'road'];

function labelForMarketPoint(mp?: MarketPoint | string | null) {
  if (!mp) return '—';
  if (typeof mp === 'string') return mp;
  return mp.label || mp.city || mp.name || '—';
}

export function TransportLinesTable() {
  const [marketPoints, setMarketPoints] = useState<MarketPoint[]>([]);
  const [filters, setFilters] = useState<TransportLineFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<TransportLine>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TransportLine | null>(null);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    transportType: '' as TransportMode | '',
    isActive: true,
    lineCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  const loadOptions = async () => {
    const data = await fetchMarketPoints({ page: 1, pageSize: 100, active: true });
    setMarketPoints(data.items || []);
  };

  const load = async (params: Partial<TransportLineFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const nextParams = { ...filters, ...params } as TransportLineFilters;
      const data = await fetchTransportLines(nextParams);
      setPagination(data);
      setFilters(nextParams);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      origin: editing?.origin || '',
      destination: editing?.destination || '',
      transportType: editing?.transportType || editing?.transportTypes?.[0] || '',
      isActive: editing?.isActive ?? true,
      lineCode: editing?.lineCode || '',
    });
  }, [editing]);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void load({
      page: 1,
      origin: (formData.get('origin') as string) || undefined,
      destination: (formData.get('destination') as string) || undefined,
      transportType: (formData.get('transportType') as string) || undefined,
      isActive: formData.get('isActive') === 'active' ? true : formData.get('isActive') === 'inactive' ? false : undefined,
    });
  };

  const handleSaveLine = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload: Partial<TransportLine> = {
        origin: form.origin,
        destination: form.destination,
        transportType: form.transportType as TransportMode,
        transportTypes: form.transportType ? [form.transportType as TransportMode] : [],
        isActive: form.isActive,
        lineCode: form.lineCode,
      };
      if (!payload.origin || !payload.destination || !payload.transportType || !payload.lineCode) {
        throw new Error('Origine, destination et mode de transport sont requis.');
      }

      if (editing?._id) {
        await updateTransportLine(editing._id, payload);
        notify({ title: 'Ligne mise à jour', type: 'success' });
      } else {
        await createTransportLine(payload);
        notify({ title: 'Ligne créée', type: 'success' });
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de sauvegarder la ligne';
      setError(new Error(message));
      notify({ title: 'Erreur ligne', message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (line: TransportLine) => {
    setSubmitting(true);
    try {
      if (line.isActive) {
        await disableTransportLine(line._id);
        notify({ title: 'Ligne désactivée', type: 'info' });
      } else {
        await updateTransportLine(line._id, { isActive: true });
        notify({ title: 'Ligne activée', type: 'success' });
      }
      await load();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de mettre à jour la ligne';
      setError(new Error(message));
      notify({ title: 'Erreur ligne', message, type: 'error' });
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
          <h2 className="text-lg font-semibold">Lignes de transport</h2>
          <p className="text-sm text-muted">Liez deux MarketPoints avec un mode de transport exploitable.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nouvelle ligne de transport
        </Button>
      </div>

      <div className="card-content">
        <form className="grid grid-cols-5 gap-2 mb-4" onSubmit={handleSubmitFilters}>
          <Select name="origin" defaultValue="">
            <option value="">Origine</option>
            {marketPoints.map((mp) => (
              <option key={mp._id} value={labelForMarketPoint(mp)}>
                {labelForMarketPoint(mp)}
              </option>
            ))}
          </Select>
          <Select name="destination" defaultValue="">
            <option value="">Destination</option>
            {marketPoints.map((mp) => (
              <option key={mp._id} value={labelForMarketPoint(mp)}>
                {labelForMarketPoint(mp)}
              </option>
            ))}
          </Select>
          <Select name="transportType" defaultValue="">
            <option value="">Mode</option>
            {TRANSPORT_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {mode.toUpperCase()}
              </option>
            ))}
          </Select>
          <Select name="isActive" defaultValue="">
            <option value="">Statut</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </Select>
          <Button type="submit" disabled={loading}>
            Filtrer
          </Button>
        </form>

        {error ? <div className="alert alert--error">{error.message}</div> : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Origine</th>
                <th>Destination</th>
                <th>Mode</th>
                <th>Code</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <td key={`skeleton-${cellIndex}`}>
                        <div className="skeleton" style={{ width: `${60 + cellIndex * 3}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Aucune ligne disponible.</div>
                  </td>
                </tr>
              ) : (
                items.map((line) => (
                  <tr key={line._id}>
                    <td>{line.origin || '—'}</td>
                    <td>{line.destination || '—'}</td>
                    <td>{(line.transportType || line.transportTypes?.[0] || '').toString().toUpperCase()}</td>
                    <td>{line.lineCode || '—'}</td>
                    <td>
                      <ActiveBadge active={line.isActive} />
                    </td>
                    <td className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(line);
                          setShowForm(true);
                        }}
                      >
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleActive(line)} disabled={submitting}>
                        {line.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination mt-4">
          <span>
            Page {page} / {totalPages} – {total} lignes
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
          <form className="grid grid-cols-2 gap-2" onSubmit={handleSaveLine}>
            <label className="stack">
              <span className="text-sm font-medium">Origine</span>
              <Select
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                required
              >
                <option value="">Sélectionner</option>
                {marketPoints.map((mp) => (
                  <option key={mp._id} value={labelForMarketPoint(mp)}>
                    {labelForMarketPoint(mp)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="stack">
              <span className="text-sm font-medium">Destination</span>
              <Select
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              >
                <option value="">Sélectionner</option>
                {marketPoints.map((mp) => (
                  <option key={mp._id} value={labelForMarketPoint(mp)}>
                    {labelForMarketPoint(mp)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="stack">
              <span className="text-sm font-medium">Mode de transport</span>
              <Select
                value={form.transportType}
                onChange={(e) => setForm({ ...form, transportType: e.target.value as TransportMode })}
                required
              >
                <option value="">Choisir un mode</option>
                {TRANSPORT_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.toUpperCase()}
                  </option>
                ))}
              </Select>
            </label>

            <label className="stack">
              <span className="text-sm font-medium">Code de ligne (optionnel)</span>
              <Input value={form.lineCode} onChange={(e) => setForm({ ...form, lineCode: e.target.value })} required />
            </label>

            <label className="stack">
              <span className="text-sm font-medium">Statut</span>
              <Select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </label>

            {error ? <div className="col-span-2 alert alert--error">{error.message}</div> : null}

            <div className="col-span-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </Card>
  );
}
