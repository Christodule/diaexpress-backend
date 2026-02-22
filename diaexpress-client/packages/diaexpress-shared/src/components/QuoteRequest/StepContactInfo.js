import React from 'react';

const StepContactInfo = ({
  formData,
  setFormData,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="step-contact-info">
      <h2>Informations de contact</h2>

      <label>
        Nom complet :
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Email :
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Numéro de téléphone :
        <input
          type="tel"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Adresse de récupération :
        <input
          type="text"
          name="pickupAddress"
          value={formData.pickupAddress || ''}
          onChange={handleChange}
        />
      </label>

      <div className="buttons">
        <button type="button" onClick={onBack} disabled={isSubmitting}>
          Retour
        </button>
        <button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
};

export default StepContactInfo;
