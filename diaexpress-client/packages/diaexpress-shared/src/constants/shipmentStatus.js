export const SHIPMENT_STATUS_FLOW = [
  {
    value: 'En attente',
    label: 'En attente',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    timelineLabel: 'Demande reçue',
  },
  {
    value: 'Préparation',
    label: 'Préparation',
    badgeClass: 'bg-amber-100 text-amber-700',
    timelineLabel: 'Colis en préparation',
  },
  {
    value: 'En transit',
    label: 'En transit',
    badgeClass: 'bg-blue-100 text-blue-700',
    timelineLabel: 'Colis en route',
  },
  {
    value: 'Bloqué douane',
    label: 'Bloqué douane',
    badgeClass: 'bg-orange-100 text-orange-700',
    timelineLabel: 'Contrôle douanier',
  },
  {
    value: 'Arrivé à destination',
    label: 'Arrivé à destination',
    badgeClass: 'bg-purple-100 text-purple-700',
    timelineLabel: 'Arrivée à destination',
  },
  {
    value: 'En livraison',
    label: 'En livraison',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    timelineLabel: 'En cours de livraison',
  },
  {
    value: 'Livré',
    label: 'Livré',
    badgeClass: 'bg-green-100 text-green-700',
    timelineLabel: 'Livraison effectuée',
  },
  {
    value: 'Rejeté',
    label: 'Rejeté',
    badgeClass: 'bg-red-100 text-red-700',
    timelineLabel: 'Expédition rejetée',
  },
];

export const SHIPMENT_STATUS_MAP = SHIPMENT_STATUS_FLOW.reduce((acc, status) => {
  acc[status.value] = status;
  return acc;
}, {});

export const SHIPMENT_STATUS_OPTIONS = SHIPMENT_STATUS_FLOW.map(({ value, label }) => ({
  value,
  label,
}));

export const getStatusBadgeClass = (status) =>
  SHIPMENT_STATUS_MAP[status]?.badgeClass || 'bg-gray-100 text-gray-700';

export const getStatusIndex = (status) =>
  SHIPMENT_STATUS_FLOW.findIndex((item) => item.value === status);

export const formatStatusComment = (status) =>
  SHIPMENT_STATUS_MAP[status]?.timelineLabel || status;
