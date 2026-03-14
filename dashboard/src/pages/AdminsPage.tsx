import {useState} from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import PatientModal from '../components/PatientModal';
import {
  useAdminsPaginated,
  useCreateAdmin,
  useDeleteAdmin,
  useUpdateAdmin,
} from '../hooks/useAdmins';
import type {PatientSummary, UserCreatePayload, UserUpdatePayload} from '../types';

const PAGE_SIZE = 20;

export default function AdminsPage() {
  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const {data, isLoading, isError} = useAdminsPaginated(page, PAGE_SIZE);

  // ── Modal (create / edit) ──────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PatientSummary | null>(null);
  const [modalError, setModalError] = useState('');

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<PatientSummary | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useCreateAdmin();
  const updateMutation = useUpdateAdmin();
  const deleteMutation = useDeleteAdmin();

  function openCreate() {
    setEditing(null);
    setModalError('');
    setModalOpen(true);
  }

  function openEdit(admin: PatientSummary) {
    setEditing(admin);
    setModalError('');
    setModalOpen(true);
  }

  async function handleModalSubmit(payload: UserCreatePayload | UserUpdatePayload) {
    setModalError('');
    try {
      if (editing) {
        await updateMutation.mutateAsync({id: editing.id, payload: payload as UserUpdatePayload});
      } else {
        await createMutation.mutateAsync(payload as UserCreatePayload);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setModalError(msg.includes('409') ? 'Email already registered.' : msg);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
  }

  const mutationLoading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <div style={styles.page}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Admins</h1>
            <p style={styles.subtitle}>
              {data ? `${data.total} admin${data.total !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button onClick={openCreate} style={styles.addBtn}>
            + Add Admin
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Admin', 'Member Since', ''].map(col => (
                  <th key={col} style={styles.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRows count={PAGE_SIZE} />}

              {isError && (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>
                    Failed to load admins.
                  </td>
                </tr>
              )}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>
                    No admins yet — click <strong>+ Add Admin</strong> to get started.
                  </td>
                </tr>
              )}

              {data?.items.map(admin => (
                <tr
                  key={admin.id}
                  style={styles.row}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--bg-hover)')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
                  }>
                  {/* Admin column */}
                  <td style={styles.td}>
                    <div style={styles.emailText}>{admin.email}</div>
                    <div style={styles.idText}>
                      <span style={styles.roleBadge}>👑 Admin</span>
                    </div>
                  </td>

                  <td style={styles.tdCenter}>
                    {new Date(admin.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Action buttons */}
                  <td style={styles.tdActions}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openEdit(admin);
                      }}
                      style={styles.actionBtn('edit')}
                      title="Edit admin">
                      ✏
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(admin);
                      }}
                      style={styles.actionBtn('delete')}
                      title="Delete admin">
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {data && data.pages > 0 && (
          <Pagination
            page={page}
            pages={data.pages}
            total={data.total}
            pageSize={PAGE_SIZE}
            onPageChange={p => setPage(p)}
          />
        )}
      </div>

      {/* ── Create / Edit modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <PatientModal
          patient={editing}
          defaultRole="admin"
          loading={mutationLoading}
          error={modalError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete admin?"
          message={`This will permanently remove ${deleteTarget.email} from the admin list. This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRows({count}: {count: number}) {
  return (
    <>
      {Array.from({length: Math.min(count, 8)}, (_, i) => (
        <tr key={i}>
          {Array.from({length: 3}, (__, j) => (
            <td key={j} style={styles.td}>
              <div
                style={{
                  height: 14,
                  width: j === 0 ? '60%' : '30%',
                  background: 'var(--bg-hover)',
                  borderRadius: 4,
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    padding: '32px 36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    maxWidth: 900,
  } satisfies React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  } satisfies React.CSSProperties,

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  } satisfies React.CSSProperties,

  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    margin: '4px 0 0',
  } satisfies React.CSSProperties,

  addBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--blue)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  tableWrap: {
    border: '1px solid var(--border)',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'var(--bg-card)',
  } satisfies React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } satisfies React.CSSProperties,

  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
  } satisfies React.CSSProperties,

  row: {
    transition: 'background 0.12s',
    borderBottom: '1px solid var(--border)',
  } satisfies React.CSSProperties,

  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: 'var(--text-primary)',
    verticalAlign: 'middle' as const,
  } satisfies React.CSSProperties,

  tdCenter: {
    padding: '14px 16px',
    fontSize: 14,
    color: 'var(--text-secondary)',
    verticalAlign: 'middle' as const,
  } satisfies React.CSSProperties,

  tdActions: {
    padding: '14px 16px',
    textAlign: 'right' as const,
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const,
  } satisfies React.CSSProperties,

  emailText: {
    fontWeight: 500,
    color: 'var(--text-primary)',
  } satisfies React.CSSProperties,

  idText: {
    marginTop: 2,
  } satisfies React.CSSProperties,

  roleBadge: {
    fontSize: 11,
    color: 'var(--blue)',
    fontWeight: 600,
  } satisfies React.CSSProperties,

  emptyCell: {
    padding: '48px 24px',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    fontSize: 14,
  } satisfies React.CSSProperties,

  actionBtn: (type: 'edit' | 'delete'): React.CSSProperties => ({
    padding: '5px 9px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: type === 'delete' ? 'var(--red)' : 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    marginLeft: 6,
    transition: 'background 0.12s',
  }),
};
