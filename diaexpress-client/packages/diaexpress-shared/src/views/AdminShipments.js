import React, { useEffect, useState } from "react";
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from "../api/api";
import {
  SHIPMENT_STATUS_FLOW,
  SHIPMENT_STATUS_OPTIONS,
  getStatusBadgeClass,
} from "../constants/shipmentStatus";

const PAGE_SIZE = 8;

const AdminShipments = () => {
  const { getToken } = useBackendAuth();
  const [shipments, setShipments] = useState([]);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [searchTrackingCode, setSearchTrackingCode] = useState("");
  const [toast, setToast] = useState(null);

  const fetchShipments = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/shipments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setShipments(data.shipments || []);
      } else {
        console.error(data.message || "Erreur lors du chargement");
        setShipments([]);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors de la mise à jour");
      }

      showToast(`Statut mis à jour : ${newStatus}`);
      fetchShipments();
    } catch (err) {
      console.error("Erreur modification statut:", err);
      showToast(err.message || "Erreur modification statut", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression de cet envoi ?")) return;
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/shipments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchShipments();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const destination = s.quoteId?.destination || "";
    const tracking = s.trackingCode || "";
    const status = s.status || "";
    return (
      (!filterStatus || status === filterStatus) &&
      (!filterDestination ||
        destination.toLowerCase().includes(filterDestination.toLowerCase())) &&
      (!searchTrackingCode ||
        tracking.toLowerCase().includes(searchTrackingCode.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredShipments.length / PAGE_SIZE);
  const paginatedShipments = filteredShipments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">📦 Gestion des envois (Admin)</h2>

      {/* 🔎 Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="🔎 Rechercher tracking"
          className="border rounded px-2 py-1"
          value={searchTrackingCode}
          onChange={(e) => setSearchTrackingCode(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">-- Statut --</option>
          {SHIPMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="📍 Destination"
          className="border rounded px-2 py-1"
          value={filterDestination}
          onChange={(e) => setFilterDestination(e.target.value)}
        />
      </div>

      {/* 📋 Tableau */}
      {paginatedShipments.length === 0 ? (
        <p>Aucun envoi trouvé.</p>
      ) : (
        <table className="w-full border text-sm bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="border p-2">Produit</th>
              <th className="border p-2">Origine → Destination</th>
              <th className="border p-2">Transport</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Tracking</th>
              <th className="border p-2">Client</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedShipments.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="border p-2">
                  {s.quoteId?.productType || "—"}
                </td>
                <td className="border p-2">
                  {s.quoteId?.origin} → {s.quoteId?.destination}
                </td>
                <td className="border p-2">
                  {s.quoteId?.deliveryType || "—"}
                </td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(
                      s.status
                    )}`}
                  >
                    {s.status || "—"}
                  </span>
                </td>
                <td className="border p-2">
                  {s.trackingCode || "N/A"}
                  <br />
                  <a
                    href={`/track-shipment?code=${encodeURIComponent(s.trackingCode || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 text-xs"
                  >
                    Suivre
                  </a>
                </td>
                <td className="border p-2">{s.userId?.email || "—"}</td>
                <td className="border p-2 space-x-1">
                  {SHIPMENT_STATUS_FLOW.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => handleStatusChange(s._id, st.value)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      {st.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="ml-1 text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-100"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 📑 Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${
                page === p ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-sm text-white transition-opacity duration-300 ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminShipments;
