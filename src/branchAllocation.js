import { cellToString } from "./excelUtils.js";
import {
  baseStateFromAllocationKey,
  extractStateFromAddress,
  isKnownStateKey,
  normalizeAllocationKey,
  normalizeStateKey,
} from "./stateUtils.js";

/**
 * State/location key for allocation: supports composite values like gujarat-bellandur.
 * @param {Record<string, string>} row
 */
export function resolveRowStateKey(row) {
  const stateVal = (row.state || "").trim();
  if (stateVal) {
    const key = normalizeAllocationKey(stateVal);
    if (key) return key;
  }
  const loc = (row.location || "").trim();
  if (loc) {
    const fromLoc = normalizeAllocationKey(loc);
    if (fromLoc) return fromLoc;
    return extractStateFromAddress(loc);
  }
  return "";
}

/**
 * @param {any[]} line
 * @param {Record<string, number | ''>} mapping
 */
function resolveGridRowStateKey(line, mapping) {
  const stateCol = mapping.state;
  if (stateCol !== "" && stateCol != null) {
    const s = cellToString(line[stateCol]);
    if (s) {
      const key = normalizeAllocationKey(s);
      if (key) return key;
    }
  }
  const locCol = mapping.location;
  if (locCol !== "" && locCol != null) {
    const loc = cellToString(line[locCol]);
    const fromLoc = normalizeAllocationKey(loc);
    if (fromLoc) return fromLoc;
    return extractStateFromAddress(loc);
  }
  return "";
}

/**
 * Attach mapped location column onto parsed rows (not exported to CSV).
 * @param {Record<string, string>[]} rows
 * @param {any[][]} grid
 * @param {number} headerRowIndex
 * @param {Record<string, number | ''>} mapping
 */
export function attachLocationToRows(rows, grid, headerRowIndex, mapping) {
  const locCol = mapping.location;
  if (locCol === "" || locCol == null || !grid.length) return rows;
  let ri = 0;
  const out = [];
  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const line = grid[r] || [];
    const allEmpty = line.every((c) => cellToString(c) === "");
    if (allEmpty) continue;
    const row = rows[ri++];
    if (!row) break;
    out.push({ ...row, location: cellToString(line[locCol]) });
  }
  while (ri < rows.length) out.push(rows[ri++]);
  return out;
}

/** @param {Record<string, string>} row */
export function stripAllocationFields(row) {
  const { location, ...rest } = row;
  return rest;
}

/**
 * Unique normalized states and row counts from state column or location.
 * @param {any[][]} grid
 * @param {number} headerRowIndex
 * @param {Record<string, number | ''>} mapping
 * @returns {Record<string, number>}
 */
export function extractStateCountsFromGrid(grid, headerRowIndex, mapping) {
  if (!grid.length) return {};
  const hasState = mapping.state !== "" && mapping.state != null;
  const hasLocation = mapping.location !== "" && mapping.location != null;
  if (!hasState && !hasLocation) return {};

  /** @type {Record<string, number>} */
  const counts = {};
  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const line = grid[r] || [];
    const allEmpty = line.every((c) => cellToString(c) === "");
    if (allEmpty) continue;
    const key = resolveGridRowStateKey(line, mapping);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * Branches in the base state for an allocation key (incl. gujarat-bellandur → gujarat).
 * @param {{ branchCode: string, branchName?: string, branchState?: string, branchLocation?: string }[]} branches
 * @param {string} allocationKey
 */
export function branchesForAllocationKey(branches, allocationKey) {
  const base = baseStateFromAllocationKey(allocationKey);
  if (!base) return [];
  return branches.filter(
    (b) => normalizeStateKey(b.branchState || "") === base && b.branchCode,
  );
}

/**
 * @param {{ branchCode: string, branchName?: string, branchState?: string, branchLocation?: string }[]} branches
 * @param {string} allocationKey
 */
function suggestBranchForAllocationKey(branches, allocationKey) {
  const matches = branchesForAllocationKey(branches, allocationKey);
  if (matches.length === 1) return matches[0].branchCode;

  if (allocationKey.includes("-")) {
    const hint = allocationKey
      .slice(allocationKey.indexOf("-") + 1)
      .toLowerCase()
      .replace(/-/g, " ");
    const byHint = matches.filter((b) => {
      const name = (b.branchName || "").toLowerCase();
      const loc = (b.branchLocation || "").toLowerCase();
      return (
        name.includes(hint) ||
        hint.includes(name) ||
        (loc && (loc.includes(hint) || hint.includes(loc)))
      );
    });
    if (byHint.length === 1) return byHint[0].branchCode;
  }

  return "";
}

/**
 * Fill only states that are still unmapped (preserves user picks).
 * @param {{ branchCode: string, branchState?: string }[]} branches
 * @param {Record<string, number>} [excelStateCounts]
 * @param {Record<string, string>} [currentMap]
 */
export function suggestUnmappedStateBranchMap(
  branches,
  excelStateCounts = {},
  currentMap = {},
) {
  const next = { ...currentMap };
  const states = new Set([
    ...Object.keys(groupBranchesByState(branches)).filter((k) => k !== "(no state)"),
    ...Object.keys(excelStateCounts),
  ]);
  for (const state of states) {
    if (next[state]) continue;
    const suggested = suggestBranchForAllocationKey(branches, state);
    if (suggested) next[state] = suggested;
  }
  return next;
}

/**
 * @typedef {'mapped' | 'pick_branch' | 'no_branch' | 'not_in_excel' | 'unmapped'} AllocationStatus
 */

/**
 * @param {string} stateKey
 * @param {number} employeeCount
 * @param {{ branchCode: string, branchName?: string, branchState?: string }[]} branches
 * @param {string} selectedBranchCode
 * @returns {AllocationStatus}
 */
export function allocationStatus(stateKey, employeeCount, branches, selectedBranchCode) {
  const matches = branchesForAllocationKey(branches, stateKey);
  if (selectedBranchCode) return "mapped";
  if (matches.length === 0) return employeeCount > 0 ? "no_branch" : "not_in_excel";
  if (matches.length > 1) return employeeCount > 0 ? "pick_branch" : "unmapped";
  return employeeCount > 0 ? "unmapped" : "not_in_excel";
}

/**
 * Rows for the allocation table UI.
 * @param {{ branchCode: string, branchName?: string, branchState?: string }[]} branches
 * @param {Record<string, number>} excelStateCounts
 * @param {Record<string, string>} stateBranchMap
 */
export function buildAllocationTableRows(
  branches,
  excelStateCounts,
  stateBranchMap,
) {
  const keys = new Set([
    ...Object.keys(groupBranchesByState(branches)).filter((k) => k !== "(no state)"),
    ...Object.keys(excelStateCounts),
    ...Object.keys(stateBranchMap),
  ]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((stateKey) => {
      const employeeCount = excelStateCounts[stateKey] || 0;
      const available = branchesForAllocationKey(branches, stateKey);
      const selected = stateBranchMap[stateKey] || "";
      return {
        stateKey,
        employeeCount,
        available,
        selected,
        status: allocationStatus(
          stateKey,
          employeeCount,
          branches,
          selected,
        ),
      };
    });
}

/**
 * Auto-map state → branchCode when exactly one branch exists per state.
 * @param {{ branchCode: string, branchState?: string }[]} branches
 * @returns {Record<string, string>} normalized state key → branchCode
 */
export function suggestStateBranchMap(branches) {  /** @type {Record<string, string[]>} */
  const byState = {};
  for (const b of branches) {
    const key = normalizeStateKey(b.branchState || "");
    if (!key || !b.branchCode) continue;
    if (!byState[key]) byState[key] = [];
    if (!byState[key].includes(b.branchCode)) byState[key].push(b.branchCode);
  }
  /** @type {Record<string, string>} */
  const map = {};
  for (const [state, codes] of Object.entries(byState)) {
    if (codes.length === 1) map[state] = codes[0];
  }
  return map;
}

/**
 * Group branches by normalized state for display.
 * @param {{ branchCode: string, branchName?: string, branchState?: string }[]} branches
 */
export function groupBranchesByState(branches) {
  /** @type {Record<string, { branchCode: string, branchName: string }[]>} */
  const groups = {};
  for (const b of branches) {
    const key = normalizeStateKey(b.branchState || "") || "(no state)";
    if (!groups[key]) groups[key] = [];
    groups[key].push({
      branchCode: b.branchCode || "",
      branchName: b.branchName || "",
    });
  }
  return groups;
}

/**
 * Apply state-wise branch allocation to parsed rows.
 * @param {Record<string, string>[]} rows
 * @param {Record<string, string>} stateBranchMap normalized state → branchCode
 */
export function applyStateBranchAllocation(rows, stateBranchMap) {
  if (!stateBranchMap || !Object.keys(stateBranchMap).length) return rows;
  return rows.map((r) => {
    if (r.branchcode && r.branchcode !== "") return r;
    const key = resolveRowStateKey(r);
    const code = key ? stateBranchMap[key] : "";
    if (code) return { ...r, branchcode: code };
    return r;
  });
}
