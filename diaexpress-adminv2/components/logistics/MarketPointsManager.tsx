'use client';

import { useEffect, useState } from 'react';
import { ActiveBadge } from './ActiveBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Country, MarketPoint } from '@/src/types/logistics';
import {
  createMarketPoint,
  disableMarketPoint,
  fetchCountries,
  fetchMarketPoints,
  type MarketPointFilters,
  updateMarketPoint,
} from '@/src/services/api/logisticsAdmin';
import type { PaginatedResult } from '@/src/types/pagination';

const TYPES: { value: string; label: string }[] = [
  { value: 'agency', label: 'Agence' },
  { value: 'hub', label: 'Hub' },
  { value: 'relay', label: 'Relais' },
];

export function MarketPointsManager() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filters, setFilters] = useState<MarketPointFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<MarketPoint>>({ items: [], page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MarketPoint | null>(null);
  const [form, setForm] = useState({
    name: '',
    countryId: '',
    type: 'agency',
    city: '',
    addressText: '',
    lat: '',
    lng: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCountries = async () => {
    const data = await fetchCountries({ page: 1, pageSize: 100 });
    setCountries(data.items || []);
  };

  const load = async (params: Partial<MarketPointFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const next = { ...filters, ...params } as MarketPointFilters;
      const data = await fetchMarketPoints(next);
      setPagination(data);
      setFilters(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      name: editing?.name || '',
      countryId: (editing?.countryId as string) || '',
      type: editing?.type || 'agency',
      city: editing?.city || '',
      addressText: editing?.addressText || '',
      lat: editing?.geo?.lat?.toString() || '',
      lng: editing?.geo?.lng?.toString() || '',
      isActive: editing?.isActive ?? (editing as any)?.active ?? true,
    });
  }, [editing]);

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Partial<MarketPoint> = {
        name: form.name,
        countryId: form.countryId,
        type: form.type as MarketPoint['type'],
        city: form.city,
        addressText: form.addressText,
        geo:
          form.lat || form.lng
            ? { lat: Number(form.lat) || undefined, lng: Number(form.lng) || undefined }
            : undefined,
        isActive: form.isActive,
      };

      if (editing?._id) {
        await updateMarketPoint(editing._id, payload);
      } else {
        await createMarketPoint(payload);
      }

      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (mp: MarketPoint) => {
    setSubmitting(true);
    try {
      if (mp.isActive ?? (mp as any).active) {
        await disableMarketPoint(mp._id);
      } else {
        await updateMarketPoint(mp._id, { isActive: true });
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const { items, page, pageSize, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <div className="card-header flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Présences DiaExpress</h2>
          <p className="text-sm text-muted">MarketPoints reliés à un pays opérateur.</p>
        </div>
        <Button onClick={() => setEditing(null)}>Nouveau point</Button>
      </div>

      <div className="card-content space-y-4">
        <form
          className="grid grid-cols-5 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load({ page: 1, search: filters.search, countryId: filters.countryId, active: filters.active });
          }}
        >
          <Select
            value={filters.countryId || ''}
            onChange={(e) => load({ page: 1, countryId: e.target.value || undefined })}
          >
            <option value="">Tous les pays</option>
            {countries.map((country) => (
              <option key={country._id} value={country._id}>
                {country.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.active === undefined ? '' : filters.active ? 'true' : 'false'}
            onChange={(e) => load({ page: 1, active: e.target.value === '' ? undefined : e.target.value === 'true' })}
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </Select>
          <Input
            placeholder="Recherche"
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <Button type="submit" disabled={loading}>
            Filtrer
          </Button>
          <Button type="button" variant="ghost" onClick={() => load({ page: 1, search: undefined })} disabled={loading}>
            Rafraîchir
          </Button>
        </form>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Pays</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Chargement...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aucun MarketPoint.</td>
                </tr>
              ) : (
                items.map((mp) => (
                  <tr key={mp._id}>
                    <td>{mp.name}</td>
                    <td>{mp.countryName || (mp.countryId as Country)?.name || mp.countryCode}</td>
                    <td>
                      <span className="badge">{mp.type}</span>
                    </td>
                    <td>{mp.city || '—'}</td>
                    <td>
                      <ActiveBadge active={mp.isActive ?? (mp as any).active} />
                    </td>
                    <td className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(mp)}>
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(mp)} disabled={submitting}>
                        {mp.isActive ?? (mp as any).active ? 'Désactiver' : 'Activer'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>
            Page {page} / {totalPages} – {total} points
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

      <div className="card-footer">
        <form className="grid grid-cols-3 gap-2" onSubmit={submitForm}>
          <label className="stack">
            <span className="text-sm font-medium">Nom</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Pays</span>
            <Select
              value={form.countryId}
              onChange={(e) => setForm({ ...form, countryId: e.target.value })}
              required
            >
              <option value="">Sélectionner un pays</option>
              {countries.map((country) => (
                <option key={country._id} value={country._id}>
                  {country.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Type</span>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Ville / Libellé</span>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Adresse</span>
            <Input value={form.addressText} onChange={(e) => setForm({ ...form, addressText: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Statut</span>
            <Select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </Select>
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Latitude</span>
            <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Longitude</span>
            <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          </label>

          {error ? <div className="col-span-3 alert alert--error">{error}</div> : null}

          <div className="col-span-3 flex justify-end gap-2">
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
