'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

type ChartDatum = {
  name: string;
  月々返済額: number;
  審査金利月返済: number;
  bankId: string;
};

export function LoanCompareBarChart({
  data,
  colors,
  slotColorMap,
  mode,
}: {
  data: ChartDatum[];
  colors: readonly string[];
  slotColorMap: Record<string, number>;
  mode: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(Number(v) / 10000)}万`} />
        <Tooltip
          formatter={(v: unknown) => [`${Number(v).toLocaleString()}円`]}
        />
        <Legend />
        <Bar dataKey="月々返済額" radius={[4, 4, 0, 0]}>
          {data.map(entry => (
            <Cell
              key={`cell-actual-${entry.bankId}`}
              fill={colors[slotColorMap[entry.bankId] ?? 0] ?? '#1C2B4A'}
            />
          ))}
        </Bar>
        {mode === 'home' && (
          <Bar dataKey="審査金利月返済" radius={[4, 4, 0, 0]} opacity={0.45}>
            {data.map(entry => (
              <Cell
                key={`cell-audit-${entry.bankId}`}
                fill={colors[slotColorMap[entry.bankId] ?? 0] ?? '#1C2B4A'}
              />
            ))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
