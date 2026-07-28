import { API_URL } from './apiConfig.js';

/**
 * @param {string} [name]
 * @returns {Promise<{ _id: string, companyName: string, companyCode: string }[]>}
 */
export async function searchClients(name = '') {
  const url = `${API_URL}/client/search?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to search entities (${res.status})`);
  const data = await res.json();
  return data.result || [];
}

/**
 * @param {string} companyId
 * @returns {Promise<{ _id: string, branchCode: string, branchName: string, branchState: string }[]>}
 */
export async function fetchBranches(companyId) {
  const url = `${API_URL}/client/branches?companyId=${encodeURIComponent(companyId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load branches (${res.status})`);
  const data = await res.json();
  return data.result || [];
}

/**
 * @param {string} companyId
 * @param {string} targetType employee | payRegister | attendance
 * @returns {Promise<{
 *   mapping: Record<string, string>,
 *   stateBranchMap: Record<string, string>,
 *   updatedAt?: string,
 * } | null>}
 */
export async function fetchKeyMapping(companyId, targetType) {
  const url =
    `${API_URL}/client/key-mappings` +
    `?companyId=${encodeURIComponent(companyId)}` +
    `&targetType=${encodeURIComponent(targetType)}`;
  const res = await fetch(url);
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
  const url = `${API_URL}/client/key-mappings`;
  const res = await fetch(url, {
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
