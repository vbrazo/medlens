import StatCard from '../components/StatCard';
import AdherenceChart from '../components/AdherenceChart';
import ScanBarChart from '../components/ScanBarChart';
import PatientTable from '../components/PatientTable';
import {useOverviewStats, useWeeklyTrend} from '../hooks/useOverview';
import {usePatients} from '../hooks/usePatients';

function SectionTitle({children}: {children: React.ReactNode}) {
  return (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 16,
      }}>
      {children}
    </h2>
  );
}

function ChartCard({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
      }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function OverviewPage() {
  const stats = useOverviewStats();
  const weekly = useWeeklyTrend();
  const patients = usePatients();

  const s = stats.data;
  const w = weekly.data ?? [];
  const p = patients.data ?? [];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1100}}>
      {/* Header */}
      <div>
        <h1 style={{fontSize: 24, fontWeight: 800}}>Overview</h1>
        <p style={{color: 'var(--text-secondary)', marginTop: 4}}>
          Medication adherence across all patients
        </p>
      </div>

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
        <StatCard
          label="Total Patients"
          value={s?.total_patients ?? '—'}
          sub="active accounts"
        />
        <StatCard
          label="Total Scans"
          value={s?.total_scans.toLocaleString() ?? '—'}
          sub="all time"
          accent="var(--blue)"
        />
        <StatCard
          label="Avg Adherence"
          value={s ? `${Math.round(s.avg_adherence * 100)}%` : '—'}
          sub="across all patients"
          accent={
            s
              ? s.avg_adherence >= 0.8
                ? 'var(--green)'
                : s.avg_adherence >= 0.6
                  ? 'var(--orange)'
                  : 'var(--red)'
              : 'var(--text-primary)'
          }
        />
        <StatCard
          label="Missed Doses"
          value={s?.total_missed ?? '—'}
          sub="this week"
          accent="var(--red)"
        />
      </div>

      {/* Charts */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <ChartCard title="Weekly Adherence Rate">
          {weekly.isLoading ? (
            <Skeleton height={220} />
          ) : (
            <AdherenceChart data={w} />
          )}
        </ChartCard>

        <ChartCard title="Scans vs Missed Doses">
          {weekly.isLoading ? (
            <Skeleton height={220} />
          ) : (
            <ScanBarChart data={w} />
          )}
        </ChartCard>
      </div>

      {/* Patient table */}
      <div>
        <SectionTitle>Patients</SectionTitle>
        {patients.isLoading ? (
          <Skeleton height={300} />
        ) : (
          <PatientTable patients={p} />
        )}
      </div>
    </div>
  );
}

function Skeleton({height}: {height: number}) {
  return (
    <div
      style={{
        height,
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-card) 50%, var(--bg-hover) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}
