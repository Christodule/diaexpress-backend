import React, { useEffect, useMemo, useState } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '../api/addresses';
import { normaliseCountry, validateCountry, validatePhone } from '../utils/addressValidation';
import '../styles/ProfileAddresses.css';

const createBlankGpsLocation = () => ({
  latitude: '',
  longitude: '',
  accuracy: '',
  provider: '',
  capturedAt: '',
});

const createEmptyAddress = () => ({
  type: 'sender',
  label: '',
  contactName: '',
  company: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: '',
  notes: '',
  gpsLocation: createBlankGpsLocation(),
});

const formatDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const typeLabels = {
  sender: 'Expéditeur',
  recipient: 'Destinataire',
  billing: 'Facturation',
};

const ProfileAddresses = () => {
  const { getToken } = useBackendAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(createEmptyAddress);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const groupedAddresses = useMemo(() => {
    return addresses.reduce(
      (acc, addr) => {
        const key = addr.type || 'sender';
        acc[key] = acc[key] ? [...acc[key], addr] : [addr];
        return acc;
      },
      { sender: [], recipient: [], billing: [] }
    );
  }, [addresses]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const list = await fetchAddresses(token);
      setAddresses(list);
      setError('');
    } catch (err) {
      setError(err.message || "Impossible de charger les adresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(createEmptyAddress());
    setFormErrors({});
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleGpsChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      gpsLocation: {
        ...(prev.gpsLocation || createBlankGpsLocation()),
        [name]: value,
      },
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.label.trim()) nextErrors.label = 'Indique un libellé pour retrouver cette adresse.';
    if (!form.line1.trim()) nextErrors.line1 = 'La ligne d\'adresse est requise.';
    if (!form.city.trim()) nextErrors.city = 'La ville est requise.';
    if (!form.postalCode.trim()) nextErrors.postalCode = 'Le code postal est requis.';

    if (form.phone && !validatePhone(form.phone)) {
      nextErrors.phone = 'Format de téléphone invalide (ex: +33612345678).';
    }

    if (form.country) {
      if (!validateCountry(form.country)) {
        nextErrors.country = 'Le pays doit contenir uniquement des lettres (ex: FR).';
      }
    } else {
      nextErrors.country = 'Le pays est requis (code ou nom).';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { gpsLocation: formGps, ...rest } = form;
      const payload = {
        ...rest,
        country: normaliseCountry(form.country),
      };

      const gps = formGps || createBlankGpsLocation();
      const latitudeInput = gps.latitude !== undefined && gps.latitude !== null ? String(gps.latitude).trim() : '';
      const longitudeInput = gps.longitude !== undefined && gps.longitude !== null ? String(gps.longitude).trim() : '';

      if (latitudeInput && longitudeInput) {
        const latitude = parseFloat(latitudeInput);
        const longitude = parseFloat(longitudeInput);
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          payload.gpsLocation = {
            latitude,
            longitude,
          };

          const accuracyInput = gps.accuracy !== undefined && gps.accuracy !== null ? String(gps.accuracy).trim() : '';
          if (accuracyInput) {
            const accuracy = parseFloat(accuracyInput);
            if (!Number.isNaN(accuracy)) {
              payload.gpsLocation.accuracy = accuracy;
            }
          }

          if (gps.provider && gps.provider.trim()) {
            payload.gpsLocation.provider = gps.provider.trim();
          }

          if (gps.capturedAt && gps.capturedAt.trim()) {
            payload.gpsLocation.capturedAt = gps.capturedAt;
          }
        }
      } else if (editingId) {
        payload.gpsLocation = null;
      }

      let savedAddress;
      if (editingId) {
        savedAddress = await updateAddress(token, editingId, payload);
        if (!savedAddress) {
          await loadAddresses();
        } else {
          setAddresses((prev) =>
            prev.map((addr) => (addr._id === savedAddress._id ? savedAddress : addr))
          );
        }
      } else {
        savedAddress = await createAddress(token, payload);
        if (!savedAddress) {
          await loadAddresses();
        } else {
          setAddresses((prev) => [...prev, savedAddress]);
        }
      }

      resetForm();
    } catch (err) {
      setError(err.message || 'Impossible de sauvegarder cette adresse.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setEditingId(address._id);
    setForm({
      type: address.type || 'sender',
      label: address.label || '',
      contactName: address.contactName || '',
      company: address.company || '',
      email: address.email || '',
      phone: address.phone || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      postalCode: address.postalCode || '',
      city: address.city || '',
      country: address.country || '',
      notes: address.notes || '',
      gpsLocation: {
        latitude:
          address.gpsLocation && address.gpsLocation.latitude !== undefined && address.gpsLocation.latitude !== null
            ? String(address.gpsLocation.latitude)
            : '',
        longitude:
          address.gpsLocation && address.gpsLocation.longitude !== undefined && address.gpsLocation.longitude !== null
            ? String(address.gpsLocation.longitude)
            : '',
        accuracy:
          address.gpsLocation && address.gpsLocation.accuracy !== undefined && address.gpsLocation.accuracy !== null
            ? String(address.gpsLocation.accuracy)
            : '',
        provider: (address.gpsLocation && address.gpsLocation.provider) || '',
        capturedAt:
          address.gpsLocation && address.gpsLocation.capturedAt
            ? formatDateInputValue(address.gpsLocation.capturedAt)
            : '',
      },
    });
    setFormErrors({});
  };

  const handleDelete = async (address) => {
    const confirmed = window.confirm(`Supprimer l'adresse "${address.label}" ?`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      await deleteAddress(token, address._id);
      setAddresses((prev) => prev.filter((item) => item._id !== address._id));
    } catch (err) {
      setError(err.message || 'Suppression impossible.');
    }
  };

  const gpsLocation = form.gpsLocation || createBlankGpsLocation();

  return (
    <div className="profile-addresses">
      <header>
        <h1>📍 Mes adresses sauvegardées</h1>
        <p>Gère ici tes adresses d'expéditeur, destinataire et facturation pour les réutiliser rapidement.</p>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert info">Chargement des adresses…</div>}

      <section className="address-grid">
        {(['sender', 'recipient', 'billing']).map((type) => (
          <article key={type} className="address-column">
            <h2>{typeLabels[type]}</h2>
            {groupedAddresses[type].length === 0 ? (
              <p className="empty">Aucune adresse enregistrée.</p>
            ) : (
              groupedAddresses[type].map((address) => (
                <div key={address._id || address.label} className="address-card">
                  <div className="address-card-main">
                    <h3>{address.label || 'Sans libellé'}</h3>
                    <p>{address.contactName || address.company}</p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.postalCode} {address.city}</p>
                    <p>{normaliseCountry(address.country)}</p>
                    {address.phone && <p>📞 {address.phone}</p>}
                    {address.email && <p>✉️ {address.email}</p>}
                    {address.gpsLocation &&
                      address.gpsLocation.latitude !== undefined &&
                      address.gpsLocation.latitude !== null &&
                      address.gpsLocation.longitude !== undefined &&
                      address.gpsLocation.longitude !== null && (
                        <p className="gps">
                          🌐 {address.gpsLocation.latitude}, {address.gpsLocation.longitude}
                          {address.gpsLocation.accuracy !== undefined && address.gpsLocation.accuracy !== null
                            ? ` (±${address.gpsLocation.accuracy}m)`
                            : ''}
                          {address.gpsLocation.provider ? ` • ${address.gpsLocation.provider}` : ''}
                        </p>
                      )}
                    {address.notes && <p className="notes">📝 {address.notes}</p>}
                  </div>
                  <div className="address-card-actions">
                    <button type="button" onClick={() => handleEdit(address)}>✏️ Modifier</button>
                    <button type="button" className="danger" onClick={() => handleDelete(address)}>🗑️ Supprimer</button>
                  </div>
                </div>
              ))
            )}
          </article>
        ))}
      </section>

      <section className="address-form-wrapper">
        <h2>{editingId ? 'Modifier une adresse' : 'Ajouter une nouvelle adresse'}</h2>
        <form onSubmit={handleSubmit} className="address-form">
          <div className="form-row">
            <label>
              Type d'adresse
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="sender">Expéditeur</option>
                <option value="recipient">Destinataire</option>
                <option value="billing">Facturation</option>
              </select>
            </label>
            <label>
              Libellé
              <input name="label" value={form.label} onChange={handleChange} placeholder="Maison, Bureau…" />
              {formErrors.label && <span className="field-error">{formErrors.label}</span>}
            </label>
          </div>

          <div className="form-row">
            <label>
              Nom du contact
              <input name="contactName" value={form.contactName} onChange={handleChange} />
            </label>
            <label>
              Société
              <input name="company" value={form.company} onChange={handleChange} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </label>
            <label>
              Téléphone
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+33612345678" />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </label>
          </div>

          <div className="form-row">
            <label>
              Adresse (ligne 1)
              <input name="line1" value={form.line1} onChange={handleChange} required />
              {formErrors.line1 && <span className="field-error">{formErrors.line1}</span>}
            </label>
            <label>
              Adresse (ligne 2)
              <input name="line2" value={form.line2} onChange={handleChange} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Code postal
              <input name="postalCode" value={form.postalCode} onChange={handleChange} required />
              {formErrors.postalCode && <span className="field-error">{formErrors.postalCode}</span>}
            </label>
            <label>
              Ville
              <input name="city" value={form.city} onChange={handleChange} required />
              {formErrors.city && <span className="field-error">{formErrors.city}</span>}
            </label>
            <label>
              Pays
              <input name="country" value={form.country} onChange={handleChange} placeholder="FR" required />
              {formErrors.country && <span className="field-error">{formErrors.country}</span>}
            </label>
          </div>

          <div className="geo-section">
            <h3>Localisation GPS (optionnel)</h3>
            <div className="form-row">
              <label>
                Latitude
                <input
                  name="latitude"
                  value={gpsLocation.latitude}
                  onChange={handleGpsChange}
                  placeholder="3.8665"
                  inputMode="decimal"
                />
              </label>
              <label>
                Longitude
                <input
                  name="longitude"
                  value={gpsLocation.longitude}
                  onChange={handleGpsChange}
                  placeholder="11.5167"
                  inputMode="decimal"
                />
              </label>
              <label>
                Précision (m)
                <input
                  name="accuracy"
                  value={gpsLocation.accuracy}
                  onChange={handleGpsChange}
                  placeholder="25"
                  inputMode="decimal"
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Source de localisation
                <input
                  name="provider"
                  value={gpsLocation.provider}
                  onChange={handleGpsChange}
                  placeholder="GPS smartphone, Google Maps…"
                />
              </label>
              <label>
                Date de capture
                <input
                  type="datetime-local"
                  name="capturedAt"
                  value={gpsLocation.capturedAt}
                  onChange={handleGpsChange}
                />
              </label>
            </div>
            <p className="geo-hint">
              Ces données resteront optionnelles et prépareront l'arrivée des services de géolocalisation.
            </p>
          </div>

          <label>
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
          </label>

          <div className="form-actions">
            {editingId && (
              <button type="button" onClick={resetForm} className="secondary">Annuler</button>
            )}
            <button type="submit" disabled={saving}>
              {saving ? 'Sauvegarde…' : editingId ? 'Mettre à jour' : 'Ajouter cette adresse'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProfileAddresses;
