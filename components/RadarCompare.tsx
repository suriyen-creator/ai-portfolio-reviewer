'use client';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Report } from '@/lib/types';
import { AREAS, summarize } from '@/lib/score';
import { useAreaLabel } from './ScoreSummary';

/** Side A is ink, side B is the accent. Colors come from CSS variables so dark mode follows. */
export const SIDE_COLORS = ['var(--ink)', 'var(--accent)'];

export function RadarCompare({ reports, names }: { reports: Report[]; names: string[] }) {
  const label = useAreaLabel();
  const summaries = reports.map(summarize);
  const data = AREAS.map((k) => ({ area: label(k), ...Object.fromEntries(summaries.map((s, i) => [names[i], s.scores[k] ?? 0])) }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--rule)" />
          <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: 'var(--ink)' }} />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fontSize: 10, fill: 'var(--mute)' }} axisLine={false} />
          {names.map((n, i) => (
            <Radar key={n} name={n} dataKey={n} stroke={SIDE_COLORS[i]} fill={SIDE_COLORS[i]} fillOpacity={i === 0 ? 0.08 : 0.14} strokeWidth={1.5}
              animationDuration={900} />
          ))}
          <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(1) : v)}
            contentStyle={{ background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 0, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
