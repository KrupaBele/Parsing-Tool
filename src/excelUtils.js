import * as XLSXNs from 'xlsx';
import { DATE_CSV_FIELD_KEYS } from './backendSchema.js';

/** CJS (Node) exposes `default`; ESM (Vite) re-exports `read` / `utils` / `SSF` on the namespace. */
const XLSX = XLSXNs.default ?? XLSXNs;

const pad2 = n => String(n).padStart(2, '0');

/** Same epoch as SheetJS `datenum` — Excel 1900 date system (not 1904). */
const EXCEL_BASE_DATE = new Date(1899, 11, 30, 0, 0, 0);

/**
 * JS Date → Excel serial (days since 1899-12-30). Mirrors `xlsx` `datenum` so we can
 * recover the real calendar day after `numdate()` skewed the instant in some timezones.
 * @param {Date} d
 * @param {boolean} [date1904]
 */
function jsDateToExcelSerial(d, date1904 = false) {
  let epoch = d.getTime();
  if (date1904) epoch -= 1462 * 86400000;
  const dnthresh =
    EXCEL_BASE_DATE.getTime() + (d.getTimezoneOffset() - EXCEL_BASE_DATE.getTimezoneOffset()) * 60000;
  return (epoch - dnthresh) / (24 * 60 * 60 * 1000);
}

/** @param {{ d: number; m: number; y: number }} p */
function ymdToDdMmYyyy(p) {
  return `${pad2(p.d)}-${pad2(p.m)}-${p.y}`;
}

/**
 * Excel serial → calendar (1900 date system). Avoids JS Date timezone shifts.
 * @param {number} v
 * @param {string | undefined} fieldKey
 */
function excelSerialToDdMmYyyyIfDateField(v, fieldKey) {
  if (!fieldKey || !DATE_CSV_FIELD_KEYS.has(fieldKey)) return null;
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v >= 1e9) return null;
  const parseSerial = XLSX.SSF?.parse_date_code;
  if (!parseSerial) return null;
  const parsed = parseSerial(v);
  if (!parsed || typeof parsed.y !== 'number') return null;
  if (parsed.y < 1900 || parsed.y > 2100) return null;
  if (parsed.m < 1 || parsed.m > 12 || parsed.d < 1 || parsed.d > 31) return null;
  return ymdToDdMmYyyy({ d: parsed.d, m: parsed.m, y: parsed.y });
}

/**
 * Text as in many client sheets: month / day / year (e.g. "9/5/2000", "1/18/1993").
 * @param {string} s
 * @returns {{ y: number; m: number; d: number } | null}
 */
function parseUsMdYToYmd(s) {
  const t = String(s).trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\s*$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const chk = new Date(year, month - 1, day);
  if (chk.getFullYear() !== year || chk.getMonth() !== month - 1 || chk.getDate() !== day) return null;
  return { y: year, m: month, d: day };
}

/**
 * @param {Date} v
 * @param {string | undefined} fieldKey
 * @returns {string} dd-mm-yyyy
 */
function dateToDdMmYyyy(v, fieldKey) {
  if (Number.isNaN(v.getTime())) return '';
  const parseSerial = XLSX.SSF?.parse_date_code;
  // `cellDates` + `numdate()` can yield a JS Date whose *local* wall clock is still the
  // previous calendar day (e.g. IST) while the workbook serial is correct — round-trip
  // through serial + `parse_date_code` matches Excel's calendar.
  if (parseSerial && fieldKey && DATE_CSV_FIELD_KEYS.has(fieldKey)) {
    const serial = jsDateToExcelSerial(v, false);
    const parsed = parseSerial(serial);
    if (parsed && typeof parsed.y === 'number' && parsed.y >= 1900 && parsed.y <= 2100) {
      if (parsed.m >= 1 && parsed.m <= 12 && parsed.d >= 1 && parsed.d <= 31) {
        return ymdToDdMmYyyy({ d: parsed.d, m: parsed.m, y: parsed.y });
      }
    }
  }
  // Non–date-column cells (rare Date values): keep UTC-midnight vs local-noon heuristic.
  const utcMidnight =
    v.getUTCHours() === 0 &&
    v.getUTCMinutes() === 0 &&
    v.getUTCSeconds() === 0 &&
    v.getUTCMilliseconds() === 0;
  if (utcMidnight) {
    return ymdToDdMmYyyy({
      d: v.getUTCDate(),
      m: v.getUTCMonth() + 1,
      y: v.getUTCFullYear(),
    });
  }
  const noon = new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12, 0, 0);
  return ymdToDdMmYyyy({
    d: noon.getDate(),
    m: noon.getMonth() + 1,
    y: noon.getFullYear(),
  });
}

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

/**
 * @param {any} v
 * @param {string} [fieldKey] Backend CSV column name; when set, date columns map Excel serials to dd-mm-yyyy.
 */
export function cellToString(v, fieldKey) {
  if (v == null || v === '') return '';
  if (v instanceof Date) {
    return dateToDdMmYyyy(v, fieldKey);
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';

  if (typeof v === 'number' && Number.isFinite(v)) {
    const rounded = Math.round(v);
    const isWhole = Math.abs(v - rounded) < 1e-9;

    if (isWhole && rounded >= 1e9 && rounded <= Number.MAX_SAFE_INTEGER) {
      return String(rounded);
    }

    const fromSerial = excelSerialToDdMmYyyyIfDateField(v, fieldKey);
    if (fromSerial != null) return fromSerial;

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
  if (fieldKey && DATE_CSV_FIELD_KEYS.has(fieldKey)) {
    const us = parseUsMdYToYmd(s);
    if (us) return ymdToDdMmYyyy(us);
  }
  return s;
}
