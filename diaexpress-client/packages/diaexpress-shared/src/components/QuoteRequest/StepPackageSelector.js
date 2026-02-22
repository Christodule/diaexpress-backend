// StepPackageSelector.js
import React from 'react';

const StepPackageSelector = ({ form, handleChange, filteredPackages }) => (
  <>
    {filteredPackages.length > 0 && (
      <select name="packageTypeId" value={form.packageTypeId} onChange={handleChange}>
        <option value="">📦 Type de colis (optionnel)</option>
        {filteredPackages.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>
    )}

    {!form.packageTypeId && form.transportTypes && (
      <>
        {form.transportTypes === 'air' && (
          <input type="number" name="weight" placeholder="Poids (kg)" value={form.weight} onChange={handleChange} required />
        )}
        {form.transportTypes === 'sea' && (
          <>
            <input type="number" name="volume" placeholder="Volume (m³) si connu" value={form.volume} onChange={handleChange} />
            <div className="dimensions-fields">
              <input type="number" name="length" placeholder="Longueur (cm)" value={form.length} onChange={handleChange} />
              <input type="number" name="width" placeholder="Largeur (cm)" value={form.width} onChange={handleChange} />
              <input type="number" name="height" placeholder="Hauteur (cm)" value={form.height} onChange={handleChange} />
            </div>
          </>
        )}
      </>
    )}
  </>
);
export default StepPackageSelector;