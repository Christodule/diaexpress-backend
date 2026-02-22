import { buildApiUrl } from './api';

export const myNotifications = async (token) => {
  const r = await fetch(buildApiUrl('/api/notifications/me'), {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
};

export const markRead = async (token, id) => {
  const r = await fetch(buildApiUrl(`/api/notifications/${id}/read`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
};
