import { buildApiUrl } from './api';

export const fetchShipments = async (token) => {
  const r = await fetch(buildApiUrl('/api/shipments'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
};

export const updateShipmentStatus = async (token, id, payload) => {
  const r = await fetch(buildApiUrl(`/api/shipments/${id}/status`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return r.json();
};

export const trackShipment = async (code) => {
  const response = await fetch(buildApiUrl(`/api/tracking/${code}`));
  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || 'Erreur lors du suivi du colis';
    throw new Error(message);
  }

  return data;
};
