// src/views/PublicDashboardReservation.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useBackendAuth } from '../auth/useBackendAuth';
import { buildApiUrl } from "../api/api";
import styles from "../styles/PublicDashboard.module.css";

const PublicDashboardReservation = () => {
  const { getToken } = useBackendAuth();
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    transportType: "sea",
    scheduleId: "",
  });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get(buildApiUrl('/api/pricing/routes'));
        const data = res.data.routes || res.data || [];
        setRoutes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement routes", err);
      }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(buildApiUrl('/api/schedules/public'));
        const data = Array.isArray(res.data) ? res.data : res.data.schedules;
        setSchedules(data || []);
      } catch (err) {
        console.error("Erreur chargement schedules", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await getToken();
      await axios.post(buildApiUrl('/api/reservations'), form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Réservation créée avec succès !");
      setForm({ origin: "", destination: "", transportType: "sea", scheduleId: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la réservation");
    }
  };

  const filteredDestinations = routes.filter((route) => route.origin === form.origin);

  return (
    <div className={`${styles.dashboard} ${styles.reservationPage}`}>
      <section className={styles.reservationWrapper}>
        <div className={styles.reservationHeader}>
          <span className={styles.heroEyebrow}>réservation en ligne</span>
          <h1 className={styles.reservationTitle}>Réserver un conteneur</h1>
          <p className={styles.reservationSubtitle}>
            Sélectionnez l’itinéraire, le mode de transport et la période d’embarquement
            qui correspondent à vos besoins. Nos départs sont mis à jour en continu.
          </p>
          <div className={styles.reservationHighlights}>
            <span>✓ Confirmation rapide après validation</span>
            <span>✓ Tarifs négociés sur nos lignes régulières</span>
            <span>✓ Assistance opérationnelle par nos agents</span>
          </div>
        </div>

        <div className={styles.reservationLayout}>
          <form onSubmit={handleSubmit} className={styles.reservationForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Origine</label>
              <select
                className={styles.input}
                value={form.origin}
                onChange={(event) =>
                  setForm({ ...form, origin: event.target.value, destination: "", scheduleId: "" })
                }
                required
              >
                <option value="">Sélectionner un point de départ</option>
                {[...new Set(routes.map((route) => route.origin))].map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Destination</label>
              <select
                className={styles.input}
                value={form.destination}
                onChange={(event) =>
                  setForm({ ...form, destination: event.target.value, scheduleId: "" })
                }
                required
                disabled={!form.origin}
              >
                <option value="">Choisir une destination</option>
                {filteredDestinations.length > 0 ? (
                  filteredDestinations.map((route) => (
                    <option key={route.destination} value={route.destination}>
                      {route.destination}
                    </option>
                  ))
                ) : (
                  <option disabled>Aucune destination disponible</option>
                )}
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type de transport</label>
              <select
                className={styles.input}
                value={form.transportType}
                onChange={(event) => setForm({ ...form, transportType: event.target.value, scheduleId: "" })}
              >
                <option value="sea">Bateau</option>
                <option value="air">Avion</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Période d’embarquement</label>
              {loading ? (
                <p className={styles.loadingMessage}>Chargement des périodes...</p>
              ) : (
                <select
                  className={styles.input}
                  value={form.scheduleId}
                  onChange={(event) => setForm({ ...form, scheduleId: event.target.value })}
                  required
                >
                  <option value="">Sélectionner une période</option>
                  {schedules
                    .filter(
                      (schedule) =>
                        schedule.origin === form.origin &&
                        schedule.destination === form.destination &&
                        schedule.transportType === form.transportType
                    )
                    .map((schedule) => (
                      <option key={schedule._id} value={schedule._id}>
                        {schedule.periodLabel} · {schedule.origin} → {schedule.destination} · Départ :
                        {" "}
                        {new Date(schedule.departureDate).toLocaleDateString()} · Clôture :
                        {" "}
                        {new Date(schedule.closingDate).toLocaleDateString()}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <button type="submit" className={styles.submitButton}>
              Réserver maintenant
            </button>
          </form>

          <aside className={styles.reservationSidebar}>
            <div className={styles.sidebarCard}>
              <span className={styles.sidebarTitle}>Besoin d’aide ?</span>
              <p className={styles.sidebarText}>
                Nos conseillers vous assistent pour choisir la meilleure option de
                transport et préparer les documents nécessaires.
              </p>
              <a href="tel:+2250102030405" className={styles.sidebarLink}>
                +225 01 02 03 04 05
              </a>
            </div>
            <div className={styles.sidebarCard}>
              <span className={styles.sidebarTitle}>Documents requis</span>
              <p className={styles.sidebarText}>
                Préparez vos factures commerciales, packing list et certificats
                d’origine pour accélérer la validation.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default PublicDashboardReservation;
