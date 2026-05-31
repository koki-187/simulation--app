'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

type CfDatum = {
  year: string;
  'A 税引後CF': number;
  'B 税引後CF': number;
  'A 累計CF': number;
  'B 累計CF': number;
};

export function CFBarChart({ data }: { data: CfDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="year" tick={{ fontSize: 13 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `${v.toLocaleString('ja-JP')}万円` : `${v}万円`]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="A 税引後CF" fill="#E8632A" radius={[2,2,0,0]} />
        <Bar dataKey="B 税引後CF" fill="#F5A623" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CumAreaChart({ data }: { data: CfDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
        <XAxis dataKey="year" tick={{ fontSize: 13 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `${v.toLocaleString('ja-JP')}万円` : `${v}万円`]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="A 累計CF" stroke="#1C2B4A" fill="#EEF1F6" strokeWidth={2} />
        <Area type="monotone" dataKey="B 累計CF" stroke="#E8632A" fill="#FFF5F0" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
