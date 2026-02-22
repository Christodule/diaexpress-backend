import React, { useEffect, useState } from "react";
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from "../api/api";
import PaymentDialog from "../components/payments/PaymentDialog";

const Quotes = () => {
  const { getToken } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des devis");
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handlePayment = (quote) => {
    setSelectedQuote(quote);
    setPaymentDialogOpen(true);
    setPaymentError(null);
    setPaymentReceipt(null);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    if (!selectedQuote) return;

    setPaymentDialogOpen(false);
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/${selectedQuote._id}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const confirmation = await res.json();

      if (!res.ok) {
        throw new Error(
          confirmation?.message || "Erreur lors de la validation du devis"
        );
      }

      setPaymentReceipt({
        payment: paymentResult,
        confirmation,
      });
      await loadQuotes();
    } catch (err) {
      setPaymentError(err.message || "Le paiement n'a pas pu être validé.");
    } finally {
      setPaymentLoading(false);
      setSelectedQuote(null);
    }
  };

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedQuote(null);
  };

  const formatStatus = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="status-badge status-confirmed">✅ Confirmé</span>;
      case "paid":
        return <span className="status-badge status-paid">💳 Payé</span>;
      case "rejected":
        return <span className="status-badge status-rejected">❌ Rejeté</span>;
      case "dispatched":
        return <span className="status-badge status-dispatched">📦 Expédié</span>;
      default:
        return <span className="status-badge status-pending">⏳ En attente</span>;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>📑 Mes devis</h2>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-500">Erreur: {error}</p>}
      {!loading && quotes.length === 0 && !error && <p>Aucun devis trouvé.</p>}

      {!loading && quotes.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Transport</th>
              <th>Origine</th>
              <th>Destination</th>
              <th>Prix estimé</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q._id}>
                <td>{q._id.slice(-6)}</td>
                <td>{q.transportType}</td>
                <td>{q.origin}</td>
                <td>{q.destination}</td>
                <td>{q.estimatedPrice || "-"} {q.currency || "USD"}</td>
                <td>{formatStatus(q.status)}</td>
                <td>
                  {q.status === "confirmed" && (
                    <button
                      className="action-btn action-pay"
                      onClick={() => handlePayment(q)}
                    >
                      💳 Payer maintenant
                    </button>
                  )}
                  {q.status === "paid" && (
                    <span className="status-badge status-paid">✅ Déjà payé</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {paymentLoading && (
        <div className="payment-status payment-status--loading">
          <span className="spinner" aria-hidden="true" /> Traitement du paiement en
          cours…
        </div>
      )}

      {paymentError && (
        <div className="payment-status payment-status--error">
          ❌ {paymentError}
        </div>
      )}

      {paymentReceipt && (
        <div className="payment-status payment-status--success">
          ✅ Paiement confirmé !
          {paymentReceipt?.payment && (
            <p>
              Référence transaction :
              {" "}
              {paymentReceipt.payment.transactionReference ||
                paymentReceipt.payment.reference ||
                paymentReceipt.payment.receipt ||
                paymentReceipt.payment.id ||
                "-"}
            </p>
          )}
          {paymentReceipt?.confirmation?.receipt && (
            <p>Reçu : {paymentReceipt.confirmation.receipt}</p>
          )}
          {paymentReceipt?.confirmation?.message && (
            <p>{paymentReceipt.confirmation.message}</p>
          )}
        </div>
      )}

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        quote={selectedQuote}
        onClose={closePaymentDialog}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Quotes;
