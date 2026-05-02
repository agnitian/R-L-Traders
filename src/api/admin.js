import { apiFetch, API_URL, tokenStorage } from './client';

export async function listRecentActivity(limit = 10) {
  const data = await apiFetch(`/admin/recent-activity?limit=${limit}`, { auth: true });
  return data.activity || [];
}

export async function getAnalytics() {
  return apiFetch('/admin/analytics', { auth: true });
}

export async function getOverview() {
  return apiFetch('/admin/overview', { auth: true });
}

export async function listCustomerAudit({ from, to, limit = 100 } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (limit) qs.set('limit', limit);
  const data = await apiFetch(`/admin/audit/customers?${qs.toString()}`, { auth: true });
  return data.entries || [];
}

export async function getReportsSummary() {
  return apiFetch('/admin/reports/summary', { auth: true });
}

export async function downloadReportPdf(range) {
  const token = tokenStorage.get();
  const res = await fetch(`${API_URL}/admin/reports/${range}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.message) msg = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rl-traders-${range}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
