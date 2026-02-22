// src/components/QuoteRequest/StepPackageDetails.js
import React from 'react';

const StepPackageDetails = ({ formData, setFormData, onNext, onBack }) => {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="step-package-details">
      <h2>Détails du colis</h2>

      <label>
        Type de transport :
        <select name="transport" value={formData.transport || ''} onChange={handleChange}>
          <option value="">-- Sélectionner --</option>
          <option value="air">Avion</option>
          <option value="sea">Bateau</option>
        </select>
      </label>

      <label>
        Poids (kg) :
        <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} />
      </label>

      <label>
        Volume (m³) :
        <input type="number" name="volume" value={formData.volume || ''} onChange={handleChange} />
      </label>

      <label>
        Longueur (cm) :
        <input type="number" name="length" value={formData.length || ''} onChange={handleChange} />
      </label>

      <label>
        Largeur (cm) :
        <input type="number" name="width" value={formData.width || ''} onChange={handleChange} />
      </label>

      <label>
        Hauteur (cm) :
        <input type="number" name="height" value={formData.height || ''} onChange={handleChange} />
      </label>

      <div className="buttons">
        <button onClick={onBack}>Retour</button>
        <button onClick={onNext}>Suivant</button>
      </div>
    </div>
  );
};

export default StepPackageDetails;
