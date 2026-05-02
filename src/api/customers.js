import { apiFetch } from './client';

export async function listCustomers(query = '') {
  const q = query ? `?q=${encodeURIComponent(query)}` : '';
  const data = await apiFetch(`/customers${q}`, { auth: true });
  return data.customers || [];
}

export async function createCustomer(payload) {
  const data = await apiFetch('/customers', { method: 'POST', body: payload, auth: true });
  return data.customer;
}

export async function updateCustomer(id, patch) {
  const data = await apiFetch(`/customers/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.customer;
}

export async function deleteCustomer(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE', auth: true });
}
