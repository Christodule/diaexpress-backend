import React, { useState } from 'react';
import { useBackendAuth } from '../../auth/useBackendAuth';
import { createPayment } from '../../api/payment';

const paymentMethods = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'mobile', label: 'Mobile money' },
  { value: 'bank_transfer', label: 'Virement bancaire' }
];

const PaymentDialog = ({ isOpen, quote, onClose, onSuccess }) => {
  const { getToken } = useBackendAuth();
  const [method, setMethod] = useState(paymentMethods[0].value);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !quote) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Impossible de récupérer le jeton d'authentification");
      }
      const paymentPayload = {
        quoteId: quote._id,
        method,
        reference: reference || undefined,
        amount: quote.estimatedPrice || quote.price,
        currency: quote.currency || 'USD'
      };

      const response = await createPayment(token, paymentPayload);

      if (response?.error || response?.success === false) {
        throw new Error(response?.message || response?.error || 'Le paiement a été refusé.');
      }

      await onSuccess?.(response);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-dialog-overlay">
      <div className="payment-dialog">
        <div className="payment-dialog__header">
          <h3>Payer le devis</h3>
          <button className="payment-dialog__close" onClick={onClose} disabled={submitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-dialog__body">
          <p>
            <strong>Devis :</strong> {quote.transportType} – {quote.origin} → {quote.destination}
          </p>
          <p>
            <strong>Montant :</strong> {quote.estimatedPrice || quote.price || '-'}{' '}
            {quote.currency || 'USD'}
          </p>

          <label className="payment-dialog__label">
            Moyen de paiement
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="payment-dialog__select"
              disabled={submitting}
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="payment-dialog__label">
            Référence / Notes (optionnel)
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Derniers chiffres de la carte, référence de virement…"
              className="payment-dialog__input"
              disabled={submitting}
            />
          </label>

          {error && <p className="payment-dialog__error">{error}</p>}

          <div className="payment-dialog__actions">
            <button type="button" className="payment-dialog__secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="payment-dialog__primary" disabled={submitting}>
              {submitting ? 'Traitement…' : 'Confirmer et payer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentDialog;
