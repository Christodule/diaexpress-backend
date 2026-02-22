import React from 'react';

const StepSummary = ({ formData, quote, onRestart, onBack }) => {
  const estimatedPrice = quote?.estimatedPrice ?? quote?.price ?? formData.estimatedPrice;
  const currency = quote?.currency || quote?.currencyCode || '€';

  return (
    <div className="step-summary">
      <h2>Résumé de votre demande</h2>

      <section>
        <h3>Lieu</h3>
        <p><strong>Origine :</strong> {formData.origin || '—'}</p>
        <p><strong>Destination :</strong> {formData.destination || '—'}</p>
      </section>

      <section>
        <h3>Colis</h3>
        <p><strong>Transport :</strong> {formData.transportType || '—'}</p>
        <p><strong>Poids :</strong> {formData.weight || '—'} kg</p>
        <p><strong>Volume :</strong> {formData.volume || '—'} m³</p>
        {(formData.length || formData.width || formData.height) && (
          <p>
            <strong>Dimensions :</strong> {formData.length || '—'} x {formData.width || '—'} x {formData.height || '—'} cm
          </p>
        )}
      </section>

      <section>
        <h3>Contact</h3>
        <p><strong>Nom :</strong> {formData.name || '—'}</p>
        <p><strong>Email :</strong> {formData.email || '—'}</p>
        {formData.phone && <p><strong>Téléphone :</strong> {formData.phone}</p>}
      </section>

      <section>
        <h3>Estimation</h3>
        {estimatedPrice ? (
          <p>
            <strong>Prix estimé :</strong> {estimatedPrice} {currency}
          </p>
        ) : (
          <p>Aucune estimation disponible.</p>
        )}
        {quote?.message && <p>{quote.message}</p>}
      </section>

      <div className="buttons">
        <button type="button" onClick={onBack}>
          Modifier
        </button>
        <button type="button" onClick={onRestart}>
          Nouvelle demande
        </button>
      </div>
    </div>
  );
};

export default StepSummary;
