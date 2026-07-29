import { cellToString } from './excelUtils.js';
import {
  DATE_CSV_FIELD_KEYS,
  PAY_AMOUNT_CSV_FIELDS,
  fieldsForTarget,
} from './backendSchema.js';

/**
 * Backend CSV keys whose values Excel tends to open as numbers (scientific notation /
 * rounding). Emit using Excel’s CSV text formula so double‑click open keeps full digits.
 * See: cell value `="20121175"` → CSV field `"=""20121175"""`.
 * Backend bulk upload unwraps these to plain strings before matching employee master.
 */
const EXCEL_FORCE_TEXT_FIELDS = new Set([
  'branchcode',
  'mobile',
  'aadhaar',
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

/**
 * UAN: plain digits in the file (not `="…"`). Leading tab keeps Excel from showing 1.01E+11;
 * backend upload strips the tab before saving.
 */
const PLAIN_TAB_TEXT_ID_FIELDS = new Set(['uan']);

const ID_NUMERIC_COERCE_FIELDS = new Set([...EXCEL_FORCE_TEXT_FIELDS, ...PLAIN_TAB_TEXT_ID_FIELDS]);

/** Placeholder used by backend uploads — keep as plain cell, not a formula. */
function isBackendPlaceholder(s) {
  return s === '-' || s === '';
}

/**
 * Strip Indian/thousand commas from pay amount text (e.g. "8,12,013.83" → "812013.83").
 * Leaves placeholders and non-numeric strings unchanged.
 * @param {string} s
 */
function stripAmountCommas(s) {
  const t = String(s).trim();
  if (!t || t === '-') return t;
  if (!/,/.test(t)) return t;
  const cleaned = t.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return t;
  return cleaned;
}

/**
 * Use Excel’s `="…"` CSV form when Excel would corrupt the value (long / digit-only IDs).
 * Alphanumeric codes (e.g. P1334) and employeeCode (e.g. 47) stay plain.
 * @param {string} fieldKey
 * @param {string} s trimmed non-empty cell text
 */
function needsExcelForcedText(fieldKey, s) {
  if (!fieldKey || !EXCEL_FORCE_TEXT_FIELDS.has(fieldKey) || s === '') return false;
  if (DATE_CSV_FIELD_KEYS.has(fieldKey)) return false;
  if (PLAIN_TAB_TEXT_ID_FIELDS.has(fieldKey)) return false;
  if (isBackendPlaceholder(s)) return false;
  if (/[A-Za-z]/.test(s)) return false;
  return true;
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
  if (!t || t === '-') return t;
  if (!/e/i.test(t)) return t;
  const n = Number(t);
  if (!Number.isFinite(n)) return t;
  const r = Math.round(n);
  if (Math.abs(n - r) < 1e-6 && Number.isSafeInteger(r)) return String(r);
  return t;
}

function formatIdCellNumber(val) {
  const r = Math.round(val);
  if (Math.abs(val - r) < 1e-9 && Number.isSafeInteger(r)) return String(r);
  if (/e/i.test(String(val))) return coerceScientificDigitsToPlain(String(val));
  return String(val);
}

/**
 * @param {string | number | undefined | null} val
 * @param {string | null} [fieldKey] backend CSV column name for data rows
 */
function escapeCsvCell(val, fieldKey = null) {
  let s = '';
  if (val == null || val === '') s = '';
  else if (val instanceof Date) {
    s = cellToString(val, fieldKey);
  } else if (typeof val === 'number' && Number.isFinite(val)) {
    if (fieldKey && DATE_CSV_FIELD_KEYS.has(fieldKey)) {
      s = cellToString(val, fieldKey);
    } else if (fieldKey && ID_NUMERIC_COERCE_FIELDS.has(fieldKey)) {
      s = formatIdCellNumber(val);
    } else {
      const r = Math.round(val);
      if (Math.abs(val - r) < 1e-9 && Number.isSafeInteger(r)) s = String(r);
      else s = String(val);
    }
  } else if (fieldKey && DATE_CSV_FIELD_KEYS.has(fieldKey)) {
    s = cellToString(val, fieldKey);
  } else {
    s = String(val).trim();
  }

  if (fieldKey && ID_NUMERIC_COERCE_FIELDS.has(fieldKey) && s !== '') {
    s = coerceScientificDigitsToPlain(s);
  }
  const plain = s;
  if (needsExcelForcedText(fieldKey, plain)) {
    return excelForcedTextCsvField(plain);
  }
  if (fieldKey && PLAIN_TAB_TEXT_ID_FIELDS.has(fieldKey) && /^\d+$/.test(plain)) {
    const tabbed = `\t${plain}`;
    if (/[",\n\r]/.test(tabbed)) return `"${tabbed.replace(/"/g, '""')}"`;
    return tabbed;
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
      let value = cellToString(raw, f);
      if (PAY_AMOUNT_CSV_FIELDS.has(f)) {
        value = stripAmountCommas(value);
      }
      obj[f] = value;
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
  const header = fields.map((f) => escapeCsvCell(f)).join(',');
  const body = rows.map((row) =>
    fields.map((f) => escapeCsvCell(row[f] ?? '', f)).join(','),
  );
  return [header, ...body].join('\r\n');
}
