import {FormEvent, useEffect, useState} from 'react';
import type {PatientSummary, UserCreatePayload, UserUpdatePayload} from '../types';

interface PatientModalProps {
  /** Null = create mode; non-null = edit mode with pre-filled data. */
  patient: PatientSummary | null;
  /** Role pre-selected when creating a new user (default: 'patient'). */
  defaultRole?: 'patient' | 'admin';
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (payload: UserCreatePayload | UserUpdatePayload) => void;
}

export default function PatientModal({
  patient,
  defaultRole = 'patient',
  loading = false,
  error,
  onClose,
  onSubmit,
}: PatientModalProps) {
  const isEdit = patient !== null;

  const [email, setEmail] = useState(patient?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'admin'>(
    (patient?.role as 'patient' | 'admin') ?? defaultRole,
  );
  const [resetPw, setResetPw] = useState(false);

  // Keep fields in sync if the modal is reused for a different patient
  useEffect(() => {
    setEmail(patient?.email ?? '');
    setRole((patient?.role as 'patient' | 'admin') ?? defaultRole);
    setPassword('');
    setResetPw(false);
  }, [patient?.id, defaultRole]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEdit) {
      const payload: UserUpdatePayload = {};
      if (email !== patient.email) payload.email = email;
      if (role !== patient.role) payload.role = role;
      if (resetPw && password) payload.password = password;
      onSubmit(payload);
    } else {
      onSubmit({email, password, role} as UserCreatePayload);
    }
  }

  const showPassword = !isEdit || resetPw;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>{isEdit ? 'Edit Patient' : 'Add Patient'}</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="patient@clinic.example"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Role
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'patient' | 'admin')}
              style={styles.select}>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {/* Password field — always shown for create, toggle for edit */}
          {isEdit && (
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={resetPw}
                onChange={e => setResetPw(e.target.checked)}
              />
              Reset password
            </label>
          )}

          {showPassword && (
            <label style={styles.label}>
              {isEdit ? 'New Password' : 'Password'}
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required={!isEdit}
                minLength={8}
                placeholder="Min. 8 characters"
                style={styles.input}
              />
            </label>
          )}

          {error && <p style={styles.errorMsg}>{error}</p>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} disabled={loading} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn(loading)}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  } satisfies React.CSSProperties,

  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '28px',
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  } satisfies React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies React.CSSProperties,

  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  } satisfies React.CSSProperties,

  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
  } satisfies React.CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
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
    width: '100%',
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,

  select: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  } satisfies React.CSSProperties,

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
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

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  } satisfies React.CSSProperties,

  cancelBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  } satisfies React.CSSProperties,

  submitBtn: (loading: boolean): React.CSSProperties => ({
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: loading ? 'var(--bg-hover)' : 'var(--blue)',
    color: loading ? 'var(--text-muted)' : '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  }),
};
