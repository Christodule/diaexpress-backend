'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { formatCurrency } from '@/src/lib/format';
import type { Quote } from '@/src/types/logistics';

export type QuoteAction = 'confirm' | 'reject' | 'edit' | 'convert';

export type QuoteActionPayload = {
  finalPrice?: number;
  notes?: string;
  reason?: string;
};

type QuoteActionDrawerProps = {
  open: boolean;
  action: QuoteAction | null;
  quote: Quote | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: QuoteActionPayload) => void;
};

export function QuoteActionDrawer({
  open,
  action,
  quote,
  submitting,
  onClose,
  onSubmit,
}: QuoteActionDrawerProps) {
  const [finalPrice, setFinalPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open || !quote) return;
    setFinalPrice(String(quote.finalPrice ?? quote.estimatedPrice ?? ''));
    setNotes(quote.notes || '');
    setReason('');
  }, [open, quote]);

  if (!open || !quote || !action) return null;

  const title =
    action === 'confirm'
      ? 'Valider le devis'
      : action === 'reject'
      ? 'Rejeter le devis'
      : action === 'edit'
      ? 'Ajuster le prix'
      : 'Convertir en shipment';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      finalPrice: finalPrice ? Number(finalPrice) : undefined,
      notes: notes || undefined,
      reason: reason || undefined,
    });
  };

  return (
    <div className="drawer">
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">{title}</div>
            <p className="panel__muted">
              {quote.origin} → {quote.destination} · {formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)}
            </p>
          </div>
          <div className="panel__actions">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="drawer__content">
          <div className="stack gap-4">
            <div className="summary-grid">
              <div>
                <strong>Client</strong>
                <p>{quote.userEmail || quote.requestedByLabel || quote.requestedBy || '—'}</p>
              </div>
              <div>
                <strong>Statut</strong>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </div>

            <form className="stack gap-4" onSubmit={handleSubmit}>
              {action === 'confirm' || action === 'edit' ? (
                <label className="stack">
                  <span className="text-sm font-medium">Montant final</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={finalPrice}
                    onChange={(event) => setFinalPrice(event.target.value)}
                  />
                  <span className="muted text-sm">
                    {quote.estimatedPrice
                      ? `Estimation actuelle: ${formatCurrency(quote.estimatedPrice, quote.currency)}`
                      : 'Aucune estimation enregistrée.'}
                  </span>
                </label>
              ) : null}

              {action === 'edit' ? (
                <label className="stack">
                  <span className="text-sm font-medium">Notes internes</span>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Ajoutez une note sur le devis"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </label>
              ) : null}

              {action === 'reject' ? (
                <label className="stack">
                  <span className="text-sm font-medium">Motif du rejet</span>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Expliquez la raison du rejet (optionnel)"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              ) : null}

              {action === 'convert' ? (
                <div className="alert alert--info">
                  La conversion créera un shipment et verrouillera le devis. Vérifiez que le devis est payé/confirmé.
                </div>
              ) : null}

              <div className="panel__actions">
                <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'En cours...' : 'Confirmer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
