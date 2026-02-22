import { buildApiUrl } from './api';

export const createPayment = async (token, body) => {
  const r = await fetch(buildApiUrl('/api/payments/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  return r.json();
};

export const myPayments = async (token) => {
  const r = await fetch(buildApiUrl('/api/payments/mine'), {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
};
