import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type {DailyPoint} from '../types';

interface Props {
  data: DailyPoint[];
  height?: number;
}

const CustomTooltip = ({active, payload, label}: any) => {
  if (!active || !payload?.length) return null;
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
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{color: p.fill, marginTop: 2}}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function ScanBarChart({data, height = 220}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{top: 8, right: 8, left: -20, bottom: 0}} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{fill: 'var(--text-muted)', fontSize: 12}}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{fill: 'var(--text-muted)', fontSize: 11}}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
        <Legend
          wrapperStyle={{fontSize: 12, color: 'var(--text-secondary)', paddingTop: 8}}
        />
        <Bar dataKey="scans" name="Scans" fill="#2196f3" radius={[3, 3, 0, 0]} />
        <Bar dataKey="missed" name="Missed" fill="#f44336" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
