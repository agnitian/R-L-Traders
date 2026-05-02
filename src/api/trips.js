import { apiFetch } from './client';

export async function listTrips(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/trips${qs ? `?${qs}` : ''}`, { auth: true });
  return data.trips || [];
}

export async function listFleet() {
  const data = await apiFetch('/trips/fleet', { auth: true });
  return data.fleet || [];
}

export async function getTrip(id) {
  const data = await apiFetch(`/trips/${id}`, { auth: true });
  return data.trip;
}

export async function createTrip(payload) {
  const data = await apiFetch('/trips', { method: 'POST', body: payload, auth: true });
  return data.trip;
}

export async function updateTrip(id, patch) {
  const data = await apiFetch(`/trips/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.trip;
}

export async function updateTripStatus(id, status) {
  const data = await apiFetch(`/trips/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
  return data.trip;
}

export async function deleteTrip(id) {
  return apiFetch(`/trips/${id}`, { method: 'DELETE', auth: true });
}

export async function submitTripReturn(id, items, note = '') {
  const data = await apiFetch(`/trips/${id}/return`, {
    method: 'PATCH',
    body: { items, note },
    auth: true,
  });
  return data.trip;
}

export async function reviewTripReturn(id, action, note = '') {
  const data = await apiFetch(`/trips/${id}/return/review`, {
    method: 'PATCH',
    body: { action, note },
    auth: true,
  });
  return data.trip;
}

export async function addTripSale(tripId, payload) {
  const data = await apiFetch(`/trips/${tripId}/sales`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
  return data.trip;
}

export async function updateTripSale(tripId, saleId, patch) {
  const data = await apiFetch(`/trips/${tripId}/sales/${saleId}`, {
    method: 'PATCH',
    body: patch,
    auth: true,
  });
  return data.trip;
}

export async function deleteTripSale(tripId, saleId) {
  const data = await apiFetch(`/trips/${tripId}/sales/${saleId}`, {
    method: 'DELETE',
    auth: true,
  });
  return data.trip;
}
