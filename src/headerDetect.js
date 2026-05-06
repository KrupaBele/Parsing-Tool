import { cellToString } from './excelUtils.js';
import { normalizeHeader } from './backendSchema.js';

/** @param {any} v */
export function isNumericLike(v) {
  if (v === '' || v == null) return false;
  if (typeof v === 'number' && !Number.isNaN(v)) return true;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return true;
  return false;
}

/** Calendar day columns are numeric 1–31 and count as header tokens, not data noise. */
function isDayHeaderToken(v) {
  if (v === '' || v == null) return false;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isInteger(n) && n >= 1 && n <= 31;
}

/**
 * How strongly does the row below look like data (not a second header band)?
 * @param {any[][]} grid
 * @param {number} headerRowIdx
 */
function nextRowDataAffinity(grid, headerRowIdx) {
  const next = grid[headerRowIdx + 1];
  if (!next || !next.length) return 0;

  let weighted = 0;
  let filled = 0;
  for (const c of next) {
    const s = cellToString(c);
    if (s === '') continue;
    filled++;
    const lower = s.toLowerCase();
    if (/^(p|a|cl|sl|pl|el|al|ml|wo|w|od|l|hl|co|off)$/i.test(lower)) weighted += 3;
    else if (isNumericLike(c)) weighted += 1.2;
    else if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(s)) weighted += 1.5;
    else if (s.length >= 2 && s.length <= 120 && !/^[a-z\s]{12,}$/i.test(lower)) weighted += 1;
  }
  if (filled === 0) return 0;
  return Math.min(35, (weighted / filled) * 12);
}

/** Longest run of consecutive day numbers 1,2,3,… starting from column startIdx (weak scan). */
function daySequenceBonus(row) {
  const nums = row.map(c => {
    if (isDayHeaderToken(c)) return Number(String(c).trim());
    return null;
  });
  let best = 0;
  let run = 0;
  let expect = 1;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === expect) {
      run++;
      expect++;
      best = Math.max(best, run);
    } else if (nums[i] === 1) {
      run = 1;
      expect = 2;
      best = Math.max(best, run);
    } else {
      run = 0;
      expect = 1;
    }
  }
  return Math.min(28, best * 2.5);
}

/**
 * Score rows to find the header row in messy client sheets.
 * @param {any[][]} grid
 * @param {number} scanRows
 * @returns {{ headerRowIndex: number, headers: string[], confidence: string }}
 */
export function detectHeaderRow(grid, scanRows = 45) {
  const maxR = Math.min(scanRows, grid.length);
  let bestIdx = 0;
  let bestScore = -Infinity;

  for (let r = 0; r < maxR; r++) {
    const row = grid[r] || [];
    const labels = row.map(cellToString);
    const nonEmpty = labels.filter(s => s !== '');
    if (nonEmpty.length < 3) continue;

    let score = 0;
    const normCells = nonEmpty.map(normalizeHeader);

    const headerLikeTokens = labels.filter((s, i) => {
      if (s === '') return false;
      if (isDayHeaderToken(row[i])) return true;
      if (isNumericLike(row[i]) && !isDayHeaderToken(row[i])) return false;
      return true;
    });

    score += Math.min(nonEmpty.length, 45) * 1.8;
    score += Math.min(headerLikeTokens.length, 40) * 0.8;
    score += daySequenceBonus(row);

    const joined = normCells.join(' | ');
    if (joined.includes('employee') && (joined.includes('name') || joined.includes('id'))) score += 32;
    if (normCells.some(n => n === '1') && normCells.some(n => n === '2') && normCells.some(n => n === '3')) score += 22;
    if (normCells.some(n => n.includes('gross')) && normCells.some(n => n.includes('basic'))) score += 22;
    if (normCells.some(n => n.includes('payable') && n.includes('day'))) score += 14;
    if (normCells.some(n => n.includes('ifsc')) || normCells.some(n => n.includes('uan'))) score += 10;
    if (joined.includes('designation') || joined.includes('bank')) score += 6;

    const firstFourNumeric =
      row.slice(0, 4).every(c => c !== '' && c != null && isNumericLike(c) && !isDayHeaderToken(c));
    if (firstFourNumeric) score -= 40;

    score += nextRowDataAffinity(grid, r);

    const looksSparseTitle = nonEmpty.length <= 4 && row.length > 12;
    if (looksSparseTitle) score -= 25;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = r;
    }
  }

  const headerRow = grid[bestIdx] || [];
  const headers = headerRow.map((c, i) => {
    const s = cellToString(c);
    return s || `__empty_${i}`;
  });

  const confidence =
    bestScore >= 55 ? 'high' : bestScore >= 35 ? 'medium' : 'low';

  return { headerRowIndex: bestIdx, headers, confidence };
}
