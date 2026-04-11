const DEFAULT_API_BASE = 'https://mern-assignment-55ld.onrender.com';

function getApiBase() {
  const envBase = import.meta.env.VITE_API_URL?.trim();
  const base = envBase || (import.meta.env.DEV ? '' : DEFAULT_API_BASE);
  return base.replace(/\/$/, '');
}

const API_BASE = getApiBase();

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export { API_BASE };
