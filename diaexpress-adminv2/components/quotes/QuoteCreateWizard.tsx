'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { useQuoteMeta } from '@/hooks/useQuoteMeta';
import { useTransportLinesOptions } from '@/hooks/useTransportLinesOptions';
import {
  createQuote,
  estimateQuote,
  type QuoteEstimate,
  type QuoteEstimateRequest,
  type QuoteMetaDestination
} from '@/lib/api/quotes';
import { formatCurrency, toTitle } from '@/src/lib/format';

const steps = ['Itinéraire', 'Colis', 'Estimation', 'Validation'];

const DEFAULT_FORM = {
  origin: '',
  destination: '',
  transportType: '',
  packageTypeId: '',
  weight: '',
  volume: '',
  length: '',
  width: '',
  height: '',
  recipientContactName: '',
  recipientContactEmail: '',
  contactPhone: '',
  pickupAddress: ''
};

type QuoteCreateWizardProps = {
  onQuoteCreated?: () => void;
};

type FormState = typeof DEFAULT_FORM;

type WizardStep = 1 | 2 | 3 | 4;

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function QuoteCreateWizard({ onQuoteCreated }: QuoteCreateWizardProps) {
  const { origins, loading: metaLoading, error: metaError, reload } = useQuoteMeta();
  const { lines, loading: linesLoading, error: linesError } = useTransportLinesOptions();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [step, setStep] = useState<WizardStep>(1);
  const [estimate, setEstimate] = useState<QuoteEstimate | null>(null);
  const [finalPrice, setFinalPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const routeOrigins = useMemo(() => {
    const grouped = new Map<
      string,
      { destination: string; transportTypes: string[]; transportLineId?: string }[]
    >();

    lines.forEach((line) => {
      const transports = line.transportType ? [line.transportType] : line.transportTypes || [];
      const destinations = grouped.get(line.origin) ?? [];
      const existing = destinations.find((item) => item.destination === line.destination);

      if (existing) {
        existing.transportTypes = Array.from(new Set([...existing.transportTypes, ...transports]));
      } else {
        destinations.push({ destination: line.destination, transportTypes: transports, transportLineId: line._id });
      }

      grouped.set(line.origin, destinations);
    });

    return grouped;
  }, [lines]);

  const originOptions = useMemo(() => Array.from(routeOrigins.keys()), [routeOrigins]);

  const destinations: QuoteMetaDestination[] = useMemo(() => {
    const dests = routeOrigins.get(form.origin) ?? [];
    return dests.map((destination) => ({
      destination: destination.destination,
      transportTypes: destination.transportTypes,
      packageTypes: [],
    }));
  }, [form.origin, routeOrigins]);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.destination === form.destination),
    [destinations, form.destination]
  );

  const transportTypes = useMemo(
    () => selectedDestination?.transportTypes ?? [],
    [selectedDestination]
  );

  const metaDestination = useMemo(() => {
    const metaOrigin = origins.find((origin) => origin.origin === form.origin);
    return metaOrigin?.destinations.find((destination) => destination.destination === form.destination);
  }, [form.destination, form.origin, origins]);

  const packageTypes = useMemo(
    () =>
      (metaDestination?.packageTypes || []).filter((pkg) =>
        form.transportType ? pkg.allowedTransportTypes.includes(form.transportType) : true
      ),
    [form.transportType, metaDestination?.packageTypes]
  );

  const canGoToEstimation = Boolean(form.origin && form.destination && form.transportType);

  const updateForm = (changes: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...changes }));
  };

  const handleOriginChange = (value: string) => {
    updateForm({
      origin: value,
      destination: '',
      transportType: '',
      packageTypeId: ''
    });
    setEstimate(null);
  };

  const handleDestinationChange = (value: string) => {
    updateForm({ destination: value, transportType: '', packageTypeId: '' });
    setEstimate(null);
  };

  const handleTransportChange = (value: string) => {
    updateForm({ transportType: value, packageTypeId: '' });
    setEstimate(null);
  };

  const goToStep = (next: WizardStep) => {
    if (next === 2 && !canGoToEstimation) {
      setError('Merci de sélectionner une origine, une destination et un mode de transport.');
      return;
    }
    setError(null);
    setStep(next);
  };

  const buildEstimatePayload = (): QuoteEstimateRequest => ({
    origin: form.origin,
    destination: form.destination,
    transportType: form.transportType,
    packageTypeId: form.packageTypeId || undefined,
    weight: parseNumber(form.weight),
    volume: parseNumber(form.volume),
    length: parseNumber(form.length),
    width: parseNumber(form.width),
    height: parseNumber(form.height),
    transportLineId: routeOrigins
      .get(form.origin)
      ?.find((entry) => entry.destination === form.destination)
      ?.transportLineId,
  });

  const handleEstimate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const payload = buildEstimatePayload();
      const results = await estimateQuote(payload);
      if (!results.length) {
        throw new Error("Aucune estimation disponible pour cette configuration.");
      }
      const sorted = [...results].sort((a, b) => (a.estimatedPrice || 0) - (b.estimatedPrice || 0));
      const best = sorted[0];
      setEstimate(best);
      setFinalPrice(String(best.estimatedPrice ?? ''));
      setStep(4);
    } catch (err) {
      setError((err as Error).message || "Impossible d'obtenir une estimation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const estimatedPrice = finalPrice ? Number(finalPrice) : estimate?.estimatedPrice;
      if (estimatedPrice == null || Number.isNaN(estimatedPrice)) {
        throw new Error('Veuillez saisir un montant estimé valide.');
      }
      const payload = {
        ...buildEstimatePayload(),
        estimatedPrice,
        currency: estimate?.currency,
        provider: estimate?.provider,
        recipientContactName: form.recipientContactName || undefined,
        recipientContactEmail: form.recipientContactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        productLocation: form.pickupAddress || undefined,
      };
      await createQuote(payload);
      setSuccessMessage('Devis créé et enregistré. Il est prêt pour validation ou conversion.');
      onQuoteCreated?.();
    } catch (err) {
      setError((err as Error).message || 'Impossible de créer le devis.');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setForm(DEFAULT_FORM);
    setEstimate(null);
    setFinalPrice('');
    setStep(1);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="panel">
      <div className="panel__header">
          <div>
            <div className="panel__title">Créer un devis</div>
            <p className="panel__muted">Configurez le routing, l’emballage et estimez le prix en temps réel.</p>
          </div>
        <div className="wizard__steps">
          {steps.map((label, index) => {
            const current = (index + 1) as WizardStep;
            return (
              <div key={label} className={`wizard__step ${step === current ? 'wizard__step--active' : ''}`}>
                <span>{current}</span>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {metaError ? (
        <div className="alert alert--error">
          <div>{metaError}</div>
          <Button variant="ghost" size="sm" onClick={reload} disabled={metaLoading}>
            Réessayer
          </Button>
        </div>
      ) : null}
      {linesError ? <div className="alert alert--error">{linesError}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}
      {successMessage ? <div className="alert alert--success">{successMessage}</div> : null}

      {step === 1 ? (
        <div className="grid grid--two">
          <div className="form-control">
            <label>Origine</label>
            <Select
              value={form.origin}
              onChange={(event) => handleOriginChange(event.target.value)}
              disabled={metaLoading || linesLoading}
            >
              <option value="">{metaLoading ? 'Chargement...' : 'Sélectionner une origine'}</option>
              {originOptions.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </Select>
          </div>
          <div className="form-control">
            <label>Destination</label>
            <Select
              value={form.destination}
              onChange={(event) => handleDestinationChange(event.target.value)}
              disabled={!form.origin || metaLoading || linesLoading}
            >
              <option value="">Sélectionner une destination</option>
              {destinations.map((destination) => (
                <option key={destination.destination} value={destination.destination}>
                  {destination.destination}
                </option>
              ))}
            </Select>
          </div>
          <div className="form-control">
            <label>Mode de transport</label>
            <Select
              value={form.transportType}
              onChange={(event) => handleTransportChange(event.target.value)}
              disabled={!form.destination || transportTypes.length === 0}
            >
              <option value="">Sélectionner un mode</option>
              {transportTypes.map((transport) => (
                <option key={transport} value={transport}>
                  {toTitle(transport)}
                </option>
              ))}
            </Select>
            {transportTypes.length === 0 && form.destination ? (
              <p className="muted">Aucun transport défini pour cette destination.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid--two">
          <div className="form-control">
            <label>Gabarit DiaExpress</label>
            <Select
              value={form.packageTypeId}
              onChange={(event) => updateForm({ packageTypeId: event.target.value })}
              disabled={!packageTypes.length}
            >
              <option value="">(optionnel) Choisir un gabarit</option>
              {packageTypes.map((pkg) => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.name || 'Gabarit'} – {pkg.basePrice ? formatCurrency(pkg.basePrice) : 'Tarif dynamique'}
                </option>
              ))}
            </Select>
            {!packageTypes.length ? (
              <p className="muted">Aucun gabarit disponible ou non compatible avec le transport choisi.</p>
            ) : null}
          </div>
          <div className="form-control">
            <label>Poids (kg)</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="12"
              value={form.weight}
              onChange={(event) => updateForm({ weight: event.target.value })}
            />
          </div>
          <div className="form-control">
            <label>Volume (m³)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.5"
              value={form.volume}
              onChange={(event) => updateForm({ volume: event.target.value })}
            />
          </div>
          <div className="form-control">
            <label>Dimensions (cm)</label>
            <div className="grid grid--three">
              <Input
                type="number"
                min="0"
                placeholder="L"
                value={form.length}
                onChange={(event) => updateForm({ length: event.target.value })}
              />
              <Input
                type="number"
                min="0"
                placeholder="l"
                value={form.width}
                onChange={(event) => updateForm({ width: event.target.value })}
              />
              <Input
                type="number"
                min="0"
                placeholder="h"
                value={form.height}
                onChange={(event) => updateForm({ height: event.target.value })}
              />
            </div>
            <p className="muted">Poids/volume facultatifs si un gabarit est utilisé.</p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="panel__content">
            <p className="panel__muted">
              Nous utiliserons les données ci-dessus pour interroger l’API estimateQuote. Assurez-vous que les champs
              obligatoires sont remplis avant de lancer le calcul.
            </p>
          <div className="summary-grid">
            <div>
              <strong>Itinéraire</strong>
              <p>
                {form.origin || '—'} → {form.destination || '—'} ({toTitle(form.transportType || 'N/A')})
              </p>
            </div>
            <div>
              <strong>Gabarit</strong>
              <p>{form.packageTypeId ? 'Sélectionné' : 'Non défini'}</p>
            </div>
            <div>
              <strong>Poids / Volume</strong>
              <p>
                {form.weight || '—'} kg / {form.volume || '—'} m³
              </p>
            </div>
            <div>
              <strong>Dimensions</strong>
              <p>
                {form.length || '—'} × {form.width || '—'} × {form.height || '—'} cm
              </p>
            </div>
          </div>
          <div className="panel__actions">
            <Button variant="secondary" onClick={() => goToStep(2)}>
              Retour
            </Button>
            <Button onClick={handleEstimate} disabled={!canGoToEstimation || loading}>
              {loading ? 'Calcul en cours...' : 'Lancer l\'estimation'}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 && estimate ? (
        <div className="panel__content">
          <div className="alert alert--info">
            Estimation obtenue via l’API backend: {formatCurrency(estimate.estimatedPrice, estimate.currency)}
            {estimate.provider ? <span className="muted"> ({estimate.provider})</span> : null}
          </div>
          <div className="grid grid--two">
            <div className="form-control">
              <label>Montant à enregistrer</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={finalPrice}
                onChange={(event) => setFinalPrice(event.target.value)}
              />
              <p className="muted">Vous pouvez ajuster le montant avant de sauvegarder le devis.</p>
            </div>
            <div className="form-control">
              <label>Statut cible</label>
              <QuoteStatusBadge status="pending" />
              <p className="muted">Le devis sera créé en statut pending puis validable/convertible.</p>
            </div>
          </div>
          <div className="grid grid--two">
            <div className="form-control">
              <label>Nom du client</label>
              <Input
                placeholder="Nom complet"
                value={form.recipientContactName}
                onChange={(event) => updateForm({ recipientContactName: event.target.value })}
              />
            </div>
            <div className="form-control">
              <label>Email du client</label>
              <Input
                type="email"
                placeholder="client@email.com"
                value={form.recipientContactEmail}
                onChange={(event) => updateForm({ recipientContactEmail: event.target.value })}
              />
            </div>
            <div className="form-control">
              <label>Téléphone</label>
              <Input
                placeholder="+33 6 00 00 00 00"
                value={form.contactPhone}
                onChange={(event) => updateForm({ contactPhone: event.target.value })}
              />
            </div>
            <div className="form-control">
              <label>Adresse de pickup</label>
              <Input
                placeholder="Adresse complète (si requise)"
                value={form.pickupAddress}
                onChange={(event) => updateForm({ pickupAddress: event.target.value })}
              />
            </div>
          </div>
          <div className="panel__actions">
            <Button variant="secondary" onClick={() => goToStep(3)} disabled={loading}>
              Retour
            </Button>
            <Button onClick={handleCreateQuote} disabled={loading}>
              {loading ? 'Enregistrement...' : 'Créer le devis'}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="wizard__footer wizard__footer--muted">
        <button type="button" className="link" onClick={resetWizard}>
          Réinitialiser le wizard
        </button>
      </div>
    </div>
  );
}
