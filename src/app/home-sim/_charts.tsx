'use client';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type BreakdownDatum = { year: number; 残高: number; 累計利息: number };
type PrepayDatum = { year: number; 繰上げなし: number | null; 繰上げあり: number | null };

export function RepaymentBreakdownChart({ data }: { data: BreakdownDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
        <XAxis
          dataKey="year"
          tickFormatter={v => `${v}年`}
          tick={{ fontSize: 11, fill: '#667085' }}
        />
        <YAxis
          tickFormatter={v => `${v}万`}
          tick={{ fontSize: 11, fill: '#667085' }}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString('ja-JP')}万円`,
            name,
          ]}
          labelFormatter={label => `${label}年経過`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="残高"
          stackId="1"
          stroke="#1C2B4A"
          fill="#D3DAE8"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="累計利息"
          stackId="1"
          stroke="#E8632A"
          fill="#FDE0D1"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PrepayEffectChart({ data }: { data: PrepayDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
        <XAxis
          dataKey="year"
          tickFormatter={v => `${v}年`}
          tick={{ fontSize: 10, fill: '#667085' }}
        />
        <YAxis
          tickFormatter={v => `${v}万`}
          tick={{ fontSize: 10, fill: '#667085' }}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [
            value != null ? `${Number(value).toLocaleString('ja-JP')}万円` : '完済',
            name,
          ]}
          labelFormatter={label => `${label}年経過`}
          contentStyle={{ fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="繰上げなし"
          stroke="#98A2B3"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="繰上げあり"
          stroke="#E8632A"
          strokeWidth={2.5}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
