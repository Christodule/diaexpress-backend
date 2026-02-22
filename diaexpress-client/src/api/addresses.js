import { buildApiUrl } from './api';

const parseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || `Erreur API adresses (${response.status})`;
    throw new Error(message);
  }
  return data;
};

const extractAddressList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.addresses)) return payload.addresses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractAddress = (payload) => {
  if (!payload) return null;
  if (payload.address) return payload.address;
  if (payload.data) return payload.data;
  return payload;
};

export const fetchAddresses = async (token) => {
  const res = await fetch(buildApiUrl('/api/addresses'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJson(res);
  return extractAddressList(data);
};

export const createAddress = async (token, body) => {
  const res = await fetch(buildApiUrl('/api/addresses'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  return extractAddress(data);
};

export const updateAddress = async (token, id, body) => {
  const res = await fetch(buildApiUrl(`/api/addresses/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  return extractAddress(data);
};

export const deleteAddress = async (token, id) => {
  const res = await fetch(buildApiUrl(`/api/addresses/${id}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await parseJson(res);
  return true;
};
