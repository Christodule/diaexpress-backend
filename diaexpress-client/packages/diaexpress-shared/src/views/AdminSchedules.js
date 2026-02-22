// 📁 src/views/AdminSchedules.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from "../api/api";

const AdminSchedules = () => {
  const { getToken } = useBackendAuth();
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    closingDate: "",
    transportType: "",
    periodLabel: "",
  });

  // Charger les routes disponibles depuis Pricing
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/pricing/routes`);
        const data = res.data.routes || res.data || [];
        setRoutes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement routes", err);
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : res.data.schedules;
      setSchedules(data || []);
    } catch (err) {
      console.error("Erreur chargement schedules", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [getToken]);

  // Ajouter un schedule
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/schedules`,
        {
          origin: form.origin,
          destination: form.destination,
          departureDate: form.departureDate,
          closingDate: form.closingDate,
          transportType: form.transportType,
          periodLabel: form.periodLabel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "✅ Période d’embarquement ajoutée !" });
      setForm({
        origin: "",
        destination: "",
        departureDate: "",
        closingDate: "",
        transportType: "",
        periodLabel: "",
      });
      fetchSchedules();
    } catch (err) {
      console.error("Erreur création schedule", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "❌ Erreur lors de la création",
      });
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un schedule
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Supprimer cette période ?")) return;
    setLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      await axios.delete(`${API_BASE}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules(schedules.filter((s) => s._id !== id));
      setMessage({ type: "success", text: "🗑️ Période supprimée" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "❌ Erreur suppression",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-schedules p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚙️ Gestion des périodes d’embarquement</h1>

      {/* Message de feedback */}
      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulaire */}
      <form
        onSubmit={handleAddSchedule}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {/* Origine */}
        <div>
          <label className="block mb-1">Origine</label>
          <select
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value, destination: "" })}
            className="w-full border rounded p-2"
            required
          >
            <option value="">-- Choisir une origine --</option>
            {[...new Set(routes.map((r) => r.origin))].map((o, idx) => (
              <option key={idx} value={o}>
                {o}
              </option>
            ))}
          </select>
          {routes.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              ⚠️ Aucune origine disponible (vérifie tes tarifs Pricing)
            </p>
          )}
        </div>

        {/* Destination */}
        <div>
          <label className="block mb-1">Destination</label>
          <select
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="w-full border rounded p-2"
            required
            disabled={!form.origin}
          >
            <option value="">-- Choisir une destination --</option>
            {routes
              .filter((r) => r.origin === form.origin)
              .map((r, idx) => (
                <option key={idx} value={r.destination}>
                  {r.destination}
                </option>
              ))}
          </select>
        </div>

        {/* Type de transport */}
        <div>
          <label className="block mb-1">Type de transport</label>
          <select
            value={form.transportType}
            onChange={(e) => setForm({ ...form, transportType: e.target.value })}
            className="w-full border rounded p-2"
            required
          >
            <option value="">-- Choisir --</option>
            <option value="air">Avion</option>
            <option value="sea">Bateau</option>
          </select>
        </div>

        {/* Libellé période */}
        <div>
          <label className="block mb-1">Libellé de la période</label>
          <input
            type="text"
            value={form.periodLabel}
            onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="Ex: Semaine 38"
            required
          />
        </div>

        {/* Dates */}
        <div>
          <label className="block mb-1">Date de départ</label>
          <input
            type="date"
            value={form.departureDate}
            onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Date limite (Closing date)</label>
          <input
            type="date"
            value={form.closingDate}
            onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "⏳ Ajout..." : "Ajouter"}
        </button>
      </form>

      {/* Liste */}
      <h2 className="text-xl font-semibold mt-6 mb-2">📋 Périodes existantes</h2>
      <ul className="space-y-2">
        {schedules.length === 0 && <li>Aucune période enregistrée.</li>}
        {schedules.map((s) => (
          <li
            key={s._id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded shadow"
          >
            <div>
              <p>
                <strong>{s.origin}</strong> → <strong>{s.destination}</strong> ({s.transportType})
              </p>
              <p className="text-sm text-gray-600">
                {s.periodLabel} | Départ : {new Date(s.departureDate).toLocaleDateString()} | Limite :{" "}
                {new Date(s.closingDate).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDeleteSchedule(s._id)}
              className="text-red-600 hover:text-red-800"
              disabled={loading}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminSchedules;
