// Lightweight fetch wrapper that injects the JWT and parses errors.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'rl.token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiFetch(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = tokenStorage.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no-op: response had no JSON body */
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export { API_URL };
