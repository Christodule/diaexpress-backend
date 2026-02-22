'use client';

import { useEffect, useState } from 'react';
import { ActiveBadge } from './ActiveBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Country } from '@/src/types/logistics';
import {
  createCountry,
  disableCountry,
  fetchCountries,
  type CountryFilters,
  updateCountry,
} from '@/src/services/api/logisticsAdmin';
import type { PaginatedResult } from '@/src/types/pagination';

export function CountriesManager() {
  const [filters, setFilters] = useState<CountryFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<Country>>({ items: [], page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState({ code: '', name: '', active: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async (params: Partial<CountryFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const next = { ...filters, ...params } as CountryFilters;
      const data = await fetchCountries(next);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      code: editing?.code || '',
      name: editing?.name || '',
      active: editing?.isActive ?? editing?.active ?? true,
    });
  }, [editing]);

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editing?._id) {
        await updateCountry(editing._id, form);
      } else {
        await createCountry(form);
      }
      setEditing(null);
      setForm({ code: '', name: '', active: true });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (country: Country) => {
    setSubmitting(true);
    try {
      if (country.isActive ?? country.active) {
        await disableCountry(country._id);
      } else {
        await updateCountry(country._id, { active: true });
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
          <h2 className="text-lg font-semibold">Pays opérés</h2>
          <p className="text-sm text-muted">Structurez les origines et destinations disponibles.</p>
        </div>
        <Button onClick={() => setEditing(null)}>Nouveau pays</Button>
      </div>

      <div className="card-content space-y-4">
        <form className="flex gap-2" onSubmit={(e) => load({ page: 1, active: filters.active, ...filters })}>
          <Select
            value={filters.active === undefined ? '' : filters.active ? 'true' : 'false'}
            onChange={(e) => load({ page: 1, active: e.target.value === '' ? undefined : e.target.value === 'true' })}
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </Select>
          <Button type="button" variant="ghost" onClick={() => load({ page: 1 })} disabled={loading}>
            Rafraîchir
          </Button>
        </form>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Chargement...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4}>Aucun pays configuré.</td>
                </tr>
              ) : (
                items.map((country) => (
                  <tr key={country._id}>
                    <td>{country.code}</td>
                    <td>{country.name}</td>
                    <td>
                      <ActiveBadge active={country.isActive ?? (country as any).active} />
                    </td>
                    <td className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(country)}>
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(country)} disabled={submitting}>
                        {country.isActive ?? (country as any).active ? 'Désactiver' : 'Activer'}
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
            Page {page} / {totalPages} – {total} pays
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
            <span className="text-sm font-medium">Code ISO</span>
            <Input
              value={form.code}
              maxLength={3}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="BF"
              required
            />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Nom</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Burkina Faso" required />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Statut</span>
            <Select
              value={form.active ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </Select>
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
