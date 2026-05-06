import {
  buildSynonymToField,
  fieldsForTarget,
  normalizeHeader,
  SYNONYMS,
  TARGET_TYPES,
} from './backendSchema.js';

/** @param {string} s */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} headerNorm
 * @param {string[]} synonymsSortedLongFirst normalized synonyms for one field
 */
function matchScore(headerNorm, synonymsSortedLongFirst) {
  let best = 0;

  for (const phrase of synonymsSortedLongFirst) {
    if (!phrase) continue;
    if (headerNorm === phrase) {
      best = Math.max(best, 1000 + Math.min(phrase.length, 40));
      continue;
    }
    if (phrase.length <= 3) {
      try {
        const re = new RegExp(`(^|[^a-z0-9])${escapeRe(phrase)}([^a-z0-9]|$)`, 'i');
        if (re.test(headerNorm)) best = Math.max(best, 700 + phrase.length);
      } catch {
        /* ignore */
      }
      continue;
    }
    if (phrase.length >= 4 && headerNorm.includes(phrase)) {
      best = Math.max(best, 550 + Math.min(phrase.length, 30));
      continue;
    }
    if (headerNorm.length >= 4 && phrase.includes(headerNorm)) {
      best = Math.max(best, 480 + Math.min(headerNorm.length, 25));
    }
  }

  return best;
}

/** Attendance: columns whose title is literally 1–31 (Excel often stores these as numbers). */
function dayColumnScore(rawDisplay, backendField) {
  const s = String(rawDisplay ?? '').trim();
  if (!/^\d{1,2}$/.test(s)) return 0;
  const n = Number(s);
  if (n < 1 || n > 31) return 0;
  if (backendField !== String(n)) return 0;
  return 920;
}

/**
 * @param {string[]} sourceHeaders raw header strings (empty allowed)
 * @param {string} targetType
 * @returns {Record<string, number | ''>} backendField -> source column index or ''
 */
export function autoMapColumns(sourceHeaders, targetType) {
  const fields = fieldsForTarget(targetType);
  const synonymExact = buildSynonymToField(targetType);

  /** @type {{ field: string, phrases: string[] }[]} */
  const fieldSynonyms = [];
  const synObj = SYNONYMS[targetType] || {};
  for (const field of fields) {
    const list = synObj[field];
    const phrases = new Set([normalizeHeader(field)]);
    if (Array.isArray(list)) {
      for (const p of list) phrases.add(normalizeHeader(p));
    }
    phrases.delete('');
    const sorted = [...phrases].sort((a, b) => b.length - a.length);
    fieldSynonyms.push({ field, phrases: sorted });
  }

  /** @type {{ colIdx: number, field: string, score: number }[]} */
  const candidates = [];

  sourceHeaders.forEach((raw, colIdx) => {
    const rawClean = String(raw ?? '').replace(/^__empty_\d+$/, '');
    const headerNorm = normalizeHeader(rawClean);
    if (!headerNorm && rawClean === '') return;

    for (const { field, phrases } of fieldSynonyms) {
      let score = 0;
      if (targetType === TARGET_TYPES.attendance && /^\d{1,2}$/.test(headerNorm)) {
        score = Math.max(score, dayColumnScore(rawClean || headerNorm, field));
      }
      score = Math.max(score, matchScore(headerNorm, phrases));

      let compact = headerNorm.replace(/[^a-z0-9]/g, '');
      if (!score && compact.length >= 4) {
        for (const phrase of phrases) {
          const pc = phrase.replace(/[^a-z0-9]/g, '');
          if (!pc || pc.length < 4) continue;
          if (compact === pc) score = Math.max(score, 520 + pc.length);
          else if (compact.includes(pc) || pc.includes(compact)) {
            score = Math.max(score, 380 + Math.min(compact.length, pc.length));
          }
        }
      }

      if (!score && synonymExact[headerNorm]) {
        /* handled in matchScore usually; fallback */
        if (synonymExact[headerNorm] === field) score = Math.max(score, 900);
      }

      if (score > 0) candidates.push({ colIdx, field, score });
    }
  });

  candidates.sort((a, b) => b.score - a.score || a.colIdx - b.colIdx);

  /** @type {Record<string, number | ''>} */
  const mapping = {};
  for (const f of fields) mapping[f] = '';

  const usedCols = new Set();
  const usedFields = new Set();

  for (const { colIdx, field, score } of candidates) {
    if (usedCols.has(colIdx) || usedFields.has(field)) continue;
    mapping[field] = colIdx;
    usedCols.add(colIdx);
    usedFields.add(field);
  }

  if (targetType === TARGET_TYPES.attendance) {
    for (let d = 1; d <= 31; d++) {
      const key = String(d);
      if (mapping[key] !== '') continue;
      const idx = sourceHeaders.findIndex((h, i) => {
        if (usedCols.has(i)) return false;
        const raw = String(h ?? '').replace(/^__empty_\d+$/, '');
        const ns = normalizeHeader(raw);
        if (ns === key) return true;
        if (ns === `day ${d}` || ns === `d${d}`) return true;
        if (/^\d{1,2}$/.test(String(raw).trim()) && Number(String(raw).trim()) === d) return true;
        return false;
      });
      if (idx >= 0) {
        mapping[key] = idx;
        usedCols.add(idx);
      }
    }
  }

  return mapping;
}
