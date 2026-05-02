import { apiFetch } from './client';

export async function listIntakes(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v);
  });
  const path = '/intakes' + (qs.toString() ? `?${qs}` : '');
  const data = await apiFetch(path, { auth: true });
  return data.intakes || [];
}

export async function createIntake(payload) {
  const data = await apiFetch('/intakes', { method: 'POST', body: payload, auth: true });
  return data.intake;
}

export async function verifyIntake(id) {
  const data = await apiFetch(`/intakes/${id}/verify`, { method: 'PATCH', auth: true });
  return data.intake;
}

export async function rejectIntake(id, reason) {
  const data = await apiFetch(`/intakes/${id}/reject`, {
    method: 'PATCH',
    body: { reason },
    auth: true,
  });
  return data.intake;
}

export async function deleteIntake(id) {
  return apiFetch(`/intakes/${id}`, { method: 'DELETE', auth: true });
}
