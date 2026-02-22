// src/components/QuoteRequest/StepContactInfo.js
import React from 'react';

const StepContactInfo = ({ formData, setFormData, onBack, onSubmit }) => {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="step-contact-info">
      <h2>Informations de contact</h2>

      <label>
        Nom complet :
        <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} />
      </label>

      <label>
        Email :
        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
      </label>

      <label>
        Numéro de téléphone :
        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} />
      </label>

      <label>
        Adresse de récupération :
        <input type="text" name="pickupAddress" value={formData.pickupAddress || ''} onChange={handleChange} />
      </label>

      <div className="buttons">
        <button onClick={onBack}>Retour</button>
        <button onClick={onSubmit}>Envoyer</button>
      </div>
    </div>
  );
};

export default StepContactInfo;
