'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

type CfDatum = {
  year: string;
  '運営CF': number;
  '税引後CF': number;
  '累計CF': number;
};

export function CFBarChart({ data }: { data: CfDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="year" tick={{ fontSize: 13 }} />
        <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => v.toLocaleString('ja-JP')} width={60} />
        <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#667085" strokeDasharray="3 3" />
        <Bar dataKey="運営CF" fill="#1C2B4A" radius={[2,2,0,0]} />
        <Bar dataKey="税引後CF" fill="#E8632A" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
