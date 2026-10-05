import { useState } from 'react';
import { login, logout } from './api.js';
import { getStoredUser, getToken } from './auth.js';

/**
 * @param {{
 *   onAuthChange: () => void,
 * }} props
 */
export default function LoginBar({ onAuthChange }) {
  const user = getStoredUser();
  const loggedIn = Boolean(getToken());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      setPassword('');
      onAuthChange();
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  if (loggedIn) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: '10px 14px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        <span>
          Signed in
          {user?.email || user?.name ? ` as ${user.email || user.name}` : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            logout();
            onAuthChange();
          }}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            background: '#fff',
          }}
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginBottom: 16,
        padding: '12px 14px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 13, marginRight: 4 }}>
        Log in to search clients
      </span>
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '8px 10px', minWidth: 200 }}
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '8px 10px', minWidth: 160 }}
      />
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: '8px 14px',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          background: '#0f766e',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
        }}
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {error ? (
        <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>
      ) : null}
    </form>
  );
}
