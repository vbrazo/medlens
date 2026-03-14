interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()} role="dialog" aria-modal>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>

        <div style={styles.actions}>
          <button onClick={onCancel} disabled={loading} style={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={styles.confirmBtn(loading)}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
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
    zIndex: 200,
  } satisfies React.CSSProperties,

  dialog: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '28px 28px 24px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } satisfies React.CSSProperties,

  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  } satisfies React.CSSProperties,

  message: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.5,
  } satisfies React.CSSProperties,

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  } satisfies React.CSSProperties,

  cancelBtn: {
    padding: '9px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  } satisfies React.CSSProperties,

  confirmBtn: (loading: boolean): React.CSSProperties => ({
    padding: '9px 16px',
    borderRadius: 8,
    border: 'none',
    background: loading ? 'var(--bg-hover)' : 'var(--red)',
    color: loading ? 'var(--text-muted)' : '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  }),
};
