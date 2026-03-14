import React, {useState} from 'react';
import type {FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {api} from '../api/client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'admin'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400));
        navigate('/login', {replace: true});
        return;
      }
      await api.auth.register(email, password, role);
      navigate('/login', {replace: true});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith('409')) setError('Email already registered.');
      else setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoMed}>Med</span>
          <span style={styles.logoLens}>Lens</span>
        </div>
        <p style={styles.subtitle}>Create account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Role
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'patient' | 'admin')}
              style={styles.select}
            >
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn(loading)}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties | ((loading: boolean) => React.CSSProperties)> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 0,
  },
  logoMed: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  logoLens: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--blue)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  errorMsg: {
    fontSize: 13,
    color: 'var(--red)',
    background: 'rgba(244,67,54,0.08)',
    border: '1px solid rgba(244,67,54,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    margin: 0,
  },
  btn: (loading: boolean): React.CSSProperties => ({
    marginTop: 4,
    padding: '12px',
    borderRadius: 8,
    background: loading ? 'var(--bg-hover)' : 'var(--blue)',
    color: loading ? 'var(--text-muted)' : '#fff',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s, color 0.15s',
  }),
  footer: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 20,
    marginBottom: 0,
  },
  link: {
    color: 'var(--blue)',
    fontWeight: 500,
    textDecoration: 'none',
  },
};
