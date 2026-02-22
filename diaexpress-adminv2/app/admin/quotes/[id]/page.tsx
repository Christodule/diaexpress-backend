'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { confirmQuote, convertQuoteToShipment, fetchQuoteById, rejectQuote } from '@/lib/api/quotes';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';
import type { Quote } from '@/src/types/logistics';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'confirm' | 'reject' | 'convert' | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      if (!id) throw new Error('Identifiant de devis manquant');
      const data = await fetchQuoteById(id as string);
      setQuote(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Impossible de charger le devis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async () => {
    if (!quote) return;
    try {
      setBusyAction('confirm');
      setActionError(null);
      const finalPriceInput = window.prompt(
        'Montant final (laisser vide pour conserver l\'estimation existante)',
        String(quote.finalPrice ?? quote.estimatedPrice ?? '')
      );
      const finalPrice = finalPriceInput ? Number(finalPriceInput) : undefined;
      const updated = await confirmQuote(quote._id, { finalPrice });
      setQuote(updated);
      setActionMessage('Devis confirmé.');
    } catch (err) {
      setActionError((err as Error).message || 'Impossible de confirmer le devis.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    try {
      setBusyAction('reject');
      setActionError(null);
      const reason = window.prompt('Motif du rejet (optionnel)');
      const updated = await rejectQuote(quote._id, reason || undefined);
      setQuote(updated);
      setActionMessage('Devis rejeté.');
    } catch (err) {
      setActionError((err as Error).message || 'Impossible de rejeter le devis.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleConvert = async () => {
    if (!quote) return;
    try {
      setBusyAction('convert');
      setActionError(null);
      const result = await convertQuoteToShipment(quote._id);
      setActionMessage('Shipment créé depuis ce devis.');
      if (result?.shipment?._id) {
        router.push(`/admin/shipments/${result.shipment._id}`);
      }
    } catch (err) {
      setActionError((err as Error).message || 'Conversion en shipment impossible.');
    } finally {
      setBusyAction(null);
    }
  };

  if (!id) return null;

  return (
    <div className="page-stack">
      <PageHeader
        title={`Devis ${id}`}
        description="Détail et actions admin pour ce devis."
        actions={
          <Button variant="ghost" onClick={() => router.back()}>
            Retour
          </Button>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}
      {actionError ? <div className="alert alert--error">{actionError}</div> : null}
      {actionMessage ? <div className="alert alert--success">{actionMessage}</div> : null}

      {loading ? (
        <div className="panel">Chargement...</div>
      ) : quote ? (
        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="panel__title">Statut</div>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="panel__actions">
              {quote.status === 'pending' ? (
                <Button variant="secondary" onClick={handleConfirm} disabled={busyAction === 'confirm'}>
                  {busyAction === 'confirm' ? 'Validation...' : 'Valider'}
                </Button>
              ) : null}
              {quote.status !== 'rejected' ? (
                <Button variant="ghost" onClick={handleReject} disabled={busyAction === 'reject'}>
                  {busyAction === 'reject' ? 'Rejet...' : 'Rejeter'}
                </Button>
              ) : null}
              {quote.status === 'confirmed' ? (
                <Button variant="primary" onClick={handleConvert} disabled={busyAction === 'convert'}>
                  {busyAction === 'convert' ? 'Conversion...' : 'Créer Shipment'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid--two">
            <div>
              <p className="muted">Itinéraire</p>
              <p>{quote.origin} → {quote.destination}</p>
              <p className="muted">Transport: {toTitle(quote.transportType)}</p>
            </div>
            <div>
              <p className="muted">Montant</p>
              <p>{formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)}</p>
              <p className="muted">Créé le {formatDate(quote.createdAt)}</p>
            </div>
          </div>

          <div className="panel__footer">
            <div className="muted">Dernière mise à jour : {formatDate(quote.updatedAt)}</div>
            {quote.trackingNumber ? <div className="muted">Tracking : {quote.trackingNumber}</div> : null}
          </div>
        </div>
      ) : (
        <div className="panel">Aucun devis trouvé.</div>
      )}
    </div>
  );
}
