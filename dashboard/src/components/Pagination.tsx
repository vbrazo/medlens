interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({page, pages, total, pageSize, onPageChange}: PaginationProps) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  return (
    <div style={styles.row}>
      <span style={styles.info}>
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </span>

      <div style={styles.controls}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={styles.btn(page <= 1)}>
          ← Prev
        </button>

        {/* Page number pills */}
        {Array.from({length: pages}, (_, i) => i + 1)
          .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce<(number | '…')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} style={styles.ellipsis}>
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                style={styles.pill(p === page)}>
                {p}
              </button>
            ),
          )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          style={styles.btn(page >= pages)}>
          Next →
        </button>
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0 4px',
    flexWrap: 'wrap' as const,
    gap: 8,
  } satisfies React.CSSProperties,

  info: {
    fontSize: 13,
    color: 'var(--text-muted)',
  } satisfies React.CSSProperties,

  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } satisfies React.CSSProperties,

  btn: (disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 7,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background 0.15s',
  }),

  pill: (active: boolean): React.CSSProperties => ({
    minWidth: 32,
    padding: '6px 8px',
    borderRadius: 7,
    border: active ? '1px solid var(--blue)' : '1px solid var(--border)',
    background: active ? 'var(--blue)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    transition: 'background 0.15s, color 0.15s',
  }),

  ellipsis: {
    fontSize: 13,
    color: 'var(--text-muted)',
    padding: '0 4px',
  } satisfies React.CSSProperties,
};
