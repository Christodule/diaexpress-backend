import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';
import { fetchDashboardSnapshot } from '@/src/services/api/dashboard';

export default async function AdminDashboard() {
  const { quotes, shipments, paymentSummary, metrics, errors } = await fetchDashboardSnapshot();
  const stats = [
    { title: 'Devis actifs', value: String(quotes.total) },
    { title: 'Devis en attente', value: String(metrics.pendingQuotes) },
    { title: 'Expéditions en transit', value: String(metrics.shipmentsInTransit) },
    { title: 'Expéditions livrées', value: String(metrics.shipmentsDelivered) },
    {
      title: 'Paiements validés',
      value: formatCurrency(
        paymentSummary?.byStatus?.succeeded ?? metrics.totalPayments ?? 0,
        paymentSummary?.currency
      )
    }
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Centre de contrôle DiaExpress"
        description="Vue consolidée logistique + diaPay en temps réel."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'Dashboard' }]}
      />
      {errors.length ? (
        <div className="alert alert--error">
          <strong>Erreurs API :</strong>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="status-grid">
        {stats.map((stat) => (
          <div key={stat.title} className="stat-card">
            <p>{stat.title}</p>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
      <div className="layout-panels">
        <div className="panel">
          <div className="panel__header">
            <div className="panel__title">Derniers devis</div>
          </div>
          <table className="table-preview">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {quotes.items.map((quote) => (
                <tr key={quote._id}>
                  <td>{quote._id}</td>
                  <td>{quote.userEmail || quote.requestedBy || '—'}</td>
                  <td>{formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)}</td>
                  <td>{toTitle(quote.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="panel__header">
            <div className="panel__title">Dernières expéditions</div>
          </div>
          <table className="table-preview">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Route</th>
                <th>Statut</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {shipments.items.map((shipment) => (
                <tr key={shipment._id}>
                  <td>{shipment.trackingCode}</td>
                  <td>
                    {shipment.origin} → {shipment.destination}
                  </td>
                  <td>{toTitle(shipment.status)}</td>
                  <td>{formatDate(shipment.estimatedDelivery)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {paymentSummary ? (
        <div className="status-grid">
          {Object.entries(paymentSummary.byStatus || {}).map(([status, value]) => (
            <Card key={status} title={toTitle(status)} value={formatCurrency(value as number, paymentSummary.currency)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
