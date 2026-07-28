import { normalizeHeader, TARGET_TYPES } from './backendSchema.js';
import { autoMapColumns } from './buildMapping.js';

/**
 * Convert UI mapping (field -> column index) into persistable form (field -> header name).
 * @param {Record<string, number | ''>} mapping
 * @param {string[]} headers
 * @returns {Record<string, string>}
 */
export function mappingToHeaderNames(mapping, headers) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [field, col] of Object.entries(mapping || {})) {
    if (col === '' || col == null) {
      out[field] = '';
      continue;
    }
    const idx = Number(col);
    const h = headers[idx];
    if (h == null || String(h).startsWith('__empty_') || String(h).trim() === '') {
      out[field] = '';
      continue;
    }
    out[field] = String(h).trim();
  }
  return out;
}

/**
 * Build column-index mapping: start from auto-map, overlay saved header-name mapping.
 * @param {string[]} sourceHeaders raw headers (empty string for blanks ok)
 * @param {string} targetType
 * @param {Record<string, string> | null | undefined} savedHeaderMapping field -> header name
 * @returns {Record<string, number | ''>}
 */
export function buildMappingWithSaved(sourceHeaders, targetType, savedHeaderMapping) {
  const m = autoMapColumns(sourceHeaders, targetType);
  if (targetType !== TARGET_TYPES.employee) m.branchcode = '';

  if (!savedHeaderMapping || typeof savedHeaderMapping !== 'object') {
    return m;
  }

  /** @type {Map<string, number>} */
  const indexByNorm = new Map();
  sourceHeaders.forEach((h, i) => {
    const norm = normalizeHeader(h);
    if (!norm || indexByNorm.has(norm)) return;
    indexByNorm.set(norm, i);
  });

  for (const [field, headerName] of Object.entries(savedHeaderMapping)) {
    if (field === 'branchcode' && targetType !== TARGET_TYPES.employee) {
      m[field] = '';
      continue;
    }
    if (headerName == null || headerName === '') {
      m[field] = '';
      continue;
    }
    const idx = indexByNorm.get(normalizeHeader(headerName));
    if (idx != null) m[field] = idx;
  }

  return m;
}

/**
 * @param {Record<string, number | ''>} mapping
 * @param {Record<string, string> | null | undefined} savedHeaderMapping
 * @returns {number}
 */
export function countSavedMatches(mapping, savedHeaderMapping) {
  if (!savedHeaderMapping) return 0;
  let n = 0;
  for (const [field, headerName] of Object.entries(savedHeaderMapping)) {
    if (!headerName) continue;
    const col = mapping[field];
    if (col !== '' && col != null) n += 1;
  }
  return n;
}
