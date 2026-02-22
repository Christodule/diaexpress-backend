import { paginateCollection } from '@/src/lib/pagination';
import type { Quote, Shipment } from '@/src/types/logistics';
import { fetchPaymentSummary } from './diapayAdmin';
import { fetchQuotes } from './logisticsQuotes';
import { fetchShipments } from './logisticsShipments';

const FALLBACK_PARAMS = { page: 1, pageSize: 10 } as const;

function buildFallbackSnapshot() {
  const quotes = paginateCollection<Quote>([], FALLBACK_PARAMS);
  const shipments = paginateCollection<Shipment>([], FALLBACK_PARAMS);

  return {
    quotes,
    shipments,
    paymentSummary: null as Awaited<ReturnType<typeof fetchPaymentSummary>> | null,
    errors: [] as string[],
    metrics: {
      pendingQuotes: 0,
      shipmentsInTransit: 0,
      shipmentsDelivered: 0,
      totalPayments: 0
    }
  };
}

export async function fetchDashboardSnapshot() {
  const fallback = buildFallbackSnapshot();

  const [quotesResult, shipmentsResult, paymentSummaryResult] = await Promise.allSettled([
    fetchQuotes({ pageSize: 10 }),
    fetchShipments({ pageSize: 10 }),
    fetchPaymentSummary()
  ]);

  const errors: string[] = [];

  const quotes =
    quotesResult.status === 'fulfilled'
      ? quotesResult.value
      : (errors.push(
          `Quotes: ${
            quotesResult.reason instanceof Error ? quotesResult.reason.message : 'Erreur de chargement'
          }`
        ),
        fallback.quotes);

  const shipments =
    shipmentsResult.status === 'fulfilled'
      ? shipmentsResult.value
      : (errors.push(
          `Shipments: ${
            shipmentsResult.reason instanceof Error ? shipmentsResult.reason.message : 'Erreur de chargement'
          }`
        ),
        fallback.shipments);

  const paymentSummary =
    paymentSummaryResult.status === 'fulfilled'
      ? paymentSummaryResult.value
      : (errors.push(
          `Payments: ${
            paymentSummaryResult.reason instanceof Error
              ? paymentSummaryResult.reason.message
              : 'Erreur de chargement'
          }`
        ),
        null);

  const shipmentsInTransit = shipments.items.filter((shipment) => shipment.status === 'in_transit').length;
  const shipmentsDelivered = shipments.items.filter((shipment) => shipment.status === 'delivered').length;
  const pendingQuotes = quotes.items.filter((quote) => quote.status === 'pending').length;

  return {
    quotes,
    shipments,
    paymentSummary,
    errors,
    metrics: {
      pendingQuotes,
      shipmentsInTransit,
      shipmentsDelivered,
      totalPayments: paymentSummary?.totalVolume ?? 0
    }
  };
}
