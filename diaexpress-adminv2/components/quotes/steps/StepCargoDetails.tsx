'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QuoteEstimateRequest } from '@/lib/api/quotes';

interface StepCargoDetailsProps {
  formData: QuoteEstimateRequest;
  onChange: (changes: Partial<QuoteEstimateRequest>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepCargoDetails({ formData, onChange, onBack, onNext }: StepCargoDetailsProps) {
  return (
    <div className="wizard__card">
      <div className="wizard__card-header">
        <div>
          <div className="wizard__title">Colis</div>
          <p className="muted">Ajoutez les dimensions et le poids pour obtenir un tarif précis.</p>
        </div>
        <div className="step-indicator">Étape 2 / 4</div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Longueur (cm)</span>
          <Input
            type="number"
            min={0}
            value={formData.length ?? ''}
            onChange={(event) => onChange({ length: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Largeur (cm)</span>
          <Input type="number" min={0} value={formData.width ?? ''} onChange={(event) => onChange({ width: event.target.value })} />
        </label>
        <label className="field">
          <span>Hauteur (cm)</span>
          <Input
            type="number"
            min={0}
            value={formData.height ?? ''}
            onChange={(event) => onChange({ height: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Poids (kg)</span>
          <Input
            type="number"
            min={0}
            value={formData.weight ?? ''}
            onChange={(event) => onChange({ weight: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Volume (m³)</span>
          <Input
            type="number"
            min={0}
            value={formData.volume ?? ''}
            onChange={(event) => onChange({ volume: event.target.value })}
          />
        </label>
      </div>

      <div className="wizard__footer">
        <Button variant="ghost" type="button" onClick={onBack}>
          Retour
        </Button>
        <Button type="button" onClick={onNext}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
