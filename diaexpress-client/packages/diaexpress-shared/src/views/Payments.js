import React, { useEffect, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { myPayments } from '../api/payment';

const Payments = () => {
  const { getToken } = useBackendAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        const data = await myPayments(token);
        if (data?.error || data?.success === false) {
          throw new Error(data?.message || data?.error || 'Impossible de récupérer les paiements.');
        }
        setPayments(data.payments || data || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des paiements.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [getToken]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>💳 Historique des paiements</h2>
      </div>

      {loading && <p>Chargement de vos paiements…</p>}
      {error && <p className="payment-status payment-status--error">❌ {error}</p>}

      {!loading && !error && payments.length === 0 && (
        <p>Aucun paiement enregistré pour le moment.</p>
      )}

      {!loading && !error && payments.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Devis</th>
              <th>Méthode</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id || payment.id}>
                <td>{payment.transactionReference || payment.reference || payment.receipt || '-'}</td>
                <td>{payment.quote?.transportType || payment.quoteId?.transportType || payment.quoteId || '-'}</td>
                <td>{payment.method || payment.paymentMethod || '-'}</td>
                <td>
                  {payment.amount || payment.total || '-'} {payment.currency || payment.currencyCode || ''}
                </td>
                <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                <td>{payment.status || payment.state || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Payments;
