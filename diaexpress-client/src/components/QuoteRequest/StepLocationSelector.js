// StepLocationSelector.js
import React from 'react';
export default function StepLocationSelector({ formData, setFormData }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Origine"
        value={formData.origin}
        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
      />
      <input
        type="text"
        placeholder="Destination"
        value={formData.destination}
        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
      />
    </div>
  );
}
