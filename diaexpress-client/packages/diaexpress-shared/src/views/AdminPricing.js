// 📁 src/views/AdminPricing.js
import React, { useState, useEffect } from 'react';
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from '../api/api';
import axios from 'axios';
import styles from '../styles/AdminPricing.module.css';
import { fetchAddresses } from '../api/addresses';

const transportOptions = ['air', 'sea', 'road', 'rail', 'drone', 'camion', 'train'];

const AdminPricing = () => {
  const { getToken } = useBackendAuth();

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    originAddressId: '',
    destinationAddressId: '',
    transportPrices: [],
  });

  const [editId, setEditId] = useState(null);
  const [pricingList, setPricingList] = useState([]);
  const [packageTypes, setPackageTypes] = useState([]);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Fetch pricing + packageTypes au montage
  useEffect(() => {
    fetchAll();
    fetchPackageTypes();
    loadAddresses();
  }, []);

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPricingList(res.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement pricing', err);
      setError(err.message || 'Impossible de charger les grilles de prix.');
    }
  };

  const fetchPackageTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/package-types`);
      setPackageTypes(Array.isArray(res.data.packageTypes) ? res.data.packageTypes : []);
    } catch (err) {
      console.error('Erreur chargement packageTypes', err);
      setPackageTypes([]);
    }
  };

  const loadAddresses = async () => {
    setAddressesLoading(true);
    try {
      const token = await getToken();
      const list = await fetchAddresses(token);
      setAddresses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Erreur chargement adresses', err);
      setAddresses([]);
      setError((prev) => prev || err.message || "Impossible de charger les adresses disponibles.");
    } finally {
      setAddressesLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ origin: '', destination: '', originAddressId: '', destinationAddressId: '', transportPrices: [] });
    setEditId(null);
  };

  const getAddressId = (address) => {
    if (!address) return '';
    const id = address._id || address.id;
    return id ? String(id) : '';
  };

  const formatAddressValue = (address) => {
    if (!address) return '';
    if (address.label) return address.label;
    const locality = [address.city, address.country].filter(Boolean).join(', ');
    if (locality) return locality;
    const line = [address.line1, address.postalCode].filter(Boolean).join(', ');
    if (line) return line;
    return '';
  };

  const formatAddressOption = (address) => {
    if (!address) return '';
    const parts = [];
    if (address.label) parts.push(address.label);
    const lineParts = [address.line1, address.postalCode, address.city].filter(Boolean).join(', ');
    if (lineParts) parts.push(lineParts);
    if (address.country) parts.push(address.country);
    return parts.join(' — ') || formatAddressValue(address) || 'Adresse';
  };

  const formatGeoHint = (address) => {
    if (!address || !address.gpsLocation) {
      return '🌐 Géolocalisation non renseignée';
    }
    const { latitude, longitude, accuracy, provider } = address.gpsLocation;
    if (latitude === undefined || longitude === undefined) {
      return '🌐 Géolocalisation non renseignée';
    }
    const coords = `${latitude}, ${longitude}`;
    const accuracyLabel = Number.isFinite(accuracy) ? ` (±${accuracy}m)` : '';
    const providerLabel = provider ? ` • ${provider}` : '';
    return `🌐 ${coords}${accuracyLabel}${providerLabel}`;
  };

  const handleSavedAddressChange = (field, value) => {
    setForm((prev) => {
      if (!value) {
        return { ...prev, [`${field}AddressId`]: '' };
      }

      const selected = addresses.find((addr) => getAddressId(addr) === value);
      if (!selected) {
        return { ...prev, [`${field}AddressId`]: '' };
      }

      return {
        ...prev,
        [`${field}AddressId`]: value,
        [field]: formatAddressValue(selected) || prev[field],
      };
    });
  };

  // === Gestion transports ===
  const handleAddTransport = () => {
    setForm({
      ...form,
      transportPrices: [
        ...form.transportPrices,
        {
          transportType: 'air',
          allowedUnits: ['kg'],
          unitType: 'kg',
          pricePerUnit: '',
          dimensionRanges: [],
          packagePricing: [],
          containerPricing: [],
        },
      ],
    });
  };

  const handleTransportChange = (i, field, value) => {
    const updated = [...form.transportPrices];
    updated[i][field] = value;

    if (field === 'transportType') {
      updated[i].allowedUnits = value === 'sea' ? ['m3'] : ['kg'];
      updated[i].unitType = updated[i].allowedUnits[0];
    }

    setForm({ ...form, transportPrices: updated });
  };

  const handleDeleteTransport = (i) => {
    const updated = [...form.transportPrices];
    updated.splice(i, 1);
    setForm({ ...form, transportPrices: updated });
  };

  // === Dimension Ranges ===
  const handleAddRange = (ti) => {
    const updated = [...form.transportPrices];
    updated[ti].dimensionRanges.push({
      minLength: '',
      maxLength: '',
      minWidth: '',
      maxWidth: '',
      minHeight: '',
      maxHeight: '',
      minWeight: '',
      maxWeight: '',
      minVolume: '',
      maxVolume: '',
      price: '',
      priority: '',
      description: '',
    });
    setForm({ ...form, transportPrices: updated });
  };

  const handleRangeChange = (ti, ri, e) => {
    const updated = [...form.transportPrices];
    updated[ti].dimensionRanges[ri][e.target.name] = e.target.value;
    setForm({ ...form, transportPrices: updated });
  };

  const handleDeleteRange = (ti, ri) => {
    const updated = [...form.transportPrices];
    updated[ti].dimensionRanges.splice(ri, 1);
    setForm({ ...form, transportPrices: updated });
  };

  // === Package Pricing ===
  const handleAddPackagePrice = (ti) => {
    const updated = [...form.transportPrices];
    updated[ti].packagePricing.push({ packageTypeId: '', basePrice: '' });
    setForm({ ...form, transportPrices: updated });
  };

  const handlePackageChange = (ti, pi, field, value) => {
    const updated = [...form.transportPrices];
    updated[ti].packagePricing[pi][field] = value;
    setForm({ ...form, transportPrices: updated });
  };

  const handleDeletePackage = (ti, pi) => {
    const updated = [...form.transportPrices];
    updated[ti].packagePricing.splice(pi, 1);
    setForm({ ...form, transportPrices: updated });
  };

  // === Container Pricing (SEA) ===
  const handleAddContainerPrice = (ti) => {
    const updated = [...form.transportPrices];
    updated[ti].containerPricing.push({ containerType: '', basePrice: '', cbmPrice: '' });
    setForm({ ...form, transportPrices: updated });
  };

  const handleContainerChange = (ti, ci, field, value) => {
    const updated = [...form.transportPrices];
    updated[ti].containerPricing[ci][field] = value;
    setForm({ ...form, transportPrices: updated });
  };

  const handleDeleteContainer = (ti, ci) => {
    const updated = [...form.transportPrices];
    updated[ti].containerPricing.splice(ci, 1);
    setForm({ ...form, transportPrices: updated });
  };

  // === Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getToken();

    const body = {
      origin: form.origin,
      destination: form.destination,
      originAddressId: form.originAddressId ? form.originAddressId : null,
      destinationAddressId: form.destinationAddressId ? form.destinationAddressId : null,
      transportPrices: form.transportPrices.map((tp) => ({
        ...tp,
        pricePerUnit: parseFloat(tp.pricePerUnit) || null,
        dimensionRanges: tp.dimensionRanges.map((r) => ({
          ...r,
          price: parseFloat(r.price),
          priority: parseInt(r.priority),
        })),
        packagePricing: tp.packagePricing.map((p) => {
          const pkg = packageTypes.find(pt => pt._id === p.packageTypeId);
          return {
            packageTypeId: p.packageTypeId,
            name: pkg ? pkg.name : "",
            basePrice: parseFloat(p.basePrice),
          };
        }),
        containerPricing: tp.containerPricing.map((c) => ({
          containerType: c.containerType,
          basePrice: parseFloat(c.basePrice),
          cbmPrice: parseFloat(c.cbmPrice) || null,
        })),
      })),
    };

    const method = editId ? 'PUT' : 'POST';
    const url = editId
      ? `${API_BASE}/api/pricing/${editId}`
      : `${API_BASE}/api/pricing`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || 'Erreur à la création');
    }

    alert(editId ? '✅ Tarif modifié' : '✅ Tarif créé');
    resetForm();
    fetchAll();
  };

  const handleDelete = async (id) => {
    const token = await getToken();
    if (!window.confirm('Supprimer ce tarif ?')) return;
    await fetch(`${API_BASE}/api/pricing/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const handleEdit = (p) => {
    setForm({
      origin: p.origin,
      destination: p.destination,
      originAddressId: p.originAddressId ? String(p.originAddressId) : '',
      destinationAddressId: p.destinationAddressId ? String(p.destinationAddressId) : '',
      transportPrices: p.transportPrices || [],
    });
    setEditId(p._id);
  };

  const selectedOrigin = form.originAddressId
    ? addresses.find((addr) => getAddressId(addr) === form.originAddressId)
    : null;
  const selectedDestination = form.destinationAddressId
    ? addresses.find((addr) => getAddressId(addr) === form.destinationAddressId)
    : null;

  return (
    <div className={styles.adminPricing}>
      <h2>{editId ? 'Modifier un tarif' : 'Créer un tarif'}</h2>
      {error && <div className={styles.pricingAlert}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.pricingForm}>
        <div className={styles.addressSelectGroup}>
          <label>
            Adresse d'origine sauvegardée
            <select
              value={form.originAddressId}
              onChange={(e) => handleSavedAddressChange('origin', e.target.value)}
              disabled={addressesLoading && !addresses.length}
            >
              <option value="">— Saisir manuellement —</option>
              {addresses.map((address) => (
                <option key={getAddressId(address)} value={getAddressId(address)}>
                  {formatAddressOption(address)}
                </option>
              ))}
            </select>
          </label>
          {addressesLoading && <span className={styles.pricingFormHint}>Chargement des adresses…</span>}
          {form.originAddressId && selectedOrigin && (
            <span className={styles.pricingFormHint}>{formatGeoHint(selectedOrigin)}</span>
          )}
        </div>
        <input
          name="origin"
          value={form.origin}
          onChange={(e) => setForm({ ...form, origin: e.target.value })}
          placeholder="Origine"
          required
        />
        <div className={styles.addressSelectGroup}>
          <label>
            Adresse de destination sauvegardée
            <select
              value={form.destinationAddressId}
              onChange={(e) => handleSavedAddressChange('destination', e.target.value)}
              disabled={addressesLoading && !addresses.length}
            >
              <option value="">— Saisir manuellement —</option>
              {addresses.map((address) => (
                <option key={`${getAddressId(address)}-dest`} value={getAddressId(address)}>
                  {formatAddressOption(address)}
                </option>
              ))}
            </select>
          </label>
          {form.destinationAddressId && selectedDestination && (
            <span className={styles.pricingFormHint}>{formatGeoHint(selectedDestination)}</span>
          )}
        </div>
        <input
          name="destination"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          placeholder="Destination"
          required
        />

        <h4>🚚 Modes de transport</h4>
        {form.transportPrices.map((tp, ti) => (
          <div key={ti} className={styles.transportBlock}>
            <select
              value={tp.transportType}
              onChange={(e) =>
                handleTransportChange(ti, 'transportType', e.target.value)
              }
            >
              {transportOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {tp.transportType !== 'sea' && (
              <input
                value={tp.pricePerUnit}
                onChange={(e) =>
                  handleTransportChange(ti, 'pricePerUnit', e.target.value)
                }
                placeholder={`Prix par ${tp.unitType || 'unité'}`}
                type="number"
              />
            )}
            <button type="button" onClick={() => handleDeleteTransport(ti)}>
              🗑️ Supprimer transport
            </button>

            {tp.transportType === 'sea' ? (
              <>
                <h5>🚢 Tarifs conteneurs</h5>
                {tp.containerPricing.map((c, ci) => (
                  <div key={ci} className={styles.containerPriceRow}>
                    <input
                      value={c.containerType}
                      onChange={(e) =>
                        handleContainerChange(ti, ci, 'containerType', e.target.value)
                      }
                      placeholder="Type de conteneur (ex: FCL 20ft)"
                    />
                    <input
                      value={c.basePrice}
                      onChange={(e) =>
                        handleContainerChange(ti, ci, 'basePrice', e.target.value)
                      }
                      placeholder="Prix fixe €"
                      type="number"
                    />
                    <input
                      value={c.cbmPrice}
                      onChange={(e) =>
                        handleContainerChange(ti, ci, 'cbmPrice', e.target.value)
                      }
                      placeholder="Prix par m³"
                      type="number"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteContainer(ti, ci)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddContainerPrice(ti)}>
                  ➕ Ajouter un conteneur
                </button>
              </>
            ) : (
              <>
                <h5>📏 Plages dimensionnelles</h5>
                <table className={styles.rangeTable}>
                  <thead>
                    <tr>
                      <th>L</th>
                      <th>l</th>
                      <th>h</th>
                      <th>Poids</th>
                      <th>Volume</th>
                      <th>Prix</th>
                      <th>Priorité</th>
                      <th>Description</th>
                      <th>🗑️</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tp.dimensionRanges.map((range, ri) => (
                      <tr key={ri}>
                        <td>
                          <input
                            name="minLength"
                            value={range.minLength}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Min"
                          />
                          <input
                            name="maxLength"
                            value={range.maxLength}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Max"
                          />
                        </td>
                        <td>
                          <input
                            name="minWidth"
                            value={range.minWidth}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Min"
                          />
                          <input
                            name="maxWidth"
                            value={range.maxWidth}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Max"
                          />
                        </td>
                        <td>
                          <input
                            name="minHeight"
                            value={range.minHeight}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Min"
                          />
                          <input
                            name="maxHeight"
                            value={range.maxHeight}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Max"
                          />
                        </td>
                        <td>
                          <input
                            name="minWeight"
                            value={range.minWeight}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Min"
                          />
                          <input
                            name="maxWeight"
                            value={range.maxWeight}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Max"
                          />
                        </td>
                        <td>
                          <input
                            name="minVolume"
                            value={range.minVolume}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Min"
                          />
                          <input
                            name="maxVolume"
                            value={range.maxVolume}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                            placeholder="Max"
                          />
                        </td>
                        <td>
                          <input
                            name="price"
                            value={range.price}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                          />
                        </td>
                        <td>
                          <input
                            name="priority"
                            value={range.priority}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                          />
                        </td>
                        <td>
                          <input
                            name="description"
                            value={range.description}
                            onChange={(e) => handleRangeChange(ti, ri, e)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteRange(ti, ri)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => handleAddRange(ti)}>
                  ➕ Ajouter une plage
                </button>

                <h5>📦 Tarifs par type de colis</h5>
                {tp.packagePricing.map((pkg, pi) => (
                  <div key={pi} className={styles.packagePriceRow}>
                    <select
                      value={pkg.packageTypeId}
                      onChange={(e) =>
                        handlePackageChange(ti, pi, 'packageTypeId', e.target.value)
                      }
                    >
                      <option value="">Choisir un type</option>
                      {packageTypes.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={pkg.basePrice}
                      onChange={(e) =>
                        handlePackageChange(ti, pi, 'basePrice', e.target.value)
                      }
                      placeholder="Base Price €"
                      type="number"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(ti, pi)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddPackagePrice(ti)}>
                  ➕ Ajouter un tarif colis
                </button>
              </>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddTransport}>
          ➕ Ajouter un mode de transport
        </button>

        <br />
        <button type="submit">{editId ? 'Modifier' : 'Créer'}</button>
        {editId && <button type="button" onClick={resetForm}>Annuler</button>}
      </form>

      <h3>📋 Tarifs enregistrés</h3>
      <ul className={styles.pricingList}>
        {pricingList.map((p) => (
          <li key={p._id}>
            <strong>{p.origin} → {p.destination}</strong>
            {p.transportPrices?.map((tp, i) => (
              <div key={i} className={styles.savedTransport}>
                <p>• {tp.transportType.toUpperCase()}</p>

                {tp.transportType !== 'sea' ? (
                  tp.pricePerUnit
                    ? <p>💰 {tp.pricePerUnit} € / {tp.unitType}</p>
                    : '—'
                ) : (
                  tp.containerPricing?.length > 0 ? (
                    <ul>
                      {tp.containerPricing.map((c, ci) => (
                        <li key={ci}>
                          {c.containerType} : {c.basePrice} € 
                          {c.cbmPrice ? ` | ${c.cbmPrice} €/m³` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : '—'
                )}
              </div>
            ))}
            <button onClick={() => handleEdit(p)}>✏️</button>
            <button onClick={() => handleDelete(p._id)} className={styles.delete}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPricing;
