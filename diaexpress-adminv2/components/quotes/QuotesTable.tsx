'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';
import type { Quote } from '@/src/types/logistics';

type QuotesTableProps = {
  items: Quote[];
  loading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onConfirm: (quote: Quote) => void | Promise<void>;
  onReject: (quote: Quote) => void | Promise<void>;
  onEdit: (quote: Quote) => void | Promise<void>;
  onConvert: (quote: Quote) => void | Promise<void>;
  onRequestNewQuote?: () => void;
  message?: string | null;
  actionError?: string | null;
};

export function QuotesTable({
  items,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onConfirm,
  onReject,
  onEdit,
  onConvert,
  onRequestNewQuote,
  message,
  actionError,
}: QuotesTableProps) {
  const canConfirm = (quote: Quote) => quote.status === 'pending';
  const canConvert = (quote: Quote) =>
    quote.status === 'confirmed' && quote.paymentStatus === 'confirmed' && !quote.shipmentId;
  const canReject = (quote: Quote) => quote.status === 'pending' || quote.status === 'confirmed';
  const canEdit = (quote: Quote) => quote.status === 'pending' || quote.status === 'confirmed';

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <div className="panel__title">Tous les devis</div>
          <p className="panel__muted">Recherchez, filtrez et validez les demandes de devis client.</p>
        </div>
        <div className="panel__actions">
          {onRequestNewQuote ? <Button onClick={onRequestNewQuote}>Nouveau devis</Button> : null}
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
              <th>Client</th>
              <th>Itinéraire</th>
              <th>Transport</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <td key={`skeleton-cell-${cellIndex}`}>
                      <div className="skeleton" style={{ width: `${60 + cellIndex * 3}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">Aucun devis trouvé.</div>
                </td>
              </tr>
            ) : (
              items.map((quote) => (
                <tr key={quote._id}>
                  <td className="mono">{quote._id}</td>
                  <td>
                    <div className="cell-stack">
                      <strong>{quote.recipientContactName || quote.userEmail || quote.requestedByLabel || quote.requestedBy || '—'}</strong>
                      <span className="muted">{quote.recipientContactEmail || quote.userEmail || 'Email non renseigné'}</span>
                      <span className="muted">{quote.contactPhone || quote.recipientContactPhone || 'Téléphone non renseigné'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-stack">
                      <span>
                        {quote.origin} → {quote.destination}
                      </span>
                      {quote.trackingNumber ? <span className="muted">Tracking {quote.trackingNumber}</span> : null}
                    </div>
                  </td>
                  <td>{toTitle(quote.transportType)}</td>
                  <td>{formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)}</td>
                  <td>
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="button button--ghost" href={`/admin/quotes/${quote._id}`}>
                        Voir
                      </Link>
                      {canEdit(quote) ? (
                        <Button type="button" variant="ghost" onClick={() => onEdit(quote)}>
                          Ajuster prix
                        </Button>
                      ) : null}
                      {canConfirm(quote) ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onConfirm(quote)}
                        >
                          Valider
                        </Button>
                      ) : null}
                      {canReject(quote) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onReject(quote)}
                        >
                          Rejeter
                        </Button>
                      ) : null}
                      {canConvert(quote) ? (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => onConvert(quote)}
                        >
                          Créer Shipment
                        </Button>
                      ) : null}
                      {quote.shipmentId ? (
                        <Link className="button button--secondary" href={`/admin/shipments/${quote.shipmentId}`}>
                          Voir Shipment
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="pagination">
        <span>
          Page {page} / {totalPages} – {total} éléments
        </span>
        <div className="pagination__actions">
          <Button type="button" variant="ghost" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
            Précédent
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
