import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { fetchPaymentById, fetchPaymentEvents } from '@/src/services/api/diapayAdmin';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  try {
    const [paymentResult, eventsResult] = await Promise.allSettled([
      fetchPaymentById(params.id),
      fetchPaymentEvents(params.id)
    ]);

    if (paymentResult.status === 'rejected') {
      throw paymentResult.reason;
    }

    const payment = paymentResult.value;
    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : { events: [] };
    const eventsError =
      eventsResult.status === 'rejected'
        ? eventsResult.reason instanceof Error
          ? eventsResult.reason.message
          : 'Erreur de chargement des évènements'
        : null;

    return (
      <div className="page-stack">
        <PageHeader title={`Paiement ${payment.id}`} description={`Méthode ${payment.method}`} />
        <div className="status-grid">
          <div className="stat-card">
            <p>Montant</p>
            <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
          </div>
          <div className="stat-card">
            <p>Statut</p>
            <strong>{toTitle(payment.status)}</strong>
          </div>
          <div className="stat-card">
            <p>Créé le</p>
            <strong>{formatDate(payment.createdAt)}</strong>
          </div>
        </div>
        {eventsError ? <div className="alert alert--error">{eventsError}</div> : null}
        <div>
          <h2>Evènements</h2>
          <ul>
            {events.events?.length ? (
              events.events.map((event) => (
                <li key={event.id}>
                  {formatDate(event.createdAt)} – {event.status}
                </li>
              ))
            ) : (
              <li>Aucun évènement</li>
            )}
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
