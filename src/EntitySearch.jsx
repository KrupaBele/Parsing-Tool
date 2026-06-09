import { useCallback, useEffect, useRef, useState } from 'react';
import { searchClients } from './api.js';

/**
 * @param {{
 *   selectedId: string,
 *   selectedLabel?: string,
 *   onSelect: (client: { _id: string, companyName: string, companyCode: string } | null) => void,
 *   onError?: (msg: string) => void,
 * }} props
 */
export default function EntitySearch({
  selectedId,
  selectedLabel = '',
  onSelect,
  onError,
}) {
  const [query, setQuery] = useState(selectedLabel);
  const [options, setOptions] = useState(
    /** @type {{ _id: string, companyName: string, companyCode: string }[]} */ ([]),
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel, selectedId]);

  const runSearch = useCallback(
    async (name) => {
      setLoading(true);
      try {
        const list = await searchClients(name);
        setOptions(list);
        onError?.('');
      } catch (err) {
        setOptions([]);
        onError?.(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onInputChange = (value) => {
    setQuery(value);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(value), 300);
  };

  const onFocus = () => {
    setOpen(true);
    if (!options.length) runSearch(query);
  };

  const pick = (client) => {
    onSelect(client);
    setQuery(client.companyName || '');
    setOpen(false);
  };

  const clear = () => {
    onSelect(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', maxWidth: 420 }}>
      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
        Legal Entity Name
      </label>
      <input
        type="text"
        value={query}
        placeholder="Search clients..."
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onFocus}
        style={{
          width: '100%',
          padding: '8px 10px',
          boxSizing: 'border-box',
        }}
      />
      {selectedId ? (
        <button
          type="button"
          onClick={clear}
          style={{
            marginTop: 6,
            padding: 0,
            border: 'none',
            background: 'none',
            color: '#64748b',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      ) : null}
      {open && (options.length > 0 || loading) ? (
        <ul
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            margin: '4px 0 0',
            padding: 0,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
            maxHeight: 220,
            overflow: 'auto',
          }}
        >
          {loading ? (
            <li style={{ padding: '10px 12px', fontSize: 13, color: '#64748b' }}>
              Loading…
            </li>
          ) : (
            options.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: 'none',
                    background: c._id === selectedId ? '#f0fdfa' : '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {c.companyName}
                  {c.companyCode ? (
                    <span style={{ color: '#64748b' }}> ({c.companyCode})</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
