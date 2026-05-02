import { apiFetch } from './client';

export async function listCounterSales(params = {}) {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch(`/counter-sales${suffix}`, { auth: true });
  return data.sales || [];
}

export async function createCounterSale(payload) {
  const data = await apiFetch('/counter-sales', { method: 'POST', body: payload, auth: true });
  return data.sale;
}

export async function updateCounterSale(id, patch) {
  const data = await apiFetch(`/counter-sales/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.sale;
}

export async function deleteCounterSale(id) {
  return apiFetch(`/counter-sales/${id}`, { method: 'DELETE', auth: true });
}
