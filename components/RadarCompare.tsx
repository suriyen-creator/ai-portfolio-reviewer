'use client';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Report } from '@/lib/types';
import { AREAS, summarize } from '@/lib/score';
import { useAreaLabel } from './ScoreSummary';

export const SIDE_COLORS = ['#6366f1', '#06b6d4'];

export function RadarCompare({ reports, names }: { reports: Report[]; names: string[] }) {
  const label = useAreaLabel();
  const summaries = reports.map(summarize);
  const data = AREAS.map((k) => ({ area: label(k), ...Object.fromEntries(summaries.map((s, i) => [names[i], s.scores[k] ?? 0])) }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
          <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: 'currentColor' }} />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fontSize: 10 }} axisLine={false} />
          {names.map((n, i) => (
            <Radar key={n} name={n} dataKey={n} stroke={SIDE_COLORS[i]} fill={SIDE_COLORS[i]} fillOpacity={0.2} strokeWidth={2} />
          ))}
          <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(1) : v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
