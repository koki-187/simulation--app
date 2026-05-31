'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type BankDatum = { name: string; 総利息: number };

export function BankInterestChart({ data }: { data: BankDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
        <Bar dataKey="総利息" fill="#1C2B4A" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
