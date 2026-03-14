import {useNavigate} from 'react-router-dom';
import type {PatientSummary} from '../types';

interface Props {
  patients: PatientSummary[];
}

function AdherencePill({rate}: {rate: number}) {
  const pct = Math.round(rate * 100);
  const color =
    pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--red)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color,
      }}>
      <span
        style={{
          width: 60,
          height: 4,
          borderRadius: 2,
          background: 'var(--border)',
          overflow: 'hidden',
          display: 'inline-block',
        }}>
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            background: color,
          }}
        />
      </span>
      {pct}%
    </span>
  );
}

const TH: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border)',
};

const TD: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: 13,
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

export default function PatientTable({patients}: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={TH}>Patient</th>
            <th style={TH}>Total Scans</th>
            <th style={TH}>Adherence</th>
            <th style={TH}>Missed Doses</th>
            <th style={TH}>Last Scan</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              style={{cursor: 'pointer'}}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLTableRowElement).style.background =
                  'var(--bg-hover)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
              }>
              <td style={TD}>
                <div style={{fontWeight: 600}}>{p.email}</div>
                <div style={{color: 'var(--text-muted)', fontSize: 12, marginTop: 2}}>
                  {p.id}
                </div>
              </td>
              <td style={TD}>{p.total_scans}</td>
              <td style={TD}>
                <AdherencePill rate={p.adherence_rate} />
              </td>
              <td style={{...TD, color: p.missed_doses > 5 ? 'var(--red)' : 'var(--text-primary)'}}>
                {p.missed_doses}
              </td>
              <td style={{...TD, color: 'var(--text-secondary)'}}>
                {p.last_scan ? new Date(p.last_scan).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
