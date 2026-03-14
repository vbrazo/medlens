import {FormEvent, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {api} from '../api/client';
import {useAuth, type UserRole} from '../hooks/useAuth';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function LoginPage() {
  const navigate = useNavigate();
  const {login, setRole} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (USE_MOCK) {
        // In mock mode: accept any non-empty credentials; derive role from email
        await new Promise(r => setTimeout(r, 400));
        const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'patient';
        login('mock-token', role);
      } else {
        const {access_token} = await api.auth.login(email, password);
        // Store token first so the /users/me request is authenticated
        login(access_token, 'patient');
        // Fetch the current user to get their actual role
        try {
          const me = await api.users.me();
          setRole(me.role as UserRole);
        } catch {
          // If /users/me fails we keep the default role; non-critical
        }
      }
      navigate('/overview', {replace: true});
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <span style={styles.logoMed}>Med</span>
          <span style={styles.logoLens}>Lens</span>
        </div>
        <p style={styles.subtitle}>Clinical Dashboard</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@medlens.io"
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
              autoComplete="current-password"
              placeholder="••••••••"
              style={styles.input}
            />
          </label>

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn(loading)}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={styles.footer}>
            Don&apos;t have an account? <Link to="/register" style={styles.link}>Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── styles ────────────────────────────────────────────────── */

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
    padding: 24,
  } satisfies React.CSSProperties,

  card: {
    width: '100%',
    maxWidth: 380,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  } satisfies React.CSSProperties,

  logoRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 0,
  } satisfies React.CSSProperties,

  logoMed: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  } satisfies React.CSSProperties,

  logoLens: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--blue)',
    letterSpacing: '-0.5px',
  } satisfies React.CSSProperties,

  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 24,
  } satisfies React.CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  } satisfies React.CSSProperties,

  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  } satisfies React.CSSProperties,

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
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,

  errorMsg: {
    fontSize: 13,
    color: 'var(--red)',
    background: 'rgba(244,67,54,0.08)',
    border: '1px solid rgba(244,67,54,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    margin: 0,
  } satisfies React.CSSProperties,

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
  } satisfies React.CSSProperties,
  link: {
    color: 'var(--blue)',
    fontWeight: 500,
    textDecoration: 'none',
  } satisfies React.CSSProperties,
};
