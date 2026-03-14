interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function StatCard({label, value, sub, accent = 'var(--text-primary)'}: Props) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
      <span style={{fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
        {label}
      </span>
      <span style={{fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1}}>
        {value}
      </span>
      {sub && (
        <span style={{fontSize: 12, color: 'var(--text-muted)'}}>
          {sub}
        </span>
      )}
    </div>
  );
}
