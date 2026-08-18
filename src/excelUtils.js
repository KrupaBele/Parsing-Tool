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

const MONTH_NAME_TO_NUM = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Excel display text like "8-Dec-1997", "19-Jan-26". */
function parseMonthNameDateToYmd(s) {
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})[-\s./]+([A-Za-z]{3,9})[-\s./]+(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTH_NAME_TO_NUM[m[2].toLowerCase()] ?? MONTH_NAME_TO_NUM[m[2].toLowerCase().slice(0, 3)];
  let year = Number(m[3]);
  if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  if (day < 1 || day > 31) return null;
  const chk = new Date(year, month - 1, day);
  if (chk.getFullYear() !== year || chk.getMonth() !== month - 1 || chk.getDate() !== day) return null;
  return { y: year, m: month, d: day };
}

/** Excel formatted display (cell.w) — not IDs like PAN. */
function isDateLikeDisplayString(s) {
  const t = String(s).trim();
  if (!t) return false;
  if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(t)) return true;
  if (/^\d{1,2}[-\s./]+[A-Za-z]{3,9}[-\s./]+\d{2,4}$/.test(t)) return true;
  return false;
}

function formatDateFieldValue(s) {
  const dashed = parseDdMmYyyyTextToYmd(s);
  if (dashed) return ymdToDdMmYyyy(dashed);
  const monthName = parseMonthNameDateToYmd(s);
  if (monthName) return ymdToDdMmYyyy(monthName);
  const slash = parseSlashDateToYmd(s);
  if (slash) return ymdToDdMmYyyy(slash);
  return null;
}

/** Built-in Excel format ids that represent dates (not plain numbers). */
const EXCEL_BUILT_IN_DATE_FORMAT_IDS = new Set([14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

function isDateNumberFormat(z) {
  if (z == null || z === 'General') return false;
  if (typeof z === 'number' && EXCEL_BUILT_IN_DATE_FORMAT_IDS.has(z)) return true;
  const s = String(z);
  if (/^\d+$/.test(s) && EXCEL_BUILT_IN_DATE_FORMAT_IDS.has(Number(s))) return true;
  const cleaned = s.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '');
  // h:mm uses "m" for minutes — not a calendar date.
  if (/[hs]/i.test(cleaned) && !/[dy]/i.test(cleaned)) return false;
  return /d/i.test(cleaned) && /[my]/i.test(cleaned);
}

/** Excel nf like mm-dd-yy — display is month-first, not Indian dd-mm-yyyy. */
function excelFormatIsMonthFirst(z) {
  if (z == null || z === 'General') return false;
  const s = String(z)
    .replace(/"[^"]*"/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .toLowerCase();
  for (let i = 0; i < s.length; i++) {
    if (s[i] === 'm' || s[i] === 'd') return s[i] === 'm';
  }
  return false;
}

/**
 * Slash/dot dates stored as MM/DD/YYYY (Excel US display).
 * @param {string} s
 * @returns {{ y: number; m: number; d: number } | null}
 */
function parseMonthFirstSlashDateToYmd(s) {
  const t = String(s).trim();
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

function formatDisplayDateToDdMmYyyy(s, z) {
  if (excelFormatIsMonthFirst(z)) {
    const us = parseMonthFirstSlashDateToYmd(s);
    if (us) return ymdToDdMmYyyy(us);
  }
  return formatDateFieldValue(s);
}

/** Excel cell display string when .w is missing (needs cellNF on read). */
function cellDisplayText(cell) {
  if (cell.w && typeof cell.w === 'string') return cell.w.trim();
  if (cell.z != null && typeof cell.v === 'number' && XLSX.SSF?.format) {
    try {
      return String(XLSX.SSF.format(cell.z, cell.v)).trim();
    } catch {
      return '';
    }
  }
  return '';
}

function jsDateToLocalDdMmYyyy(v) {
  const parseSerial = XLSX.SSF?.parse_date_code;
  if (parseSerial) {
    const serial = jsDateToExcelSerial(v, false);
    const parsed = parseSerial(serial);
    if (parsed?.y >= 1900 && parsed.y <= 2100 && parsed.m >= 1 && parsed.d >= 1) {
      return ymdToDdMmYyyy({ d: parsed.d, m: parsed.m, y: parsed.y });
    }
  }
  const utc = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
  return ymdToDdMmYyyy({
    d: utc.getUTCDate(),
    m: utc.getUTCMonth() + 1,
    y: utc.getUTCFullYear(),
  });
}

function serialToDdMmYyyy(serial) {
  const parseSerial = XLSX.SSF?.parse_date_code;
  if (!parseSerial || typeof serial !== 'number' || !Number.isFinite(serial)) return null;
  const parsed = parseSerial(serial);
  if (!parsed?.y || parsed.y < 1900 || parsed.y > 2100) return null;
  if (parsed.m < 1 || parsed.m > 12 || parsed.d < 1 || parsed.d > 31) return null;
  return ymdToDdMmYyyy({ d: parsed.d, m: parsed.m, y: parsed.y });
}

/**
 * Excel serial → calendar (1900 date system). Avoids JS Date timezone shifts.
 * @param {number} v
 * @param {string | undefined} fieldKey
 */
function excelSerialToDdMmYyyyIfDateField(v, fieldKey) {
  if (!fieldKey || !DATE_CSV_FIELD_KEYS.has(fieldKey)) return null;
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v >= 1e9) return null;
  return serialToDdMmYyyy(v);
}

/**
 * Slash/dot dates from client sheets — DD/MM/YYYY (e.g. "13/10/1993") or US when month > 12.
 * @param {string} s
 * @returns {{ y: number; m: number; d: number } | null}
 */
function parseSlashDateToYmd(s) {
  const t = String(s).trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\s*$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += year >= 50 ? 1900 : 2000;

  let day;
  let month;
  if (a > 12 && b <= 12) {
    day = a;
    month = b;
  } else if (b > 12 && a <= 12) {
    month = a;
    day = b;
  } else {
    day = a;
    month = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const chk = new Date(year, month - 1, day);
  if (chk.getFullYear() !== year || chk.getMonth() !== month - 1 || chk.getDate() !== day) return null;
  return { y: year, m: month, d: day };
}

/** Already dd-mm-yyyy (or d-m-yyyy) text — normalize padding. */
function parseDdMmYyyyTextToYmd(s) {
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
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
  if (fieldKey && DATE_CSV_FIELD_KEYS.has(fieldKey)) {
    return jsDateToLocalDdMmYyyy(v);
  }
  return jsDateToLocalDdMmYyyy(v);
}

/**
 * @param {File} file
 * @returns {Promise<{ workbook: XLSX.WorkBook, sheetNames: string[] }>}
 */
export async function readWorkbook(file) {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array', cellDates: false, cellNF: true, cellText: false });
  return { workbook, sheetNames: workbook.SheetNames };
}

/**
 * @param {XLSX.WorkBook} workbook
 * @param {string} sheetName
 * @returns {any[][]}
 */
export function sheetToGrid(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws || !ws['!ref']) return [];

  const range = XLSX.utils.decode_range(ws['!ref']);
  const grid = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) {
        row.push('');
        continue;
      }
      // Prefer the Excel serial/Date over cell.w. Display often follows the
      // workbook format (e.g. mm-dd-yy → "06-01-26" for 1 Jun 2026), which
      // looks like Indian dd-mm-yyyy and gets day/month swapped.
      if (typeof cell.v === 'number' && isDateNumberFormat(cell.z)) {
        const fromSerial = serialToDdMmYyyy(cell.v);
        if (fromSerial) {
          row.push(fromSerial);
          continue;
        }
      }
      if (cell.v instanceof Date && !Number.isNaN(cell.v.getTime())) {
        row.push(jsDateToLocalDdMmYyyy(cell.v));
        continue;
      }
      const display = cellDisplayText(cell);
      if (display && isDateLikeDisplayString(display)) {
        row.push(formatDisplayDateToDdMmYyyy(display, cell.z) || display);
        continue;
      }
      row.push(cell.v ?? '');
    }
    grid.push(row);
  }
  return grid;
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
    const formatted = formatDateFieldValue(s);
    if (formatted) return formatted;
  }
  return s;
}
