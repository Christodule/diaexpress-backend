/*

import React, { useEffect, useState } from "react";
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from "../api/api";

const AdminQuotes = () => {
  const { getToken } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const quotesPerPage = 10;

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des devis");
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour du statut");
      loadQuotes();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="status-badge status-confirmed">✅ Confirmé</span>;
      case "rejected":
        return <span className="status-badge status-rejected">❌ Rejeté</span>;
      case "dispatched":
        return <span className="status-badge status-dispatched">📦 Expédié</span>;
      default:
        return <span className="status-badge status-pending">⏳ En attente</span>;
    }
  };

  const totalPages = Math.ceil(quotes.length / quotesPerPage);
  const displayedQuotes = quotes.slice((page - 1) * quotesPerPage, page * quotesPerPage);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>📄 Gestion des Devis</h2>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-500">Erreur: {error}</p>}
      {!loading && quotes.length === 0 && !error && <p>Aucun devis trouvé.</p>}

      {!loading && quotes.length > 0 && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Transport</th>
                <th>Origine</th>
                <th>Destination</th>
                <th>Prix estimé</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedQuotes.map((q) => (
                <tr key={q._id}>
                  <td>{q._id.slice(-6)}</td>
                  <td>{q.userEmail || "-"}</td>
                  <td>{q.transportType}</td>
                  <td>{q.origin}</td>
                  <td>{q.destination}</td>
                  <td>{q.estimatedPrice || "-"}</td>
                  <td>{formatStatus(q.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn action-confirm"
                        onClick={() => updateStatus(q._id, "confirmed")}
                      >
                        Confirmer
                      </button>
                      <button
                        className="action-btn action-reject"
                        onClick={() => updateStatus(q._id, "rejected")}
                      >
                        Rejeter
                      </button>
                      <button
                        className="action-btn action-dispatch"
                        onClick={() => updateStatus(q._id, "dispatched")}
                      >
                        Expédier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={page === i + 1 ? "active" : ""}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminQuotes;*/

import React, { useEffect, useState } from "react";
import { useBackendAuth } from '../auth/useBackendAuth';
import { API_BASE } from "../api/api";

const AdminQuotes = () => {
  const { getToken } = useBackendAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const quotesPerPage = 4; // 👈 pagination limitée à 4 devis par page

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des devis");
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const updateStatus = async (id, newStatus) => {
    if (newStatus === "confirmed") {
      const confirmAction = window.confirm("Confirmer ce devis ?");
      if (!confirmAction) return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/quotes/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour du statut");
      loadQuotes();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="status-badge status-confirmed">✅ Confirmé</span>;
      case "paid":
        return <span className="status-badge status-paid">💳 Payé</span>;
      case "rejected":
        return <span className="status-badge status-rejected">❌ Rejeté</span>;
      case "dispatched":
        return <span className="status-badge status-dispatched">📦 Expédié</span>;
      default:
        return <span className="status-badge status-pending">⏳ En attente</span>;
    }
  };

  const totalPages = Math.ceil(quotes.length / quotesPerPage);
  const displayedQuotes = quotes.slice((page - 1) * quotesPerPage, page * quotesPerPage);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>📄 Gestion des Devis</h2>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-500">Erreur: {error}</p>}
      {!loading && quotes.length === 0 && !error && <p>Aucun devis trouvé.</p>}

      {!loading && quotes.length > 0 && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Transport</th>
                <th>Origine</th>
                <th>Destination</th>
                <th>Prix estimé</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedQuotes.map((q) => (
                <tr key={q._id}>
                  <td>{q._id.slice(-6)}</td>
                  <td>{q.userEmail || "-"}</td>
                  <td>{q.transportType}</td>
                  <td>{q.origin}</td>
                  <td>{q.destination}</td>
                  <td>{q.estimatedPrice || "-"} {q.currency || "USD"}</td>
                  <td>{formatStatus(q.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {q.status === "pending" && (
                        <button
                          className="action-btn action-confirm"
                          onClick={() => updateStatus(q._id, "confirmed")}
                        >
                          Confirmer
                        </button>
                      )}
                      {q.status === "confirmed" && (
                        <>
                          <button
                            className="action-btn action-reject"
                            onClick={() => updateStatus(q._id, "rejected")}
                          >
                            Rejeter
                          </button>
                          <button
                            className="action-btn action-dispatch"
                            onClick={() => updateStatus(q._id, "dispatched")}
                          >
                            Expédier
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={page === i + 1 ? "active" : ""}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminQuotes;

