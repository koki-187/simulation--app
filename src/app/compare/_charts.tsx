'use client';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';

type RadarDatum = { subject: string; A: number; B: number };

export function CompareRadarChart({ data, nameA, nameB }: { data: RadarDatum[]; nameA: string; nameB: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Radar name={`A: ${nameA}`} dataKey="A" stroke="#E8632A" fill="#E8632A" fillOpacity={0.25} strokeWidth={2} />
        <Radar name={`B: ${nameB}`} dataKey="B" stroke="#1C2B4A" fill="#1C2B4A" fillOpacity={0.15} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip formatter={(v: unknown) => [`${Math.round(Number(v))}pt`]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
