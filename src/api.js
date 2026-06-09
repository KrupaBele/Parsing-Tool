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
