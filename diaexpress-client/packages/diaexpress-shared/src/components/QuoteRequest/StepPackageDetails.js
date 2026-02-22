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
        <select
          name="transportType"
          value={formData.transportType || ''}
          onChange={handleChange}
        >
          <option value="air">Avion</option>
          <option value="sea">Bateau</option>
        </select>
      </label>

      <label>
        Poids (kg) :
        <input
          type="number"
          name="weight"
          min="0"
          step="0.1"
          value={formData.weight || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Volume (m³) :
        <input
          type="number"
          name="volume"
          min="0"
          step="0.01"
          value={formData.volume || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Longueur (cm) :
        <input
          type="number"
          name="length"
          min="0"
          value={formData.length || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Largeur (cm) :
        <input
          type="number"
          name="width"
          min="0"
          value={formData.width || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Hauteur (cm) :
        <input
          type="number"
          name="height"
          min="0"
          value={formData.height || ''}
          onChange={handleChange}
        />
      </label>

      <div className="buttons">
        <button type="button" onClick={onBack}>
          Retour
        </button>
        <button type="button" onClick={onNext}>
          Suivant
        </button>
      </div>
    </div>
  );
};

export default StepPackageDetails;
