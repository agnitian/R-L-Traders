import { apiFetch, tokenStorage } from './client';

export async function loginAdmin({ email, password }) {
  const data = await apiFetch('/auth/admin/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  tokenStorage.set(data.token);
  return data.user;
}

export async function loginWithPin({ pin, role }) {
  const data = await apiFetch('/auth/pin/login', {
    method: 'POST',
    body: { pin, role },
    auth: false,
  });
  tokenStorage.set(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await apiFetch('/auth/me');
  return data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function adminResetPin({ userId, newPin }) {
  return apiFetch('/auth/admin/reset-pin', {
    method: 'POST',
    body: { userId, newPin },
  });
}

export async function listPinUsers() {
  const data = await apiFetch('/auth/admin/pin-users');
  return data.users;
}

export async function listStaff() {
  const data = await apiFetch('/auth/admin/staff');
  return data.users;
}

export async function createStaff({ name, role, phone, pin, vehicleId, avatarUrl }) {
  const data = await apiFetch('/auth/admin/staff', {
    method: 'POST',
    body: { name, role, phone, pin, vehicleId, avatarUrl },
  });
  return data.user;
}

export async function updateStaff(id, patch) {
  const data = await apiFetch(`/auth/admin/staff/${id}`, {
    method: 'PATCH',
    body: patch,
  });
  return data.user;
}

export async function deleteStaff(id) {
  return apiFetch(`/auth/admin/staff/${id}`, { method: 'DELETE' });
}

export function logout() {
  tokenStorage.clear();
}
