import {
  buildAllocationTableRows,
  suggestUnmappedStateBranchMap,
} from "./branchAllocation.js";
import { stateDisplayLabel } from "./stateUtils.js";

/**
 * @param {{ branchCode?: string, branchName?: string, branchArea?: string }} b
 */
function branchOptionLabel(b) {
  const parts = [b.branchCode || ""];
  if (b.branchName) parts.push(b.branchName);
  const area = (b.branchArea || "").trim();
  if (area && area !== "-") parts.push(area);
  return parts.join(" — ");
}

/**
 * @param {{
 *   branches: { branchCode: string, branchName?: string, branchState?: string, branchArea?: string }[],
 *   excelStateCounts: Record<string, number>,
 *   stateBranchMap: Record<string, string>,
 *   useStateAllocation: boolean,
 *   onUseStateAllocationChange: (v: boolean) => void,
 *   onStateBranchMapChange: (map: Record<string, string>) => void,
 *   allBranches: { branchCode: string, branchName?: string, branchArea?: string }[],
 * }} props
 */
export default function StateBranchAllocationPanel({
  branches,
  excelStateCounts,
  stateBranchMap,
  useStateAllocation,
  onUseStateAllocationChange,
  onStateBranchMapChange,
  allBranches,
}) {
  const rows = buildAllocationTableRows(
    branches,
    excelStateCounts,
    stateBranchMap,
  );
  if (!rows.length) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>Branch by state</span>
        <label
          style={{
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={useStateAllocation}
            onChange={(e) => onUseStateAllocationChange(e.target.checked)}
          />
          Apply
        </label>
        <button
          type="button"
          onClick={() =>
            onStateBranchMapChange(
              suggestUnmappedStateBranchMap(
                branches,
                excelStateCounts,
                stateBranchMap,
              ),
            )
          }
          style={{ padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
        >
          Auto-fill
        </button>
      </div>

      <div style={{ overflow: "auto", maxHeight: 280 }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: 12,
            width: "100%",
            minWidth: 520,
          }}
        >
          <thead>
            <tr>
              {["State", "Employees", "Branch"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e2e8f0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const options =
                row.available.length > 0 ? row.available : allBranches;
              const multi = row.available.length > 1;
              return (
                <tr
                  key={row.stateKey}
                  style={{
                    background:
                      row.employeeCount > 0 &&
                      (row.status === "pick_branch" ||
                        row.status === "no_branch" ||
                        row.status === "unmapped")
                        ? "#fffbeb"
                        : undefined,
                  }}
                >
                  <td
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {stateDisplayLabel(row.stateKey)}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {row.employeeCount > 0 ? row.employeeCount : "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #f1f5f9",
                      minWidth: 260,
                    }}
                  >
                    <select
                      value={row.selected}
                      onChange={(e) => {
                        const v = e.target.value;
                        onStateBranchMapChange({
                          ...stateBranchMap,
                          ...(v
                            ? { [row.stateKey]: v }
                            : (() => {
                                const next = { ...stateBranchMap };
                                delete next[row.stateKey];
                                return next;
                              })()),
                        });
                      }}
                      style={{
                        padding: "6px 8px",
                        fontSize: 13,
                        width: "100%",
                        borderColor: multi && !row.selected ? "#f59e0b" : undefined,
                      }}
                    >
                      <option value="">—</option>
                      {options.map((b) => (
                        <option key={b.branchCode} value={b.branchCode}>
                          {branchOptionLabel(b)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
