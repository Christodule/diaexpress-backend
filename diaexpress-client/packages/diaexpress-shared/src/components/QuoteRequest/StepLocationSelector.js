import React from 'react';

const StepLocationSelector = ({ formData, setFormData, onNext }) => {
  const origin = formData.origin ?? '';
  const destination = formData.destination ?? '';
  const canProceed = origin.trim() && destination.trim();

  return (
    <div className="step-location-selector">
      <h2>Itinéraire</h2>
      <label>
        Origine
        <input
          type="text"
          placeholder="Ex: Paris"
          value={origin}
          onChange={(e) =>
            setFormData({ ...formData, origin: e.target.value })
          }
        />
      </label>
      <label>
        Destination
        <input
          type="text"
          placeholder="Ex: Abidjan"
          value={destination}
          onChange={(e) =>
            setFormData({ ...formData, destination: e.target.value })
          }
        />
      </label>

      <div className="buttons">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default StepLocationSelector;
