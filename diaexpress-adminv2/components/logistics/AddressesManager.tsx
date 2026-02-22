'use client';

import { useEffect, useState } from 'react';
import { ActiveBadge } from './ActiveBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AdminAddress, MarketPoint } from '@/src/types/logistics';
import {
  createLogisticsAddress,
  disableLogisticsAddress,
  fetchLogisticsAddresses,
  fetchMarketPoints,
  type AddressFilters,
  updateLogisticsAddress,
} from '@/src/services/api/logisticsAdmin';
import type { PaginatedResult } from '@/src/types/pagination';

export function AddressesManager() {
  const [marketPoints, setMarketPoints] = useState<MarketPoint[]>([]);
  const [filters, setFilters] = useState<AddressFilters>({ page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState<PaginatedResult<AdminAddress>>({ items: [], page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminAddress | null>(null);
  const [form, setForm] = useState({
    marketPointId: '',
    label: '',
    contactName: '',
    contactPhone: '',
    addressText: '',
    lat: '',
    lng: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadMarketPoints = async () => {
    const data = await fetchMarketPoints({ page: 1, pageSize: 100, active: true });
    setMarketPoints(data.items || []);
  };

  const load = async (params: Partial<AddressFilters> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const next = { ...filters, ...params } as AddressFilters;
      const data = await fetchLogisticsAddresses(next);
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
    void loadMarketPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      marketPointId: (editing?.marketPointId as string) || '',
      label: editing?.label || '',
      contactName: editing?.contactName || '',
      contactPhone: editing?.contactPhone || '',
      addressText: editing?.addressText || editing?.line1 || '',
      lat: editing?.geo?.lat?.toString() || '',
      lng: editing?.geo?.lng?.toString() || '',
      isActive: editing?.isActive ?? true,
    });
  }, [editing]);

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const marketPoint = marketPoints.find((mp) => mp._id === form.marketPointId);
      const payload: Partial<AdminAddress> = {
        marketPointId: form.marketPointId,
        label: form.label,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        addressText: form.addressText,
        country: marketPoint?.countryCode || 'N/A',
        countryCode: marketPoint?.countryCode,
        geo:
          form.lat || form.lng
            ? { lat: Number(form.lat) || undefined, lng: Number(form.lng) || undefined }
            : undefined,
        isActive: form.isActive,
      };

      if (editing?._id) {
        await updateLogisticsAddress(editing._id, payload);
      } else {
        await createLogisticsAddress(payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (address: AdminAddress) => {
    setSubmitting(true);
    try {
      if (address.isActive ?? (address as any).active) {
        await disableLogisticsAddress(address._id);
      } else {
        await updateLogisticsAddress(address._id, { isActive: true });
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
          <h2 className="text-lg font-semibold">Adresses logistiques</h2>
          <p className="text-sm text-muted">Points physiques rattachés à un MarketPoint.</p>
        </div>
        <Button onClick={() => setEditing(null)}>Nouvelle adresse</Button>
      </div>

      <div className="card-content space-y-4">
        <form className="grid grid-cols-3 gap-2" onSubmit={(e) => e.preventDefault()}>
          <Select
            value={filters.marketPointId || ''}
            onChange={(e) => load({ page: 1, marketPointId: e.target.value || undefined })}
          >
            <option value="">Tous les points</option>
            {marketPoints.map((mp) => (
              <option key={mp._id} value={mp._id}>
                {mp.name}
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
          <Button type="button" variant="ghost" onClick={() => load({ page: 1 })} disabled={loading}>
            Rafraîchir
          </Button>
        </form>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>MarketPoint</th>
                <th>Contact</th>
                <th>Adresse</th>
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
                  <td colSpan={6}>Aucune adresse.</td>
                </tr>
              ) : (
                items.map((address) => (
                  <tr key={address._id}>
                    <td>{address.label}</td>
                    <td>{(address.marketPointId as MarketPoint)?.name || address.marketPointId || '—'}</td>
                    <td>
                      <div className="stack">
                        <span>{address.contactName || '—'}</span>
                        <span className="text-xs text-muted">{address.contactPhone || '—'}</span>
                      </div>
                    </td>
                    <td>{address.addressText || address.line1}</td>
                    <td>
                      <ActiveBadge active={address.isActive ?? (address as any).active} />
                    </td>
                    <td className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(address)}>
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(address)} disabled={submitting}>
                        {address.isActive ?? (address as any).active ? 'Désactiver' : 'Activer'}
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
            Page {page} / {totalPages} – {total} adresses
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
            <span className="text-sm font-medium">MarketPoint</span>
            <Select
              value={form.marketPointId}
              onChange={(e) => setForm({ ...form, marketPointId: e.target.value })}
              required
            >
              <option value="">Sélectionner un point</option>
              {marketPoints.map((mp) => (
                <option key={mp._id} value={mp._id}>
                  {mp.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Label</span>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Contact</span>
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </label>

          <label className="stack">
            <span className="text-sm font-medium">Téléphone</span>
            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </label>
          <label className="stack">
            <span className="text-sm font-medium">Adresse</span>
            <Input value={form.addressText} onChange={(e) => setForm({ ...form, addressText: e.target.value })} required />
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
