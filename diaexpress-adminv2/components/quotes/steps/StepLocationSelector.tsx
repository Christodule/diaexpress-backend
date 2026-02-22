'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { QuoteEstimateRequest } from '@/lib/api/quotes';

interface StepLocationSelectorProps {
  formData: QuoteEstimateRequest;
  onChange: (changes: Partial<QuoteEstimateRequest>) => void;
  onNext: () => void;
}

export function StepLocationSelector({ formData, onChange, onNext }: StepLocationSelectorProps) {
  const canProceed = formData.origin && formData.destination && formData.transportType;

  return (
    <div className="wizard__card">
      <div className="wizard__card-header">
        <div>
          <div className="wizard__title">Itinéraire</div>
            <p className="muted">Choisissez l’origine, la destination et le mode de transport.</p>
        </div>
        <div className="step-indicator">Étape 1 / 4</div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Origine</span>
          <Input
            placeholder="Ex: Cotonou"
            value={formData.origin}
            onChange={(event) => onChange({ origin: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Destination</span>
          <Input
            placeholder="Ex: Paris"
            value={formData.destination}
            onChange={(event) => onChange({ destination: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Transport</span>
          <Select
            value={formData.transportType}
            onChange={(event) => onChange({ transportType: event.target.value })}
          >
            <option value="air">Aérien</option>
            <option value="sea">Maritime</option>
            <option value="road">Route</option>
          </Select>
        </label>
      </div>

      <div className="wizard__footer">
        <Button type="button" onClick={onNext} disabled={!canProceed}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
