'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type PrepayDatum = { year: number; base: number; prep: number | null };

export function PrepayBalanceChart({ data }: { data: PrepayDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
            value != null ? `${Number(value).toLocaleString('ja-JP')}万円` : '完済',
            name === 'base' ? '繰上げなし' : '繰上げあり',
          ]}
          labelFormatter={(label) => `${label}年経過`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          formatter={v => v === 'base' ? '繰上げなし' : '繰上げあり'}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="base"
          stroke="#98A2B3"
          strokeWidth={2}
          dot={false}
          name="base"
        />
        <Line
          type="monotone"
          dataKey="prep"
          stroke="#E8632A"
          strokeWidth={2.5}
          dot={false}
          name="prep"
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
