'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { embarkmentStatusConfig, resolveStatusClass, resolveStatusLabel } from '@/lib/status';
import type { Embarkment, TransportLine, TransportMode } from '@/src/types/logistics';
import type { PaginatedResult } from '@/src/types/pagination';
import {
  createEmbarkment,
  disableEmbarkment,
  fetchEmbarkments,
  updateEmbarkment,
  type EmbarkmentFilters,
} from '@/src/services/api/logisticsAdmin';
import { fetchTransportLines } from '@/src/services/api/expeditions';

const TRANSPORT_OPTIONS: TransportMode[] = ['air', 'sea', 'road'];

function labelForLine(line?: TransportLine | string | null) {
  if (!line) return '—';
  if (typeof line === 'string') return line;
  return line.origin && line.destination ? `${line.origin} → ${line.destination}` : line.lineCode || line._id;
}

export function EmbarkmentsTable() {
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [filters, setFilters] = useState<EmbarkmentFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<Embarkment>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [editing, setEditing] = useState<Embarkment | null>(null);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [form, setForm] = useState({
    transportLineId: '',
    transportType: '' as TransportMode | '',
    startDate: '',
    endDate: '',
    cutoffDate: '',
    status: 'planned',
    label: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  const loadLines = async () => {
    const data = await fetchTransportLines({ page: 1, pageSize: 100, isActive: true });
    setLines(data.items || []);
  };

  const load = async (params: Partial<EmbarkmentFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const next = { ...filters, ...params } as EmbarkmentFilters;
      const today = new Date().toISOString().slice(0, 10);
      if (view === 'upcoming') {
        next.departureFrom = today;
        next.departureTo = undefined;
      } else {
        next.departureFrom = undefined;
        next.departureTo = today;
      }
      const data = await fetchEmbarkments(next);
      setPagination(data);
      setFilters(next);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    setForm({
      transportLineId: (editing?.transportLineId as string) || '',
      transportType: editing?.transportType || (editing?.transportLineId as TransportLine)?.transportType || '',
      startDate: editing?.startDate?.slice(0, 10) || '',
      endDate: editing?.endDate?.slice(0, 10) || '',
      cutoffDate: editing?.cutoffDate?.slice(0, 10) || '',
      status: editing?.status || 'planned',
      label: editing?.label || '',
      isActive: editing?.isActive ?? true,
    });
  }, [editing]);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void load({
      page: 1,
      transportLineId: (formData.get('transportLineId') as string) || undefined,
      status: (formData.get('status') as string) || undefined,
      transportType: (formData.get('transportType') as string) || undefined,
      active: formData.get('isActive') === 'active' ? true : formData.get('isActive') === 'inactive' ? false : undefined,
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload: Partial<Embarkment> = {
        transportLineId: form.transportLineId,
        transportType: form.transportType as TransportMode,
        startDate: form.startDate,
        endDate: form.endDate,
        cutoffDate: form.cutoffDate || undefined,
        status: form.status,
        label: form.label,
        isActive: form.isActive,
      };

      if (!payload.transportLineId || !payload.startDate || !payload.endDate || !payload.transportType) {
        throw new Error('Ligne, période et mode sont requis.');
      }

      if (editing?._id) {
        await updateEmbarkment(editing._id, payload);
        notify({ title: 'Embarquement mis à jour', type: 'success' });
      } else {
        await createEmbarkment(payload);
        notify({ title: 'Embarquement créé', type: 'success' });
      }

      setEditing(null);
      await load();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de sauvegarder l’embarquement';
      setError(new Error(message));
      notify({ title: 'Erreur embarquement', message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (embarkment: Embarkment) => {
    setSubmitting(true);
    try {
      if (embarkment.isActive) {
        await disableEmbarkment(embarkment._id);
        notify({ title: 'Embarquement désactivé', type: 'info' });
      } else {
        await updateEmbarkment(embarkment._id, { isActive: true });
        notify({ title: 'Embarquement activé', type: 'success' });
      }
      await load();
    } catch (err) {
      const message = (err as Error).message || 'Impossible de mettre à jour l’embarquement';
      setError(new Error(message));
      notify({ title: 'Erreur embarquement', message, type: 'error' });
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
          <h2 className="text-lg font-semibold">Fenêtres d'embarquement</h2>
          <p className="text-sm text-muted">Reliez les départs à une ligne de transport.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'upcoming' ? 'primary' : 'ghost'} onClick={() => setView('upcoming')}>
            À venir
          </Button>
          <Button variant={view === 'past' ? 'primary' : 'ghost'} onClick={() => setView('past')}>
            Passés
          </Button>
          <Button onClick={() => setEditing(null)}>Nouvel embarquement</Button>
        </div>
      </div>

      <div className="card-content">
        <form className="grid grid-cols-5 gap-2 mb-4" onSubmit={handleSubmitFilters}>
          <Select name="transportLineId" defaultValue="">
            <option value="">Ligne</option>
            {lines.map((line) => (
              <option key={line._id} value={line._id}>
                {labelForLine(line)}
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
          <Select name="status" defaultValue="">
            <option value="">Statut</option>
            <option value="planned">Planifié</option>
            <option value="booking_open">Ouvert</option>
            <option value="open">Ouvert</option>
            <option value="closed">Clôturé</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </Select>
          <Select name="isActive" defaultValue="">
            <option value="">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
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
                <th>Ligne</th>
                <th>Période</th>
                <th>Cutoff</th>
                <th>Mode</th>
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
                        <div className="skeleton" style={{ width: `${60 + cellIndex * 4}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Aucun embarquement.</div>
                  </td>
                </tr>
              ) : (
                items.map((embarkment) => (
                  <tr key={embarkment._id}>
                    <td>{labelForLine(embarkment.transportLineId as TransportLine)}</td>
                    <td>
                      {embarkment.startDate?.slice(0, 10)} → {embarkment.endDate?.slice(0, 10)}
                    </td>
                    <td>{embarkment.cutoffDate?.slice(0, 10) || '—'}</td>
                    <td>{(embarkment.transportType || '').toUpperCase()}</td>
                    <td>
                      <Badge className={resolveStatusClass(embarkment.status || 'planned', embarkmentStatusConfig)}>
                        {resolveStatusLabel(embarkment.status || 'planned', embarkmentStatusConfig)}
                      </Badge>
                    </td>
                    <td className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(embarkment)}>
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(embarkment)} disabled={submitting}>
                        {embarkment.isActive ? 'Désactiver' : 'Activer'}
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
            Page {page} / {totalPages} – {total} embarquements
          </span>
          <div className="pagination__actions">
            <Button variant="ghost" disabled={page <= 1 || loading} onClick={() => load({ page: page - 1 })}>
              Précédent
            </Button>
            <Button variant="ghost" disabled={page >= totalPages || loading} onClick={() => load({ page: page + 1 })}>
              Suivant
            </Button>
          </div>
        </div>
      </div>

      <div className="card-footer" id="embarkment-form">
        <form className="grid grid-cols-2 gap-2" onSubmit={handleSave}>
          <label className="stack">
            <span className="text-sm font-medium">Ligne de transport</span>
            <Select
              value={form.transportLineId}
              onChange={(e) => setForm({ ...form, transportLineId: e.target.value })}
              required
            >
              <option value="">Sélectionner</option>
              {lines.map((line) => (
                <option key={line._id} value={line._id}>
                  {labelForLine(line)}
                </option>
              ))}
            </Select>
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Mode</span>
            <Select
              value={form.transportType}
              onChange={(e) => setForm({ ...form, transportType: e.target.value as TransportMode })}
              required
            >
              <option value="">Choisir</option>
              {TRANSPORT_OPTIONS.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.toUpperCase()}
                </option>
              ))}
            </Select>
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Début</span>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Fin</span>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Cutoff</span>
            <Input type="date" value={form.cutoffDate} onChange={(e) => setForm({ ...form, cutoffDate: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Statut</span>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planifié</option>
              <option value="booking_open">Ouvert</option>
              <option value="open">Ouvert</option>
              <option value="closed">Clôturé</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </Select>
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Label</span>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Statut actif</span>
            <Select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </Select>
          </label>

          {error ? <div className="col-span-2 alert alert--error">{error.message}</div> : null}

          <div className="col-span-2 flex justify-end gap-2">
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
