'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { useQuotes } from '@/hooks/useQuotes';
import { confirmQuote, updateQuote } from '@/lib/api/quotes';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';
import type { Quote } from '@/src/types/logistics';

export function PendingQuotesTable() {
  const { items, loading, error, refresh } = useQuotes({ status: 'pending', pageSize: 50 });
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async (quote: Quote) => {
    try {
      setSubmitting(quote._id);
      setActionError(null);
      setMessage(null);
      await confirmQuote(quote._id);
      setMessage(`Devis ${quote._id} validé`);
      refresh();
    } catch (err) {
      setActionError((err as Error).message || 'Impossible de valider ce devis');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (quote: Quote) => {
    try {
      setSubmitting(quote._id);
      setActionError(null);
      setMessage(null);
      await updateQuote(quote._id, { status: 'rejected' as Quote['status'] });
      setMessage(`Devis ${quote._id} rejeté`);
      refresh();
    } catch (err) {
      setActionError((err as Error).message || 'Impossible de rejeter ce devis');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <div className="panel__title">Devis à valider</div>
          <p className="panel__muted">
            Suivi en direct des demandes en attente. Approuvez, modifiez ou rejetez.
          </p>
        </div>
        <div className="panel__actions">
          <Button variant="ghost" onClick={() => refresh()} disabled={loading}>
            Rafraîchir
          </Button>
        </div>
      </div>

      {message ? <div className="alert alert--success">{message}</div> : null}
      {actionError ? <div className="alert alert--error">{actionError}</div> : null}
      {error ? <div className="alert alert--error">{error.message}</div> : null}

      <div className="table-wrapper">
        <Table>
          <TableHeader>
            <tr>
              <th>Référence</th>
              <th>Origine → Destination</th>
              <th>Transport</th>
              <th>Poids / Volume</th>
              <th>Prix estimé</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={7}>Chargement...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7}>Aucun devis en attente.</td>
              </tr>
            ) : (
              items.map((quote) => (
                <tr key={quote._id}>
                  <td className="mono">{quote._id}</td>
                  <td>
                    <div className="cell-stack">
                      <strong>
                        {quote.origin} → {quote.destination}
                      </strong>
                      <span className="muted text-xs">{formatDate(quote.createdAt)}</span>
                    </div>
                  </td>
                  <td>{toTitle(quote.transportType)}</td>
                  <td>
                    {quote.weight ?? '—'} kg / {quote.volume ?? '—'} m³
                  </td>
                  <td>{formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)}</td>
                  <td>
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleApprove(quote)}
                        disabled={submitting === quote._id}
                      >
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(quote)}
                        disabled={submitting === quote._id}
                      >
                        Rejeter
                      </Button>
                      <Link className="button button--ghost" href={`/admin/quotes/${quote._id}`}>
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
