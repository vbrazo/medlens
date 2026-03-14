import {useParams, useNavigate} from 'react-router-dom';
import AdherenceChart from '../components/AdherenceChart';
import ScanBarChart from '../components/ScanBarChart';
import StatCard from '../components/StatCard';
import {usePatient} from '../hooks/usePatients';
import {
  usePatientLogs,
  usePatientAdherence,
  usePatientWeekly,
} from '../hooks/usePatientDetail';
import type {MedicationLog} from '../types';

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
      }}>
      <div
        style={{fontSize: 14, fontWeight: 600, marginBottom: 18}}>
        {title}
      </div>
      {children}
    </div>
  );
}

function LogRow({log}: {log: MedicationLog}) {
  const conf = Math.round(log.confidence * 100);
  const confColor =
    conf >= 85 ? 'var(--green)' : conf >= 65 ? 'var(--orange)' : 'var(--red)';

  return (
    <tr>
      <td style={TD}>{log.medication_name}</td>
      <td style={{...TD, color: confColor, fontWeight: 600}}>{conf}%</td>
      <td style={TD}>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: log.verified ? '#1a3a1a' : '#3a1a1a',
            color: log.verified ? 'var(--green)' : 'var(--red)',
          }}>
          {log.verified ? 'Verified' : 'Unverified'}
        </span>
      </td>
      <td style={{...TD, color: 'var(--text-secondary)'}}>
        {new Date(log.timestamp).toLocaleString()}
      </td>
    </tr>
  );
}

const TD: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13,
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

const TH: React.CSSProperties = {
  padding: '9px 14px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
};

export default function PatientDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();

  const patient = usePatient(id);
  const adherence = usePatientAdherence(id);
  const weekly = usePatientWeekly(id);
  const logs = usePatientLogs(id);

  const p = patient.data;
  const a = adherence.data;
  const w = weekly.data ?? [];
  const l = logs.data ?? [];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1000}}>
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            padding: 0,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
          ← Back
        </button>

        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
            {p?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 style={{fontSize: 20, fontWeight: 800}}>{p?.email ?? 'Loading…'}</h1>
            <div style={{color: 'var(--text-muted)', fontSize: 12, marginTop: 2}}>
              ID: {id} · Joined{' '}
              {p ? new Date(p.created_at).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14}}>
        <StatCard
          label="Total Scans"
          value={p?.total_scans ?? '—'}
          accent="var(--blue)"
        />
        <StatCard
          label="Adherence"
          value={p ? `${Math.round(p.adherence_rate * 100)}%` : '—'}
          accent={
            p
              ? p.adherence_rate >= 0.8
                ? 'var(--green)'
                : p.adherence_rate >= 0.6
                  ? 'var(--orange)'
                  : 'var(--red)'
              : 'var(--text-primary)'
          }
        />
        <StatCard
          label="Missed Doses"
          value={a?.missed_doses ?? '—'}
          sub="this week"
          accent="var(--red)"
        />
        <StatCard
          label="Verified"
          value={a ? `${Math.round((a.verified_scans / Math.max(a.total_scans, 1)) * 100)}%` : '—'}
          sub="of scans verified"
          accent="var(--green)"
        />
      </div>

      {/* Charts */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <SectionCard title="Weekly Adherence">
          <AdherenceChart data={w} height={200} />
        </SectionCard>
        <SectionCard title="Daily Scan Activity">
          <ScanBarChart data={w} height={200} />
        </SectionCard>
      </div>

      {/* Scan history */}
      <SectionCard title={`Scan History (${l.length})`}>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={TH}>Medication</th>
                <th style={TH}>Confidence</th>
                <th style={TH}>Status</th>
                <th style={TH}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {l.map(log => (
                <LogRow key={log.id} log={log} />
              ))}
              {!l.length && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      ...TD,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      padding: '32px',
                    }}>
                    No scans recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
