import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type {DailyPoint} from '../types';

interface Props {
  data: DailyPoint[];
  height?: number;
}

const CustomTooltip = ({active, payload, label}: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DailyPoint;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
      }}>
      <div style={{fontWeight: 700, marginBottom: 6}}>{label}</div>
      <div style={{color: 'var(--blue)'}}>
        Adherence: {Math.round(d.adherence * 100)}%
      </div>
      <div style={{color: 'var(--text-secondary)', marginTop: 2}}>
        Scans: {d.scans}
      </div>
      <div style={{color: 'var(--red)', marginTop: 2}}>Missed: {d.missed}</div>
    </div>
  );
};

export default function AdherenceChart({data, height = 220}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{top: 8, right: 8, left: -20, bottom: 0}}>
        <defs>
          <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2196f3" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#2196f3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{fill: 'var(--text-muted)', fontSize: 12}}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={v => `${Math.round(v * 100)}%`}
          tick={{fill: 'var(--text-muted)', fontSize: 11}}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{stroke: 'var(--border)'}} />
        <Area
          type="monotone"
          dataKey="adherence"
          stroke="#2196f3"
          strokeWidth={2}
          fill="url(#adherenceGrad)"
          dot={false}
          activeDot={{r: 4, fill: '#2196f3', stroke: 'var(--bg-card)', strokeWidth: 2}}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
