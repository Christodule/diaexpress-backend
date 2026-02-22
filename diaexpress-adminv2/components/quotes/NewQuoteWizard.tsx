'use client';

import { useMemo, useState } from 'react';
import { StepLocationSelector } from './steps/StepLocationSelector';
import { StepCargoDetails } from './steps/StepCargoDetails';
import { StepContactInfo } from './steps/StepContactInfo';
import { StepSummary } from './steps/StepSummary';
import type { CreateQuotePayload, QuoteEstimate, QuoteEstimateRequest } from '@/lib/api/quotes';
import { createQuote, estimateQuote } from '@/lib/api/quotes';
import { QuoteStatusBadge } from './QuoteStatusBadge';

const DEFAULT_FORM: CreateQuotePayload = {
  origin: '',
  destination: '',
  transportType: 'air',
  length: '',
  width: '',
  height: '',
  weight: '',
  volume: '',
  userEmail: '',
  recipientContactName: '',
  contactPhone: '',
  pickupAddress: '',
  estimatedPrice: 0,
};

type WizardStep = 1 | 2 | 3 | 4;

type NewQuoteWizardProps = {
  onQuoteCreated?: (quoteId?: string) => void;
  onOpenList?: () => void;
};

export function NewQuoteWizard({ onQuoteCreated, onOpenList }: NewQuoteWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<CreateQuotePayload>(DEFAULT_FORM);
  const [estimates, setEstimates] = useState<QuoteEstimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<QuoteEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | undefined>();

  const stepsLabels = useMemo(() => ['Itinéraire', 'Colis', 'Contact', 'Résumé'], []);

  const updateForm = (changes: Partial<CreateQuotePayload>) => {
    setFormData((prev) => ({ ...prev, ...changes }));
  };

  const nextStep = () => setStep((prev) => (prev < 4 ? ((prev + 1) as WizardStep) : prev));
  const prevStep = () => setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    setCreatedQuoteId(undefined);
    try {
      const { estimatedPrice, ...payload } = formData;
      const estimatePayload: QuoteEstimateRequest = { ...payload };
      const results = await estimateQuote(estimatePayload);
      if (!results.length) {
        setError("Aucune estimation disponible pour ces critères.");
        return;
      }
      const sorted = [...results].sort((a, b) => (a.estimatedPrice || 0) - (b.estimatedPrice || 0));
      setEstimates(sorted);
      setSelectedEstimate(sorted[0]);
      setStep(4);
    } catch (err) {
      setError((err as Error).message || "Impossible d'obtenir une estimation pour ce devis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedEstimate) return;
    setLoading(true);
    setError(null);
    try {
      const payload: CreateQuotePayload = {
        ...formData,
        estimatedPrice: selectedEstimate.estimatedPrice,
        currency: selectedEstimate.currency,
        provider: selectedEstimate.provider || 'internal',
      };

      const numericFields: (keyof QuoteEstimateRequest)[] = ['length', 'width', 'height', 'weight', 'volume'];
      for (const field of numericFields) {
        const value = payload[field];
        if (typeof value === 'string' && value.trim() === '') {
          (payload as Record<string, unknown>)[field] = undefined;
        } else if (typeof value === 'string') {
          (payload as Record<string, unknown>)[field] = Number(value);
        }
      }

      const quote = await createQuote(payload);
      setCreatedQuoteId(quote?._id);
      setError(null);
      onQuoteCreated?.(quote?._id);
      if (onOpenList) {
        onOpenList();
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création du devis.');
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setFormData(DEFAULT_FORM);
    setEstimates([]);
    setSelectedEstimate(null);
    setCreatedQuoteId(undefined);
    setError(null);
    setStep(1);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <div className="panel__title">Nouveau devis</div>
          <p className="panel__muted">Wizard inspiré du front client pour créer et estimer les devis.</p>
        </div>
        <div className="wizard__steps">
          {stepsLabels.map((label, index) => {
            const currentStep = (index + 1) as WizardStep;
            return (
              <div key={label} className={`wizard__step ${step === currentStep ? 'wizard__step--active' : ''}`}>
                <span>{currentStep}</span>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {createdQuoteId ? (
        <div className="alert alert--success">
          Devis enregistré avec succès.
          {onOpenList ? (
            <button className="link" type="button" onClick={onOpenList}>
              Ouvrir la liste des devis
            </button>
          ) : null}
          <QuoteStatusBadge status="confirmed" />
        </div>
      ) : null}

      {step === 1 ? (
        <StepLocationSelector formData={formData} onChange={updateForm} onNext={nextStep} />
      ) : null}

      {step === 2 ? <StepCargoDetails formData={formData} onChange={updateForm} onBack={prevStep} onNext={nextStep} /> : null}

      {step === 3 ? (
        <StepContactInfo formData={formData} onChange={updateForm} onBack={prevStep} onSubmit={handleEstimate} loading={loading} />
      ) : null}

      {step === 4 ? (
        <StepSummary
          formData={formData}
          estimates={estimates}
          selectedEstimate={selectedEstimate}
          onSelectEstimate={setSelectedEstimate}
          onBack={prevStep}
          onCreate={handleCreateQuote}
          creating={loading}
          createdQuoteId={createdQuoteId}
        />
      ) : null}

      <div className="wizard__footer wizard__footer--muted">
        <button className="link" type="button" onClick={restart}>
          Réinitialiser le wizard
        </button>
      </div>
    </div>
  );
}
