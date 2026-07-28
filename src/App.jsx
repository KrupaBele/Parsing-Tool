import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBranches, fetchKeyMapping, saveKeyMapping } from "./api.js";
import {
  buildMappingWithSaved,
  mappingToHeaderNames,
} from "./applySavedMapping.js";
import {
  applyStateBranchAllocation,
  attachLocationToRows,
  extractStateCountsFromGrid,
  stripAllocationFields,
  suggestUnmappedStateBranchMap,
} from "./branchAllocation.js";
import EntitySearch from "./EntitySearch.jsx";
import StateBranchAllocationPanel from "./StateBranchAllocationPanel.jsx";
import {
  fieldsForTarget,
  guessTargetFromHeaders,
  mappingFieldsForTarget,
  normalizeHeader,
  TARGET_TYPES,
} from "./backendSchema.js";
import { gridToBackendRows, rowsToCsvString } from "./csvExport.js";
import { readWorkbook, sheetToGrid } from "./excelUtils.js";
import { detectHeaderRow } from "./headerDetect.js";
const TARGET_LABELS = {
  [TARGET_TYPES.employee]: "Employee master (bulk upload)",
  [TARGET_TYPES.payRegister]: "Pay register (bulk upload)",
  [TARGET_TYPES.attendance]: "Attendance (bulk upload)",
};

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [grid, setGrid] = useState(/** @type {any[][]} */ ([]));
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headers, setHeaders] = useState(/** @type {string[]} */ ([]));
  const [targetType, setTargetType] = useState(TARGET_TYPES.employee);
  const [mapping, setMapping] = useState(
    /** @type {Record<string, number | ''>} */ ({}),
  );
  const [defaultBranchcode, setDefaultBranchcode] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [error, setError] = useState("");
  const [previewRows, setPreviewRows] = useState(
    /** @type {Record<string, string>[]} */ ([]),
  );
  const [headerConfidence, setHeaderConfidence] = useState(
    /** @type {string | null} */ (null),
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [branches, setBranches] = useState(
    /** @type {{ _id: string, branchCode: string, branchName: string, branchState: string }[]} */ ([]),
  );
  const [stateBranchMap, setStateBranchMap] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [useStateAllocation, setUseStateAllocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  /** @type {[Record<string, string> | null, Function]} */
  const [savedHeaderMapping, setSavedHeaderMapping] = useState(null);
  const [savingMapping, setSavingMapping] = useState(false);
  const [mappingSaveMsg, setMappingSaveMsg] = useState("");

  const fieldList = useMemo(
    () => mappingFieldsForTarget(targetType),
    [targetType],
  );
  const exportFieldList = useMemo(
    () => fieldsForTarget(targetType),
    [targetType],
  );

  const excelStateCounts = useMemo(
    () => extractStateCountsFromGrid(grid, headerRowIndex, mapping),
    [grid, headerRowIndex, mapping],
  );

  const allBranchOptions = useMemo(
    () =>
      branches.map((b) => ({
        branchCode: b.branchCode || "",
        branchName: b.branchName || "",
      })),
    [branches],
  );

  useEffect(() => {
    if (!selectedCompanyId) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    fetchBranches(selectedCompanyId)
      .then((list) => {
        if (cancelled) return;
        setBranches(list);
        setStateBranchMap((prev) =>
          suggestUnmappedStateBranchMap(list, {}, prev),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || String(err));
          setBranches([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setSavedHeaderMapping(null);
      setMappingSaveMsg("");
      return;
    }
    let cancelled = false;
    setMappingSaveMsg("");
    fetchKeyMapping(selectedCompanyId, targetType)
      .then((result) => {
        if (cancelled) return;
        if (result?.mapping) {
          setSavedHeaderMapping(result.mapping);
          if (
            result.stateBranchMap &&
            Object.keys(result.stateBranchMap).length > 0
          ) {
            setStateBranchMap((prev) => ({
              ...prev,
              ...result.stateBranchMap,
            }));
          }
          setMappingSaveMsg(
            `Loaded saved mapping for this client (${Object.keys(result.mapping).filter((k) => result.mapping[k]).length} fields).`,
          );
        } else {
          setSavedHeaderMapping(null);
          setMappingSaveMsg("No saved mapping for this client yet.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSavedHeaderMapping(null);
          setError(err?.message || String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, targetType]);

  useEffect(() => {
    if (!branches.length) return;
    setStateBranchMap((prev) =>
      suggestUnmappedStateBranchMap(branches, excelStateCounts, prev),
    );
  }, [branches, excelStateCounts]);

  const [workbook, setWorkbook] = useState(
    /** @type {import('xlsx').WorkBook | null} */ (null),
  );

  const reprocess = useCallback(
    (wb, sheet, hdrIdx, hdrs, tgt, savedMap) => {
      const g = sheetToGrid(wb, sheet);
      setGrid(g);
      setHeaderRowIndex(hdrIdx);
      setHeaders(hdrs);
      const cleanHdrs = hdrs.map((h) =>
        String(h).startsWith("__empty_") ? "" : String(h),
      );
      const guessed = guessTargetFromHeaders(cleanHdrs);
      const useTarget = tgt || guessed;
      setTargetType(useTarget);
      const m = buildMappingWithSaved(
        cleanHdrs,
        useTarget,
        savedMap !== undefined ? savedMap : savedHeaderMapping,
      );
      setMapping(m);
    },
    [savedHeaderMapping],
  );

  // Re-apply when a saved mapping arrives after the file is already loaded
  useEffect(() => {
    if (!headers.length) return;
    const cleanHdrs = headers.map((h) =>
      String(h).startsWith("__empty_") ? "" : String(h),
    );
    setMapping(buildMappingWithSaved(cleanHdrs, targetType, savedHeaderMapping));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when saved mapping identity changes
  }, [savedHeaderMapping]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    setError("");
    setPreviewRows([]);
    if (!file) return;
    setLoading(true);
    setLoadingMsg("Reading file…");
    // Yield to browser so the loading overlay renders before heavy work starts
    await new Promise((resolve) => setTimeout(resolve, 60));
    try {
      const { workbook: wb, sheetNames: names } = await readWorkbook(file);
      setLoadingMsg("Detecting headers…");
      await new Promise((resolve) => setTimeout(resolve, 30));
      setWorkbook(wb);
      setFileName(file.name);
      setSheetNames(names);
      const first = names[0] || "";
      setSelectedSheet(first);
      const g = sheetToGrid(wb, first);
      const {
        headerRowIndex: hIdx,
        headers: hdrs,
        confidence,
      } = detectHeaderRow(g);
      setHeaderConfidence(confidence);
      const cleanHdrs = hdrs.map((h) =>
        String(h).startsWith("__empty_") ? "" : String(h),
      );
      const guessed = guessTargetFromHeaders(cleanHdrs);
      setLoadingMsg("Mapping columns…");
      await new Promise((resolve) => setTimeout(resolve, 30));
      reprocess(wb, first, hIdx, hdrs, guessed);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const onSheetChange = (sheet) => {
    if (!workbook) return;
    setSelectedSheet(sheet);
    const g = sheetToGrid(workbook, sheet);
    const {
      headerRowIndex: hIdx,
      headers: hdrs,
      confidence,
    } = detectHeaderRow(g);
    setHeaderConfidence(confidence);
    reprocess(workbook, sheet, hIdx, hdrs, null);
    setPreviewRows([]);
  };

  const onHeaderRowChange = (idx) => {
    if (!workbook || !selectedSheet) return;
    const g = sheetToGrid(workbook, selectedSheet);
    const r = Number(idx);
    const row = g[r] || [];
    const hdrs = row.map((c, i) => {
      const s = c == null || c === "" ? "" : String(c).trim();
      return s || `__empty_${i}`;
    });
    setHeaderRowIndex(r);
    setHeaders(hdrs);
    setHeaderConfidence("manual");
    const cleanHdrs = hdrs.map((h) =>
      String(h).startsWith("__empty_") ? "" : String(h),
    );
    setMapping(buildMappingWithSaved(cleanHdrs, targetType, savedHeaderMapping));
    setPreviewRows([]);
  };

  const onTargetChange = (t) => {
    setTargetType(t);
    const cleanHdrs = headers.map((h) =>
      String(h).startsWith("__empty_") ? "" : String(h),
    );
    // Saved mapping for the new type loads via effect; auto-map until then
    setMapping(buildMappingWithSaved(cleanHdrs, t, null));
    setPreviewRows([]);
  };

  const onSaveMapping = async () => {
    if (!selectedCompanyId) {
      setError("Select a legal entity before saving the column mapping.");
      return;
    }
    if (!headers.length) {
      setError("Upload an Excel file and map columns before saving.");
      return;
    }
    setSavingMapping(true);
    setError("");
    setMappingSaveMsg("");
    try {
      const headerMapping = mappingToHeaderNames(mapping, headers);
      const result = await saveKeyMapping({
        companyId: selectedCompanyId,
        targetType,
        mapping: headerMapping,
        stateBranchMap: isEmployeeExport ? stateBranchMap : {},
      });
      setSavedHeaderMapping(result?.mapping || headerMapping);
      setMappingSaveMsg(
        `Mapping saved for ${selectedCompanyName || "this client"} (${TARGET_LABELS[targetType]}).`,
      );
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSavingMapping(false);
    }
  };

  const isEmployeeExport = targetType === TARGET_TYPES.employee;

  const buildRows = useCallback(() => {
    let rows = gridToBackendRows(grid, headerRowIndex, mapping, targetType);

    if (isEmployeeExport) {
      let allocRows = attachLocationToRows(
        rows,
        grid,
        headerRowIndex,
        mapping,
      );
      if (useStateAllocation && Object.keys(stateBranchMap).length) {
        allocRows = applyStateBranchAllocation(allocRows, stateBranchMap);
      }
      const br = defaultBranchcode.trim();
      if (br) {
        allocRows = allocRows.map((r) => ({
          ...r,
          branchcode: r.branchcode && r.branchcode !== "" ? r.branchcode : br,
        }));
      }
      rows = allocRows.map(stripAllocationFields);
    } else {
      rows = rows.map((r) => ({ ...r, branchcode: "" }));
    }

    if (targetType === TARGET_TYPES.attendance) {
      const pf = periodFrom.trim();
      const pt = periodTo.trim();
      rows = rows.map((r) => ({
        ...r,
        periodFrom: r.periodFrom && r.periodFrom !== "" ? r.periodFrom : pf,
        periodTo: r.periodTo && r.periodTo !== "" ? r.periodTo : pt,
      }));
    }
    return rows;
  }, [
    grid,
    headerRowIndex,
    mapping,
    targetType,
    isEmployeeExport,
    defaultBranchcode,
    periodFrom,
    periodTo,
    useStateAllocation,
    stateBranchMap,
  ]);

  const onPreview = () => {
    try {
      setPreviewRows(buildRows().slice(0, 15));
      setError("");
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const downloadCsv = () => {
    try {
      const rows = buildRows();
      if (!rows.length) {
        setError(
          "No data rows after the header. Check header row and column mapping.",
        );
        return;
      }
      const csv = rowsToCsvString(rows, targetType);
      const base = fileName.replace(/\.[^.]+$/, "") || "export";
      downloadText(`${base}-${targetType}.csv`, csv);
      setError("");
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const sourceOptions = useMemo(() => {
    return [
      { value: "", label: "— Not mapped —" },
      ...headers.map((h, i) => ({
        value: i,
        label: h.startsWith("__empty_")
          ? `(Column ${i + 1})`
          : h || `(Column ${i + 1})`,
      })),
    ];
  }, [headers]);

  const wrap = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 20px 48px",
  };

  const card = {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
  };

  return (
    <div style={wrap}>
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "36px 48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              boxShadow: "0 8px 32px rgba(15,23,42,0.18)",
              minWidth: 260,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                border: "5px solid #e2e8f0",
                borderTopColor: "#0f766e",
                borderRadius: "50%",
                animation: "ssa-spin 0.85s linear infinite",
              }}
            />
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 15,
                color: "#1e293b",
              }}
            >
              Processing your file
            </p>
            {loadingMsg && (
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {loadingMsg}
              </p>
            )}
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Please wait — this may take a moment for large files
            </p>
          </div>
          <style>{`@keyframes ssa-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>
          Excel → SSA Compliance CSV
        </h1>
        <p style={{ margin: 0, color: "#475569", maxWidth: 720 }}>
          Upload client Excel files, confirm the detected header row, map
          columns to your backend bulk-upload keys, then download CSV.
        </p>
      </header>

      <div style={card}>
        <EntitySearch
          selectedId={selectedCompanyId}
          selectedLabel={selectedCompanyName}
          onSelect={(c) => {
            setSelectedCompanyId(c?._id || "");
            setSelectedCompanyName(c?.companyName || "");
          }}
          onError={setError}
        />
        {branches.length > 0 && isEmployeeExport ? (
          <StateBranchAllocationPanel
            branches={branches}
            excelStateCounts={excelStateCounts}
            stateBranchMap={stateBranchMap}
            useStateAllocation={useStateAllocation}
            onUseStateAllocationChange={setUseStateAllocation}
            onStateBranchMapChange={setStateBranchMap}
            allBranches={allBranchOptions}
          />
        ) : null}
      </div>

      <div style={card}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Excel file
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFile}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
        />
        {fileName ? (
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#64748b" }}>
            Loaded: {fileName}
          </p>
        ) : null}
      </div>

      {sheetNames.length > 0 ? (
        <div style={card}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "flex-end",
            }}
          >
            <div>
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
              >
                Worksheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => onSheetChange(e.target.value)}
                style={{ minWidth: 260, padding: "8px 10px" }}
              >
                {sheetNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
              >
                Header row (0-based)
              </label>
              <input
                type="number"
                min={0}
                value={headerRowIndex}
                onChange={(e) => onHeaderRowChange(e.target.value)}
                style={{ width: 100, padding: "8px 10px" }}
              />
            </div>
            <div>
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
              >
                Output template
              </label>
              <select
                value={targetType}
                onChange={(e) => onTargetChange(e.target.value)}
                style={{ minWidth: 320, padding: "8px 10px" }}
              >
                {Object.entries(TARGET_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {headerConfidence ? (
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "#475569" }}>
              Auto-detect: header row <strong>{headerRowIndex}</strong>,
              template <strong>{TARGET_LABELS[targetType]}</strong>, header
              confidence <strong>{headerConfidence}</strong>. Column mapping
              uses highest-confidence matches; adjust dropdowns if needed.
            </p>
          ) : null}

          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            {isEmployeeExport ? (
              <div>
                <label
                  style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
                >
                  Default branchcode
                </label>
                <input
                  placeholder="e.g. MAIN (fills branchcode if unmapped)"
                  value={defaultBranchcode}
                  onChange={(e) => setDefaultBranchcode(e.target.value)}
                  style={{ width: 280, padding: "8px 10px" }}
                />
              </div>
            ) : null}
            {targetType === TARGET_TYPES.attendance ? (
              <>
                <div>
                  <label
                    style={{
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Default periodFrom
                  </label>
                  <input
                    placeholder="DD-MM-YYYY"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    style={{ width: 140, padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Default periodTo
                  </label>
                  <input
                    placeholder="DD-MM-YYYY"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    style={{ width: 140, padding: "8px 10px" }}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {headers.length > 0 ? (
        <div style={card}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Column mapping</h2>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
            Detected headers (normalized:{" "}
            {headers
              .filter((h) => !h.startsWith("__empty_"))
              .map(normalizeHeader)
              .slice(0, 8)
              .join(", ")}
            …)
          </p>
          {mappingSaveMsg ? (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 13,
                color: selectedCompanyId ? "#0f766e" : "#64748b",
              }}
            >
              {mappingSaveMsg}
            </p>
          ) : null}
          {!selectedCompanyId ? (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#b45309" }}>
              Select a legal entity above to load/save column mappings for that
              client.
            </p>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px,1fr) minmax(220px,1.2fr)",
              gap: "8px 16px",
              maxHeight: 420,
              overflow: "auto",
              paddingRight: 8,
            }}
          >
            {fieldList.map((field) => {
              const branchDisabled =
                field === "branchcode" && !isEmployeeExport;
              return (
                <div key={field} style={{ display: "contents" }}>
                  <label
                    style={{
                      fontSize: 13,
                      alignSelf: "center",
                      fontFamily: "ui-monospace, monospace",
                      color: branchDisabled ? "#94a3b8" : undefined,
                    }}
                  >
                    {field}
                  </label>
                  <select
                    value={
                      branchDisabled
                        ? ""
                        : mapping[field] === "" || mapping[field] == null
                          ? ""
                          : String(mapping[field])
                    }
                    disabled={branchDisabled}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMapping((prev) => ({
                        ...prev,
                        [field]: v === "" ? "" : Number(v),
                      }));
                    }}
                    style={{
                      padding: "6px 8px",
                      fontSize: 13,
                      opacity: branchDisabled ? 0.65 : 1,
                    }}
                  >
                    {branchDisabled ? (
                      <option value="">—</option>
                    ) : (
                      sourceOptions.map((opt, oi) => (
                        <option
                          key={`${field}-col-${oi}`}
                          value={opt.value === "" ? "" : String(opt.value)}
                        >
                          {opt.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onPreview}
              style={{
                padding: "10px 18px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Preview rows
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              style={{
                padding: "10px 18px",
                cursor: "pointer",
                fontWeight: 600,
                background: "#0f766e",
                color: "#fff",
                border: "none",
                borderRadius: 8,
              }}
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={onSaveMapping}
              disabled={!selectedCompanyId || savingMapping}
              style={{
                padding: "10px 18px",
                cursor:
                  !selectedCompanyId || savingMapping
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                background:
                  !selectedCompanyId || savingMapping ? "#94a3b8" : "#1e293b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                opacity: !selectedCompanyId || savingMapping ? 0.7 : 1,
              }}
            >
              {savingMapping ? "Saving…" : "Save mapping for client"}
            </button>
          </div>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 12,
              color: "#64748b",
              maxWidth: 560,
            }}
          >
            UAN is exported as plain digits (e.g. 101000000000). Aadhaar and bank
            account use Excel-safe text so long numbers stay correct when opened
            in Excel. Saved mappings store Excel header names per client and
            template, so the next file for this client is pre-mapped.
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            ...card,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      ) : null}

      {previewRows.length > 0 ? (
        <div style={card}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>
            Preview (first {previewRows.length} rows, {exportFieldList.length}{" "}
            columns)
          </h2>
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: 480,
              width: "100%",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: 12,
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <thead>
                <tr>
                  {exportFieldList.map((f) => (
                    <th
                      key={f}
                      style={{
                        textAlign: "left",
                        padding: "6px 10px",
                        borderBottom: "2px solid #e2e8f0",
                        whiteSpace: "nowrap",
                        background: "#f8fafc",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {exportFieldList.map((f) => (
                      <td
                        key={f}
                        style={{
                          padding: "6px 10px",
                          borderBottom: "1px solid #f1f5f9",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row[f]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
