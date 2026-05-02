import { apiFetch } from './client';

export async function listStockAdjustments(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await apiFetch(`/stock-adjustments${qs}`, { auth: true });
  return data.adjustments || [];
}

export async function createStockAdjustment(payload) {
  const data = await apiFetch('/stock-adjustments', { method: 'POST', body: payload, auth: true });
  return data.adjustment;
}

export async function reviewStockAdjustment(id, action, note = '') {
  const data = await apiFetch(`/stock-adjustments/${id}/review`, {
    method: 'PATCH',
    body: { action, note },
    auth: true,
  });
  return data.adjustment;
}

export async function deleteStockAdjustment(id) {
  return apiFetch(`/stock-adjustments/${id}`, { method: 'DELETE', auth: true });
}
