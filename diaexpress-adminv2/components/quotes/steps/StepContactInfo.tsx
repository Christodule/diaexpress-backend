'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateQuotePayload } from '@/lib/api/quotes';

interface StepContactInfoProps {
  formData: CreateQuotePayload;
  onChange: (changes: Partial<CreateQuotePayload>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function StepContactInfo({ formData, onChange, onBack, onSubmit, loading }: StepContactInfoProps) {
  const canSubmit = formData.userEmail && formData.recipientContactName;

  return (
    <div className="wizard__card">
      <div className="wizard__card-header">
        <div>
          <div className="wizard__title">Contact</div>
          <p className="muted">Qui est le client ? Ajoutez un contact et un email pour partager le devis.</p>
        </div>
        <div className="step-indicator">Étape 3 / 4</div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nom du client</span>
          <Input
            placeholder="Nom complet"
            value={formData.recipientContactName ?? ''}
            onChange={(event) => onChange({ recipientContactName: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Email</span>
          <Input
            type="email"
            placeholder="client@email.com"
            value={formData.userEmail ?? ''}
            onChange={(event) => onChange({ userEmail: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Téléphone</span>
          <Input
            type="tel"
            placeholder="+229..."
            value={formData.contactPhone ?? ''}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
          />
        </label>
        <label className="field field--full">
          <span>Adresse de collecte</span>
          <Input
            placeholder="Adresse de ramassage ou notes"
            value={(formData as { pickupAddress?: string }).pickupAddress ?? ''}
            onChange={(event) => onChange({ pickupAddress: event.target.value })}
          />
        </label>
      </div>

      <div className="wizard__footer">
        <Button variant="ghost" type="button" onClick={onBack}>
          Retour
        </Button>
        <Button type="button" onClick={onSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Calcul en cours...' : 'Obtenir une estimation'}
        </Button>
      </div>
    </div>
  );
}
