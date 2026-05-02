import { apiFetch } from './client';

export async function listProducts() {
  const data = await apiFetch('/products', { auth: true });
  return data.products || [];
}

export async function createProduct(payload) {
  const data = await apiFetch('/products', { method: 'POST', body: payload, auth: true });
  return data.product;
}

export async function updateProduct(id, patch) {
  const data = await apiFetch(`/products/${id}`, { method: 'PATCH', body: patch, auth: true });
  return data.product;
}

export async function adjustProductStock(id, delta) {
  const data = await apiFetch(`/products/${id}/stock`, {
    method: 'PATCH',
    body: { delta },
    auth: true,
  });
  return data.product;
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: 'DELETE', auth: true });
}
