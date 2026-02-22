// src/components/QuoteRequest/StepSummary.js
import React from 'react';

const StepSummary = ({ formData, onConfirm }) => {
  return (
    <div className="step-summary">
      <h2>Résumé de votre demande</h2>

      <div>
        <h3>Lieu</h3>
        <p><strong>Origine :</strong> {formData.origin}</p>
        <p><strong>Destination :</strong> {formData.destination}</p>
      </div>

      <div>
        <h3>Colis</h3>
        <p><strong>Transport :</strong> {formData.transport}</p>
        <p><strong>Poids :</strong> {formData.weight} kg</p>
        <p><strong>Volume :</strong> {formData.volume} m³</p>
        {formData.length && formData.width && (
          <p><strong>Dimensions :</strong> {formData.length} x {formData.width} x {formData.height || 'N/A'} cm</p>
        )}
      </div>

      <div>
        <h3>Estimation</h3>
        <p><strong>Prix estimé :</strong> {formData.estimatedPrice} €</p>
      </div>

      <button onClick={onConfirm}>Confirmer et envoyer</button>
    </div>
  );
};

export default StepSummary;
