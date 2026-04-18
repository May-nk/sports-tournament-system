import api from './api';

/* ─── Token helpers ────────────────────────────────────────────────── */
export const getToken = () => localStorage.getItem('token');
export const getUser  = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => Boolean(getToken());

/** Returns the role string ('admin' | 'captain' | null) */
export const getRole = () => getUser()?.role?.toLowerCase() ?? null;

/* ─── API calls ────────────────────────────────────────────────────── */
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, role = 'captain') =>
  api.post('/auth/register', { name, email, password, role });
