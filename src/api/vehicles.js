import { apiFetch } from './client';

export async function listVehicles() {
  const data = await apiFetch('/vehicles', { auth: true });
  return data.vehicles || [];
}

export async function createVehicle(payload) {
  const data = await apiFetch('/vehicles', { method: 'POST', body: payload, auth: true });
  return data.vehicle;
}

export async function updateVehicle(id, patch) {
  const data = await apiFetch(`/vehicles/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.vehicle;
}

export async function deleteVehicle(id) {
  return apiFetch(`/vehicles/${id}`, { method: 'DELETE', auth: true });
}
