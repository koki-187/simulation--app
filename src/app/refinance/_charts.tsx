'use client';
import { yenM } from '@/lib/format';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area, Legend,
} from 'recharts';

export function RefinanceSavingsChart({
  data,
  scenarioDelta,
}: {
  data: Record<string, number>[];
  scenarioDelta: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="month" tick={{ fontSize: 9 }}
          tickFormatter={v => `${(Number(v) / 12).toFixed(0)}年`}
          interval={Math.floor(data.length / 6)} />
        <YAxis tick={{ fontSize: 9 }}
          tickFormatter={v => `${Math.round(Number(v) / 10000)}万`} />
        <Tooltip
          formatter={(v: unknown) => [`${yenM(v as number)}`]}
          labelFormatter={v => `${(Number(v) / 12).toFixed(1)}年後`}
        />
        <ReferenceLine y={0} stroke="#E74C3C" strokeDasharray="4 4" label={{ value: '損益分岐', position: 'right', fontSize: 9 }} />
        <Area type="monotone" dataKey="累計節約額（ベース）"
          stroke="#27AE60" fill="#E8F8EF" strokeWidth={2} />
        {scenarioDelta > 0 && (
          <Area type="monotone" dataKey="累計節約額（金利上昇シナリオ）"
            stroke="#F39C12" fill="#FEF9E7" strokeWidth={2} strokeDasharray="4 2" />
        )}
        {scenarioDelta > 0 && <Legend wrapperStyle={{ fontSize: 9 }} />}
      </AreaChart>
    </ResponsiveContainer>
  );
}
