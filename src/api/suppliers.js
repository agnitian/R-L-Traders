import { apiFetch } from './client';

export async function listSuppliers(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await apiFetch(`/suppliers${qs}`, { auth: true });
  return data.suppliers || [];
}

export async function createSupplier(payload) {
  const data = await apiFetch('/suppliers', { method: 'POST', body: payload, auth: true });
  return data.supplier;
}

export async function updateSupplier(id, patch) {
  const data = await apiFetch(`/suppliers/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.supplier;
}

export async function reviewSupplier(id, action, note = '') {
  const data = await apiFetch(`/suppliers/${id}/review`, {
    method: 'PATCH',
    body: { action, note },
    auth: true,
  });
  return data.supplier;
}

export async function deleteSupplier(id) {
  return apiFetch(`/suppliers/${id}`, { method: 'DELETE', auth: true });
}
