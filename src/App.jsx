import { useCallback, useMemo, useState } from 'react';
import {
  fieldsForTarget,
  guessTargetFromHeaders,
  normalizeHeader,
  TARGET_TYPES,
} from './backendSchema.js';
import { autoMapColumns } from './buildMapping.js';
import { gridToBackendRows, rowsToCsvString } from './csvExport.js';
import { readWorkbook, sheetToGrid } from './excelUtils.js';
import { detectHeaderRow } from './headerDetect.js';

const TARGET_LABELS = {
  [TARGET_TYPES.employee]: 'Employee master (bulk upload)',
  [TARGET_TYPES.payRegister]: 'Pay register (bulk upload)',
  [TARGET_TYPES.attendance]: 'Attendance (bulk upload)',
};

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [fileName, setFileName] = useState('');
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [grid, setGrid] = useState(/** @type {any[][]} */ ([]));
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headers, setHeaders] = useState(/** @type {string[]} */ ([]));
  const [targetType, setTargetType] = useState(TARGET_TYPES.employee);
  const [mapping, setMapping] = useState(/** @type {Record<string, number | ''>} */ ({}));
  const [defaultBranchcode, setDefaultBranchcode] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [error, setError] = useState('');
  const [previewRows, setPreviewRows] = useState(/** @type {Record<string, string>[]} */ ([]));
  const [headerConfidence, setHeaderConfidence] = useState(/** @type {string | null} */ (null));

  const fieldList = useMemo(() => fieldsForTarget(targetType), [targetType]);

  const [workbook, setWorkbook] = useState(/** @type {import('xlsx').WorkBook | null} */ (null));

  const reprocess = useCallback(
    (wb, sheet, hdrIdx, hdrs, tgt) => {
      const g = sheetToGrid(wb, sheet);
      setGrid(g);
      setHeaderRowIndex(hdrIdx);
      setHeaders(hdrs);
      const cleanHdrs = hdrs.map(h => (String(h).startsWith('__empty_') ? '' : String(h)));
      const guessed = guessTargetFromHeaders(cleanHdrs);
      const useTarget = tgt || guessed;
      setTargetType(useTarget);
      const m = autoMapColumns(cleanHdrs, useTarget);
      setMapping(m);
    },
    [],
  );

  const onFile = async e => {
    const file = e.target.files?.[0];
    setError('');
    setPreviewRows([]);
    if (!file) return;
    try {
      const { workbook: wb, sheetNames: names } = await readWorkbook(file);
      setWorkbook(wb);
      setFileName(file.name);
      setSheetNames(names);
      const first = names[0] || '';
      setSelectedSheet(first);
      const g = sheetToGrid(wb, first);
      const { headerRowIndex: hIdx, headers: hdrs, confidence } = detectHeaderRow(g);
      setHeaderConfidence(confidence);
      const cleanHdrs = hdrs.map(h => (String(h).startsWith('__empty_') ? '' : String(h)));
      const guessed = guessTargetFromHeaders(cleanHdrs);
      reprocess(wb, first, hIdx, hdrs, guessed);
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const onSheetChange = sheet => {
    if (!workbook) return;
    setSelectedSheet(sheet);
    const g = sheetToGrid(workbook, sheet);
    const { headerRowIndex: hIdx, headers: hdrs, confidence } = detectHeaderRow(g);
    setHeaderConfidence(confidence);
    reprocess(workbook, sheet, hIdx, hdrs, null);
    setPreviewRows([]);
  };

  const onHeaderRowChange = idx => {
    if (!workbook || !selectedSheet) return;
    const g = sheetToGrid(workbook, selectedSheet);
    const r = Number(idx);
    const row = g[r] || [];
    const hdrs = row.map((c, i) => {
      const s = c == null || c === '' ? '' : String(c).trim();
      return s || `__empty_${i}`;
    });
    setHeaderRowIndex(r);
    setHeaders(hdrs);
    setHeaderConfidence('manual');
    const cleanHdrs = hdrs.map(h => (String(h).startsWith('__empty_') ? '' : String(h)));
    const m = autoMapColumns(cleanHdrs, targetType);
    setMapping(m);
    setPreviewRows([]);
  };

  const onTargetChange = t => {
    setTargetType(t);
    const cleanHdrs = headers.map(h => (String(h).startsWith('__empty_') ? '' : String(h)));
    setMapping(autoMapColumns(cleanHdrs, t));
    setPreviewRows([]);
  };

  const buildRows = useCallback(() => {
    let rows = gridToBackendRows(grid, headerRowIndex, mapping, targetType);
    const br = defaultBranchcode.trim();
    if (br) {
      rows = rows.map(r => ({
        ...r,
        branchcode: r.branchcode && r.branchcode !== '' ? r.branchcode : br,
      }));
    }
    if (targetType === TARGET_TYPES.attendance) {
      const pf = periodFrom.trim();
      const pt = periodTo.trim();
      rows = rows.map(r => ({
        ...r,
        periodFrom: r.periodFrom && r.periodFrom !== '' ? r.periodFrom : pf,
        periodTo: r.periodTo && r.periodTo !== '' ? r.periodTo : pt,
      }));
    }
    return rows;
  }, [grid, headerRowIndex, mapping, targetType, defaultBranchcode, periodFrom, periodTo]);

  const onPreview = () => {
    try {
      setPreviewRows(buildRows().slice(0, 15));
      setError('');
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const downloadCsv = () => {
    try {
      const rows = buildRows();
      if (!rows.length) {
        setError('No data rows after the header. Check header row and column mapping.');
        return;
      }
      const csv = rowsToCsvString(rows, targetType);
      const base = fileName.replace(/\.[^.]+$/, '') || 'export';
      downloadText(`${base}-${targetType}.csv`, csv);
      setError('');
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const sourceOptions = useMemo(() => {
    return [
      { value: '', label: '— Not mapped —' },
      ...headers.map((h, i) => ({
        value: i,
        label: h.startsWith('__empty_') ? `(Column ${i + 1})` : h || `(Column ${i + 1})`,
      })),
    ];
  }, [headers]);

  const wrap = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 20px 48px',
  };

  const card = {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
  };

  return (
    <div style={wrap}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Excel → SSA Compliance CSV</h1>
        <p style={{ margin: 0, color: '#475569', maxWidth: 720 }}>
          Upload client Excel files, confirm the detected header row, map columns to your backend bulk-upload keys
          (same names as <code>csv().fromFile</code> in <code>client.controller.js</code>), then download CSV.
        </p>
      </header>

      <div style={card}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Excel file</label>
        <input type="file" accept=".xlsx,.xls" onChange={onFile} />
        {fileName ? (
          <p style={{ margin: '12px 0 0', fontSize: 14, color: '#64748b' }}>Loaded: {fileName}</p>
        ) : null}
      </div>

      {sheetNames.length > 0 ? (
        <div style={card}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Worksheet</label>
              <select
                value={selectedSheet}
                onChange={e => onSheetChange(e.target.value)}
                style={{ minWidth: 260, padding: '8px 10px' }}
              >
                {sheetNames.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Header row (0-based)</label>
              <input
                type="number"
                min={0}
                value={headerRowIndex}
                onChange={e => onHeaderRowChange(e.target.value)}
                style={{ width: 100, padding: '8px 10px' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Output template</label>
              <select
                value={targetType}
                onChange={e => onTargetChange(e.target.value)}
                style={{ minWidth: 320, padding: '8px 10px' }}
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
            <p style={{ margin: '14px 0 0', fontSize: 13, color: '#475569' }}>
              Auto-detect: header row <strong>{headerRowIndex}</strong>, template{' '}
              <strong>{TARGET_LABELS[targetType]}</strong>, header confidence{' '}
              <strong>{headerConfidence}</strong>. Column mapping uses highest-confidence matches; adjust dropdowns if
              needed.
            </p>
          ) : null}

          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Default branchcode</label>
              <input
                placeholder="e.g. MAIN (fills branchcode if unmapped)"
                value={defaultBranchcode}
                onChange={e => setDefaultBranchcode(e.target.value)}
                style={{ width: 280, padding: '8px 10px' }}
              />
            </div>
            {targetType === TARGET_TYPES.attendance ? (
              <>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Default periodFrom</label>
                  <input
                    placeholder="DD-MM-YYYY"
                    value={periodFrom}
                    onChange={e => setPeriodFrom(e.target.value)}
                    style={{ width: 140, padding: '8px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Default periodTo</label>
                  <input
                    placeholder="DD-MM-YYYY"
                    value={periodTo}
                    onChange={e => setPeriodTo(e.target.value)}
                    style={{ width: 140, padding: '8px 10px' }}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {headers.length > 0 ? (
        <div style={card}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Column mapping</h2>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Detected headers (normalized: {headers.filter(h => !h.startsWith('__empty_')).map(normalizeHeader).slice(0, 8).join(', ')}
            …)
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px,1fr) minmax(220px,1.2fr)',
              gap: '8px 16px',
              maxHeight: 420,
              overflow: 'auto',
              paddingRight: 8,
            }}
          >
            {fieldList.map(field => (
              <div key={field} style={{ display: 'contents' }}>
                <label style={{ fontSize: 13, alignSelf: 'center', fontFamily: 'ui-monospace, monospace' }}>{field}</label>
                <select
                  value={mapping[field] === '' || mapping[field] == null ? '' : String(mapping[field])}
                  onChange={e => {
                    const v = e.target.value;
                    setMapping(prev => ({ ...prev, [field]: v === '' ? '' : Number(v) }));
                  }}
                  style={{ padding: '6px 8px', fontSize: 13 }}
                >
                  {sourceOptions.map((opt, oi) => (
                    <option key={`${field}-col-${oi}`} value={opt.value === '' ? '' : String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onPreview}
              style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 600 }}
            >
              Preview rows
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              style={{
                padding: '10px 18px',
                cursor: 'pointer',
                fontWeight: 600,
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
              }}
            >
              Download CSV
            </button>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b', maxWidth: 560 }}>
            ID columns (Aadhaar, UAN, PAN, bank account, etc.) are written as Excel-safe text so opening in Excel keeps
            full digits. Bulk-upload APIs strip the Excel wrapper automatically.
          </p>
        </div>
      ) : null}

      {error ? (
        <div style={{ ...card, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>
      ) : null}

      {previewRows.length > 0 ? (
        <div style={card}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Preview (first {previewRows.length} rows)</h2>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
              <thead>
                <tr>
                  {fieldList.slice(0, 12).map(f => (
                    <th
                      key={f}
                      style={{
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderBottom: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
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
                    {fieldList.slice(0, 12).map(f => (
                      <td key={f} style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
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
