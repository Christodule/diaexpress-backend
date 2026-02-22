'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Expedition, TransportLine } from '@/src/types/logistics';

const EXPEDITION_STATUS: Expedition['status'][] = ['pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'];

type ExpeditionFormProps = {
  transportLines: TransportLine[];
  initialData?: Partial<Expedition>;
  onSubmit: (payload: Partial<Expedition>) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

export function ExpeditionForm({ transportLines, initialData, onSubmit, onCancel, submitting }: ExpeditionFormProps) {
  const [transportLineId, setTransportLineId] = useState(
    typeof initialData?.transportLineId === 'string' ? initialData?.transportLineId : initialData?.transportLineId?._id || ''
  );
  const [plannedDepartureDate, setPlannedDepartureDate] = useState(
    initialData?.plannedDepartureDate ? initialData.plannedDepartureDate.slice(0, 10) : ''
  );
  const [plannedArrivalDate, setPlannedArrivalDate] = useState(
    initialData?.plannedArrivalDate ? initialData.plannedArrivalDate.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<Expedition['status']>(initialData?.status || 'pending');
  const [voyageCode, setVoyageCode] = useState(initialData?.voyageCode || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const lineOptions = useMemo(() => transportLines || [], [transportLines]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!transportLineId) {
      setError('Veuillez sélectionner une ligne de transport.');
      return;
    }

    await onSubmit({
      transportLineId,
      plannedDepartureDate: plannedDepartureDate ? new Date(plannedDepartureDate).toISOString() : undefined,
      plannedArrivalDate: plannedArrivalDate ? new Date(plannedArrivalDate).toISOString() : undefined,
      status,
      voyageCode: voyageCode || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack">
        <span className="text-sm font-medium">Ligne de transport</span>
        <Select value={transportLineId} onChange={(e) => setTransportLineId(e.target.value)} required>
          <option value="">Sélectionner une ligne</option>
          {lineOptions.map((line) => (
            <option key={line._id} value={line._id}>
              {line.origin} → {line.destination} ({line.transportType || line.transportTypes.join(', ')})
            </option>
          ))}
        </Select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Départ planifié</span>
          <Input
            type="date"
            value={plannedDepartureDate}
            onChange={(e) => setPlannedDepartureDate(e.target.value)}
          />
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Arrivée estimée</span>
          <Input type="date" value={plannedArrivalDate} onChange={(e) => setPlannedArrivalDate(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="stack">
          <span className="text-sm font-medium">Statut</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value as Expedition['status'])}>
            {EXPEDITION_STATUS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
        <label className="stack">
          <span className="text-sm font-medium">Code de voyage</span>
          <Input value={voyageCode} onChange={(e) => setVoyageCode(e.target.value)} placeholder="EXP-2024-01" />
        </label>
      </div>

      <label className="stack">
        <span className="text-sm font-medium">Notes</span>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails opérationnels" />
      </label>

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
