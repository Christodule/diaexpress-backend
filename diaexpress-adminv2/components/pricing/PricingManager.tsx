'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, toTitle } from '@/src/lib/format';
import { createPricingRule, fetchPackageTypes, fetchPricingRules } from '@/src/services/api/logisticsPricing';
import { fetchTransportLines } from '@/src/services/api/expeditions';
import type { PackageType, PricingRule, TransportLine } from '@/src/types/logistics';

const UNIT_OPTIONS = ['kg', 'm3'];

type DimensionRangeInput = { min: string; max: string; price: string; priority: string };

type PackagePricingInput = { packageTypeId: string; basePrice: string };

type PricingFormState = {
  transportLineId: string;
  transportType: PricingRule['transportType'] | '';
  unitType: string;
  pricePerUnit: string;
  dimensionRanges: DimensionRangeInput[];
  packagePricing: PackagePricingInput[];
};

const DEFAULT_FORM: PricingFormState = {
  transportLineId: '',
  transportType: '',
  unitType: 'kg',
  pricePerUnit: '',
  dimensionRanges: [{ min: '', max: '', price: '', priority: '1' }],
  packagePricing: [{ packageTypeId: '', basePrice: '' }],
};

export function PricingManager() {
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [transportLines, setTransportLines] = useState<TransportLine[]>([]);
  const [form, setForm] = useState<PricingFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [{ pricing: pricingRules = [] }, packageTypes, lines] = await Promise.all([
          fetchPricingRules(),
          fetchPackageTypes(),
          fetchTransportLines({ page: 1, pageSize: 200, isActive: true }),
        ]);
        if (!mounted) return;
        setPricing(pricingRules);
        setPackages(packageTypes.packageTypes ?? []);
        setTransportLines(lines.items ?? []);
      } catch (err) {
        if (!mounted) return;
        const message = (err as Error).message || 'Impossible de charger les tarifs';
        setError(message);
        notify({ title: 'Chargement tarifs', message, type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateForm = (changes: Partial<PricingFormState>) => {
    setForm((prev) => ({ ...prev, ...changes }));
  };

  const selectedLine = useMemo(
    () => transportLines.find((line) => line._id === form.transportLineId),
    [form.transportLineId, transportLines]
  );

  const transportOptions = useMemo(() => selectedLine?.transportTypes || [], [selectedLine]);

  useEffect(() => {
    if (form.transportType && transportOptions.includes(form.transportType)) return;
    if (transportOptions.length) {
      setForm((prev) => ({ ...prev, transportType: transportOptions[0] }));
    }
  }, [form.transportType, transportOptions]);

  const dimensionRanges = useMemo(() => form.dimensionRanges, [form.dimensionRanges]);
  const packagePricing = useMemo(() => form.packagePricing, [form.packagePricing]);

  const handleDimensionChange = (index: number, changes: Partial<DimensionRangeInput>) => {
    updateForm({
      dimensionRanges: dimensionRanges.map((range, i) => (i === index ? { ...range, ...changes } : range)),
    });
  };

  const handlePackagePricingChange = (index: number, changes: Partial<PackagePricingInput>) => {
    updateForm({
      packagePricing: packagePricing.map((pkg, i) => (i === index ? { ...pkg, ...changes } : pkg)),
    });
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.transportLineId || !form.transportType) {
      setError('Ligne de transport et mode requis.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PricingRule> = {
        transportLineId: form.transportLineId,
        transportPrices: [
          {
            transportType: form.transportType,
            unitType: form.unitType,
            allowedUnits: [form.unitType],
            pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
            dimensionRanges: form.dimensionRanges
              .filter((range) => range.min || range.max || range.price)
              .map((range) => ({
                min: range.min ? Number(range.min) : undefined,
                max: range.max ? Number(range.max) : undefined,
                price: Number(range.price),
                priority: range.priority ? Number(range.priority) : undefined,
              }))
              .filter((range) => !Number.isNaN(range.price)),
            packagePricing: form.packagePricing
              .filter((pkg) => pkg.packageTypeId && pkg.basePrice)
              .map((pkg) => ({
                packageTypeId: pkg.packageTypeId,
                basePrice: Number(pkg.basePrice),
              })),
          },
        ],
      };

      await createPricingRule(payload);
      setMessage('Tarif créé avec succès.');
      notify({ title: 'Tarif créé', type: 'success' });
      resetForm();

      const refreshed = await fetchPricingRules();
      setPricing(refreshed.pricing ?? []);
    } catch (err) {
      const message = (err as Error).message || 'Impossible de créer le tarif';
      setError(message);
      notify({ title: 'Erreur création tarif', message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const packageMap = useMemo(() => new Map(packages.map((pkg) => [pkg._id, pkg.label])), [packages]);
  const transportLineMap = useMemo(
    () => new Map(transportLines.map((line) => [line._id, line])),
    [transportLines]
  );

  return (
    <div className="page-stack">
      <Card>
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Nouveau tarif</h2>
            <p className="text-sm text-muted">Définissez les prix par ligne et mode de transport.</p>
          </div>
          <Button type="button" variant="ghost" onClick={resetForm} disabled={submitting}>
            Réinitialiser
          </Button>
        </div>

        <form className="card-content stack" onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-3">
            <label className="stack">
              <span className="text-sm font-medium">Ligne de transport</span>
              <Select
                value={form.transportLineId}
                onChange={(e) => updateForm({ transportLineId: e.target.value })}
                required
              >
                <option value="">Choisir une ligne</option>
                {transportLines.map((line) => (
                  <option key={line._id} value={line._id}>
                    {line.origin} → {line.destination} ({line.lineCode})
                  </option>
                ))}
              </Select>
            </label>
            <label className="stack">
              <span className="text-sm font-medium">Mode</span>
              <Select
                value={form.transportType}
                onChange={(e) => updateForm({ transportType: e.target.value as PricingRule['transportType'] })}
                required
                disabled={!transportOptions.length}
              >
                <option value="">Choisir</option>
                {transportOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </Select>
            </label>
            <label className="stack">
              <span className="text-sm font-medium">Unité</span>
              <Select value={form.unitType} onChange={(e) => updateForm({ unitType: e.target.value })}>
                {UNIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="stack">
              <span className="text-sm font-medium">Prix / unité</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerUnit}
                onChange={(e) => updateForm({ pricePerUnit: e.target.value })}
                placeholder="12.5"
              />
            </label>
          </div>

          <div className="stack">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tranches dimensionnelles</h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  updateForm({ dimensionRanges: [...dimensionRanges, { min: '', max: '', price: '', priority: '1' }] })
                }
              >
                + Ajouter une tranche
              </Button>
            </div>
            <div className="stack">
              {dimensionRanges.map((range, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={range.min}
                    onChange={(e) => handleDimensionChange(index, { min: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={range.max}
                    onChange={(e) => handleDimensionChange(index, { max: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Prix"
                    value={range.price}
                    onChange={(e) => handleDimensionChange(index, { price: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Priorité"
                    value={range.priority}
                    onChange={(e) => handleDimensionChange(index, { priority: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="stack">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tarifs par gabarit</h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  updateForm({ packagePricing: [...packagePricing, { packageTypeId: '', basePrice: '' }] })
                }
              >
                + Ajouter un gabarit
              </Button>
            </div>
            <div className="stack">
              {packagePricing.map((pkg, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Select
                    value={pkg.packageTypeId}
                    onChange={(e) => handlePackagePricingChange(index, { packageTypeId: e.target.value })}
                  >
                    <option value="">Sélectionner un type de colis</option>
                    {packages.map((packageType) => (
                      <option key={packageType._id} value={packageType._id}>
                        {packageType.label || packageType._id}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Prix de base"
                    value={pkg.basePrice}
                    onChange={(e) => handlePackagePricingChange(index, { basePrice: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {error ? <div className="alert alert--error">{error}</div> : null}
          {message ? <div className="alert alert--success">{message}</div> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer le tarif'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="card-header">
          <div>
            <h2 className="text-lg font-semibold">Tarifs existants</h2>
            <p className="text-sm text-muted">Liste consolidée des tarifs récupérés depuis /api/pricing.</p>
          </div>
        </div>

        <div className="card-content table-wrapper">
          <Table>
            <TableHeader>
              <tr>
                <th>Ligne</th>
                <th>Modes</th>
                <th>Unité</th>
                <th>Prix</th>
                <th>Tranches</th>
                <th>Packages</th>
              </tr>
            </TableHeader>
            <TableBody>
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
              ) : pricing.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Aucun tarif configuré.</div>
                  </td>
                </tr>
              ) : (
                pricing.map((rule) => {
                  const line = rule.transportLineId ? transportLineMap.get(rule.transportLineId) : undefined;
                  const transportPrices = rule.transportPrices ?? [];
                  const primaryPrice = transportPrices[0];
                  return (
                    <tr key={rule._id}>
                      <td>
                        <div className="stack">
                          <strong>
                            {line?.origin && line?.destination
                              ? `${line.origin} → ${line.destination}`
                              : `${rule.origin || '—'} → ${rule.destination || ''}`}
                          </strong>
                          <span className="text-xs text-muted">{line?.lineCode || rule.transportLineId || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {transportPrices.length
                          ? transportPrices.map((price) => toTitle(price.transportType)).join(', ')
                          : toTitle(rule.transportType)}
                      </td>
                      <td>{primaryPrice?.unitType || rule.unitType || '—'}</td>
                      <td>
                        {primaryPrice?.pricePerUnit != null
                          ? formatCurrency(primaryPrice.pricePerUnit)
                          : rule.pricePerUnit != null
                          ? formatCurrency(rule.pricePerUnit)
                          : '—'}
                      </td>
                      <td>
                        {primaryPrice?.dimensionRanges?.length
                          ? primaryPrice.dimensionRanges
                              .map(
                                (range) =>
                                  `${range.min ?? 0}-${range.max ?? '∞'} : ${formatCurrency(range.price)} (P${
                                    range.priority ?? 1
                                  })`
                              )
                              .join(', ')
                          : '—'}
                      </td>
                      <td>
                        {primaryPrice?.packagePricing?.length
                          ? primaryPrice.packagePricing
                              .map((pkg) => `${packageMap.get(pkg.packageTypeId) || pkg.packageTypeId}: ${formatCurrency(pkg.basePrice)}`)
                              .join(', ')
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
