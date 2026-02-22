// src/api/quotes.js
import { buildApiUrl } from './api';

// ✅ Admin - Liste de tous les devis
export const fetchAdminQuotes = async (token) => {
  const r = await fetch(buildApiUrl('/api/quotes'), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error(`Erreur fetch admin quotes: ${r.status}`);
  return r.json();
};

// ✅ Utilisateur (client ou admin) - Liste de ses propres devis
export const fetchUserQuotes = async (token) => {
  const r = await fetch(buildApiUrl('/api/quotes/me'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Erreur fetch user quotes: ${r.status}`);
  return r.json();
};

// ✅ Admin - Mise à jour d'un devis
export const adminUpdateQuote = async (token, id, payload) => {
  const r = await fetch(buildApiUrl(`/api/quotes/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Erreur update quote: ${r.status}`);
  return r.json();
};

// ✅ Admin - Confirmer un devis → crée un Shipment
export const confirmQuote = async (token, id, body) => {
  const r = await fetch(buildApiUrl(`/api/quotes/${id}/confirm`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(`Erreur confirm quote: ${r.status}`);
  return r.json();
};

// ✅ Admin - Rejeter un devis
export const rejectQuote = async (token, id, reason) => {
  const r = await fetch(buildApiUrl(`/api/quotes/${id}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  if (!r.ok) throw new Error(`Erreur reject quote: ${r.status}`);
  return r.json();
};

// ✅ Admin - Dispatcher un devis confirmé
export const dispatchQuote = async (token, id, payload) => {
  const r = await fetch(buildApiUrl(`/api/quotes/${id}/dispatch`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Erreur dispatch quote: ${r.status}`);
  return r.json();
};

// ✅ Admin - Mettre à jour tracking
export const updateQuoteTracking = async (token, id, payload) => {
  const r = await fetch(buildApiUrl(`/api/quotes/${id}/tracking`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Erreur update tracking: ${r.status}`);
  return r.json();
};
