import * as XLSX from 'xlsx';

/**
 * @param {File} file
 * @returns {Promise<{ workbook: XLSX.WorkBook, sheetNames: string[] }>}
 */
export async function readWorkbook(file) {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array', cellDates: true, cellNF: false, cellText: false });
  return { workbook, sheetNames: workbook.SheetNames };
}

/**
 * @param {XLSX.WorkBook} workbook
 * @param {string} sheetName
 * @returns {any[][]}
 */
export function sheetToGrid(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  /** `raw: true` keeps full integer precision for Aadhaar / UAN; formatted strings often become `7.11E+11`. */
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
}

/** @param {any} v */
export function cellToString(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) {
    const d = v.getDate().toString().padStart(2, '0');
    const m = (v.getMonth() + 1).toString().padStart(2, '0');
    const y = v.getFullYear();
    return `${d}-${m}-${y}`;
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';

  if (typeof v === 'number' && Number.isFinite(v)) {
    const rounded = Math.round(v);
    const isWhole = Math.abs(v - rounded) < 1e-9;

    if (isWhole && rounded >= 1e9 && rounded <= Number.MAX_SAFE_INTEGER) {
      return String(rounded);
    }

    if (isWhole && rounded <= Number.MAX_SAFE_INTEGER) {
      return String(rounded);
    }

    let s = String(v);
    if (/e/i.test(s)) {
      const fixed = Number.isFinite(v) ? Number(v).toFixed(12).replace(/\.?0+$/, '') : s;
      return fixed;
    }
    return s;
  }

  let s = String(v).trim();
  // Fallback if upstream ever supplies formatted scientific strings (precision may be lost).
  if (/^-?\d+\.?\d*[eE][+-]?\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) {
      const r = Math.round(n);
      if (Math.abs(n - r) < 1e-6 && r >= 1e9 && r <= Number.MAX_SAFE_INTEGER) return String(r);
    }
  }
  return s;
}
