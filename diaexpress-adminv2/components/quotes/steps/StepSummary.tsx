'use client';

import { Button } from '@/components/ui/button';
import { QuoteStatusBadge } from '../QuoteStatusBadge';
import type { CreateQuotePayload, QuoteEstimate } from '@/lib/api/quotes';
import { formatCurrency } from '@/src/lib/format';

interface StepSummaryProps {
  formData: CreateQuotePayload;
  estimates: QuoteEstimate[];
  selectedEstimate?: QuoteEstimate | null;
  onSelectEstimate: (estimate: QuoteEstimate) => void;
  onBack: () => void;
  onCreate: () => void;
  creating?: boolean;
  createdQuoteId?: string;
}

export function StepSummary({
  formData,
  estimates,
  selectedEstimate,
  onSelectEstimate,
  onBack,
  onCreate,
  creating,
  createdQuoteId
}: StepSummaryProps) {
  return (
    <div className="wizard__card">
      <div className="wizard__card-header">
        <div>
          <div className="wizard__title">Résumé & estimation</div>
          <p className="muted">Choisissez une estimation et enregistrez le devis.</p>
        </div>
        <div className="step-indicator">Étape 4 / 4</div>
      </div>

      <div className="summary-grid">
        <div className="summary-panel">
          <h3>Infos trajet</h3>
          <p>
            {formData.origin} → {formData.destination}
          </p>
          <p className="muted">{formData.transportType?.toUpperCase()}</p>
          <div className="meta-line">
            <span>Dimensions</span>
            <strong>
              {formData.length || formData.width || formData.height
                ? `${formData.length ?? '—'} x ${formData.width ?? '—'} x ${formData.height ?? '—'} cm`
                : '—'}
            </strong>
          </div>
          <div className="meta-line">
            <span>Poids / Volume</span>
            <strong>
              {formData.weight ? `${formData.weight} kg` : '—'} · {formData.volume ? `${formData.volume} m³` : '—'}
            </strong>
          </div>
          <div className="meta-line">
            <span>Contact</span>
            <strong>{formData.recipientContactName || 'N/A'}</strong>
          </div>
          {formData.userEmail ? <p className="muted">{formData.userEmail}</p> : null}
        </div>

        <div className="summary-panel">
          <h3>Estimations</h3>
          {estimates.length === 0 ? <p className="muted">Aucune estimation reçue.</p> : null}
          <div className="estimate-list">
            {estimates.map((estimate, index) => {
              const isSelected = selectedEstimate?.provider === estimate.provider &&
                selectedEstimate?.estimatedPrice === estimate.estimatedPrice;
              return (
                <button
                  key={`${estimate.provider ?? 'internal'}-${estimate.estimatedPrice}-${index}`}
                  type="button"
                  className={`estimate-card ${isSelected ? 'estimate-card--active' : ''}`}
                  onClick={() => onSelectEstimate(estimate)}
                >
                  <div className="estimate-card__top">
                    <div>
                      <p className="muted">{estimate.provider || 'Interne'}</p>
                      <strong>{formatCurrency(estimate.estimatedPrice, estimate.currency)}</strong>
                    </div>
                    {isSelected ? <QuoteStatusBadge status="confirmed" /> : <QuoteStatusBadge status="pending" />}
                  </div>
                  {estimate.transportType ? <p className="muted">Transport {estimate.transportType}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wizard__footer">
        <Button variant="ghost" type="button" onClick={onBack}>
          Retour
        </Button>
        <div className="wizard__footer-actions">
          {createdQuoteId ? (
            <QuoteStatusBadge status="confirmed" />
          ) : null}
          <Button type="button" onClick={onCreate} disabled={!selectedEstimate || creating}>
            {creating ? 'Enregistrement...' : createdQuoteId ? 'Enregistrer un nouveau devis' : 'Enregistrer le devis'}
          </Button>
        </div>
      </div>
    </div>
  );
}
