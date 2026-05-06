import { cellToString } from './excelUtils.js';
import { fieldsForTarget } from './backendSchema.js';

/**
 * Backend CSV keys whose values Excel tends to open as numbers (scientific notation /
 * rounding). Emit using Excel’s CSV text formula so double‑click open keeps full digits.
 * See: cell value `="20121175"` → CSV field `"=""20121175"""`.
 */
const EXCEL_FORCE_TEXT_FIELDS = new Set([
  'branchcode',
  'employeeCode',
  'mobile',
  'aadhaar',
  'uan',
  'esicIpNo',
  'pan',
  'bankAccountNumber',
  'bankIfsc',
  'pfNumber',
  'servieBookNo',
  'replayOrGroupNumber',
  'nominee',
  'bankTransactionIDAndDate',
  'slNoInRegisterOfEmployment',
  'email',
  'markOfIdentification',
  'photo',
  'presentAddress',
  'permanentAddress',
  'bankAddress',
  'bankName',
]);

/** Placeholder used by backend uploads — keep as plain cell, not a formula. */
function isBackendPlaceholder(s) {
  return s === '-' || s === '';
}

/**
 * `"=""_inner_"""` so Excel imports/opens as text literal (no scientific notation).
 * @param {string} s raw cell text (no CSV wrapping yet)
 */
function excelForcedTextCsvField(s) {
  const innerEscaped = s.replace(/"/g, '""');
  const formula = `="${innerEscaped}"`;
  return `"${formula.replace(/"/g, '""')}"`;
}

/**
 * If a value already leaked through as a scientific string, recover plain digits when safe.
 * @param {string} s
 */
function coerceScientificDigitsToPlain(s) {
  const t = String(s).trim();
  if (!t || t === '-' || !/e/i.test(t)) return t;
  const n = Number(t);
  if (!Number.isFinite(n)) return t;
  const r = Math.round(n);
  if (Math.abs(n - r) < 1e-6 && Number.isSafeInteger(r)) return String(r);
  return t;
}

/**
 * @param {string | number | undefined | null} val
 * @param {string | null} [fieldKey] backend CSV column name for data rows
 */
function escapeCsvCell(val, fieldKey = null) {
  let s = '';
  if (val == null || val === '') s = '';
  else if (typeof val === 'number' && Number.isFinite(val)) {
    const r = Math.round(val);
    if (Math.abs(val - r) < 1e-9 && Number.isSafeInteger(r)) s = String(r);
    else s = String(val);
  } else s = String(val).trim();

  if (fieldKey && EXCEL_FORCE_TEXT_FIELDS.has(fieldKey) && s !== '') {
    s = coerceScientificDigitsToPlain(s);
  }
  const plain = s;
  if (
    fieldKey &&
    EXCEL_FORCE_TEXT_FIELDS.has(fieldKey) &&
    !isBackendPlaceholder(plain)
  ) {
    return excelForcedTextCsvField(plain);
  }
  if (/[",\n\r]/.test(plain)) return `"${plain.replace(/"/g, '""')}"`;
  return plain;
}

/**
 * @param {any[][]} grid
 * @param {number} headerRowIndex
 * @param {Record<string, number | ''>} mapping backend key -> source col index
 * @param {string} targetType
 */
export function gridToBackendRows(grid, headerRowIndex, mapping, targetType) {
  const fields = fieldsForTarget(targetType);
  const rows = [];
  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const line = grid[r] || [];
    const allEmpty = line.every(c => cellToString(c) === '');
    if (allEmpty) continue;

    /** @type {Record<string, string>} */
    const obj = {};
    let anyMapped = false;
    for (const f of fields) {
      const col = mapping[f];
      if (col === '' || col == null) {
        obj[f] = '';
        continue;
      }
      const raw = line[col];
      obj[f] = cellToString(raw);
      if (obj[f] !== '') anyMapped = true;
    }
    if (anyMapped) rows.push(obj);
  }
  return rows;
}

/**
 * @param {Record<string, string>[]} rows
 * @param {string} targetType
 */
export function rowsToCsvString(rows, targetType) {
  const fields = fieldsForTarget(targetType);
  const header = fields.map(f => escapeCsvCell(f, null)).join(',');
  const body = rows.map(row => fields.map(f => escapeCsvCell(row[f] ?? '', f)).join(','));
  return [header, ...body].join('\r\n');
}
