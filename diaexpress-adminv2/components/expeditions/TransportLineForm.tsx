'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { TransportLine, TransportMode } from '@/src/types/logistics';

const TRANSPORT_OPTIONS: TransportMode[] = ['air', 'sea', 'road'];

type TransportLineFormProps = {
  initialData?: Partial<TransportLine>;
  onSubmit: (payload: Partial<TransportLine>) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

export function TransportLineForm({ initialData, onSubmit, onCancel, submitting }: TransportLineFormProps) {
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [transportType, setTransportType] = useState<TransportMode | ''>(
    initialData?.transportType || initialData?.transportTypes?.[0] || ''
  );
  const [transportTypes, setTransportTypes] = useState<TransportMode[]>(initialData?.transportTypes || []);
  const [country, setCountry] = useState(initialData?.country || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [lineCode, setLineCode] = useState(initialData?.lineCode || '');
  const [estimatedTransitDays, setEstimatedTransitDays] = useState<string>(
    initialData?.estimatedTransitDays ? String(initialData.estimatedTransitDays) : '',
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [departureDates, setDepartureDates] = useState(
    initialData?.departureDates?.join(', ') || ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(initialData?.origin || '');
    setDestination(initialData?.destination || '');
    setTransportType(initialData?.transportType || initialData?.transportTypes?.[0] || '');
    setTransportTypes(initialData?.transportTypes || []);
    setCountry(initialData?.country || '');
    setLocation(initialData?.location || '');
    setLineCode(initialData?.lineCode || '');
    setEstimatedTransitDays(initialData?.estimatedTransitDays ? String(initialData.estimatedTransitDays) : '');
    setNotes(initialData?.notes || '');
    setDepartureDates(initialData?.departureDates?.join(', ') || '');
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const normalizedTransportTypes = useMemo(() => {
    if (transportType) return [transportType];
    return transportTypes.length ? transportTypes : [];
  }, [transportType, transportTypes]);

  const handleTransportChange = (mode: TransportMode | '') => {
    setTransportType(mode);
    setTransportTypes(mode ? [mode] : []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!origin || !destination || !normalizedTransportTypes.length) {
      setError('Origine, destination et type de transport sont requis.');
      return;
    }

    await onSubmit({
      origin,
      destination,
      country: country || undefined,
      location: location || undefined,
      lineCode: lineCode || `${origin}-${destination}`,
      transportType: transportType || normalizedTransportTypes[0],
      transportTypes: normalizedTransportTypes,
      notes: notes || undefined,
      departureDates: departureDates
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      estimatedTransitDays: estimatedTransitDays ? Number(estimatedTransitDays) : undefined,
      isActive,
    });
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Origine</span>
          <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ouagadougou" required />
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Destination</span>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Abidjan"
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Pays</span>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Burkina Faso" />
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Localisation</span>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hub, port, aéroport..."
          />
        </label>
      </div>

      <label className="stack">
        <span className="text-sm font-medium">Mode de transport</span>
        <Select
          value={transportType}
          onChange={(e) => handleTransportChange(e.target.value as TransportMode)}
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
        <Input value={lineCode} onChange={(e) => setLineCode(e.target.value)} placeholder="INT-OUA-ABI" />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Transit estimé (jours)</span>
          <Input
            type="number"
            min={0}
            value={estimatedTransitDays}
            onChange={(e) => setEstimatedTransitDays(e.target.value)}
            placeholder="7"
          />
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Statut</span>
          <Select value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Dates d’embarquement (liste)</span>
          <Input
            value={departureDates}
            onChange={(e) => setDepartureDates(e.target.value)}
            placeholder="2024-08-01, 2024-08-15"
          />
          <span className="muted text-xs">Listez les dates séparées par des virgules (optionnel).</span>
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Remarques</span>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions opérationnelles" />
        </label>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
