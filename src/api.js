import { API_URL } from './apiConfig.js';
import { authHeaders, clearSession, setSession } from './auth.js';

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...authHeaders(),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    throw new Error('Please log in to use client search and save mapping.');
  }
  return res;
}

async function loginAt(path, email, password) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.isLoginSuccess) {
    const msg =
      data?.error || data?.errMsg || `Login failed (${res.status})`;
    throw new Error(msg);
  }
  const token = data.accessToken;
  if (!token) {
    throw new Error('Login succeeded but no accessToken was returned. Redeploy the API.');
  }
  setSession(token, data.user || null);
  return data.user || null;
}

export async function login(email, password) {
  try {
    return await loginAt('/user/login', email, password);
  } catch (userErr) {
    try {
      return await loginAt('/admin/login', email, password);
    } catch {
      throw userErr;
    }
  }
}

export function logout() {
  clearSession();
}

/**
 * @param {string} [name]
 * @returns {Promise<{ _id: string, companyName: string, companyCode: string }[]>}
 */
export async function searchClients(name = '') {
  const res = await apiFetch(`/client/search?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Failed to search entities (${res.status})`);
  const data = await res.json();
  return data.result || [];
}

/**
 * @param {string} companyId
 * @returns {Promise<{ _id: string, branchCode: string, branchName: string, branchState: string, branchArea: string }[]>}
 */
export async function fetchBranches(companyId) {
  const res = await apiFetch(
    `/client/branches?companyId=${encodeURIComponent(companyId)}`,
  );
  if (!res.ok) throw new Error(`Failed to load branches (${res.status})`);
  const data = await res.json();
  return data.result || [];
}

/**
 * @param {string} companyId
 * @param {string} targetType employee | payRegister | attendance
 */
export async function fetchKeyMapping(companyId, targetType) {
  const res = await apiFetch(
    `/client/key-mappings` +
      `?companyId=${encodeURIComponent(companyId)}` +
      `&targetType=${encodeURIComponent(targetType)}`,
  );
  if (!res.ok) throw new Error(`Failed to load key mapping (${res.status})`);
  const data = await res.json();
  return data.result || null;
}

/**
 * @param {{
 *   companyId: string,
 *   targetType: string,
 *   mapping: Record<string, string>,
 *   stateBranchMap?: Record<string, string>,
 * }} payload
 */
export async function saveKeyMapping(payload) {
  const res = await apiFetch('/client/key-mappings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Failed to save key mapping (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) msg = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.result || null;
}
