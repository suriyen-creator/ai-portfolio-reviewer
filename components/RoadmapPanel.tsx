'use client';
import { ViewTransition } from 'react';
import type { Report } from '@/lib/types';
import { useLang, useStatusText } from '@/lib/i18n';
import { Badge, Button, Note, Reveal, Tag } from './ui';
import { Sources, sourceMap } from './SkillsPanel';
import { statusTone } from './EvidenceStatus';

export function RoadmapPanel({ report, loading, onGenerate }: { report: Report; loading?: boolean; onGenerate?: () => void }) {
  const { tr } = useLang();
  const status = useStatusText();
  const rm = report.roadmap;
  const map = sourceMap(report);
  const windows = { '30': tr('วันที่ 1–30', 'Days 1–30'), '60': tr('วันที่ 31–60', 'Days 31–60'), '90': tr('วันที่ 61–90', 'Days 61–90') };

  return (
    <div>
      {!rm && !loading && (
        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-lg text-mute">{tr('ให้ AI วางแผนพัฒนาจากจุดที่ยังขาดในรายงานนี้ ส่งเฉพาะผลสรุป ไม่ส่งข้อความ Resume ต้นฉบับ',
            'Let AI plan next steps from the gaps in this report. Only the processed findings are sent, never the raw resume text.')}</p>
          {onGenerate && <Button onClick={onGenerate} className="no-print">{tr('สร้างแผนพัฒนา', 'Generate plan')} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></Button>}
        </div>
      )}
      {loading && (
        <ViewTransition exit="slide-down" default="none">
          <div className="grid gap-px md:grid-cols-3" aria-busy>
            {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse bg-paper-2" style={{ animationDelay: `${i * 120}ms` }} />)}
          </div>
        </ViewTransition>
      )}
      {rm && !loading && rm.status !== 'ok' && (
        <div className="flex flex-wrap items-center gap-6">
          <Badge tone={statusTone(rm.status)}>{status(rm.status)}</Badge>
          {onGenerate && <Button variant="ghost" onClick={onGenerate} className="no-print">{tr('ลองอีกครั้ง', 'Try again')}</Button>}
        </div>
      )}
      {rm?.status === 'ok' && !loading && (
        <ViewTransition enter="slide-up" default="none">
          <div className="grid gap-10">
            <ol className="grid border-t border-ink md:grid-cols-3">
              {rm.phases!.map((phase, pi) => (
                <li key={phase.window} className="border-b border-rule py-5 md:border-b-0 md:border-l md:px-5 md:first:border-l-0 md:first:pl-0">
                  <div className="font-mono text-[11px] uppercase tracking-caps text-accent">{windows[phase.window]}</div>
                  <ul className="mt-4 grid gap-4">
                    {phase.goals.map((g, i) => (
                      <Reveal key={i} delay={pi * 0.08 + i * 0.04}>
                        <li className="text-sm leading-relaxed">
                          {g.text}
                          {g.sources.some((s) => s !== 'findings') && <div className="mt-1"><Sources ids={g.sources.filter((s) => s !== 'findings')} map={map} /></div>}
                        </li>
                      </Reveal>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            {!!rm.project_ideas?.length && (
              <div>
                <div className="mb-3 font-mono text-[11px] uppercase tracking-caps text-mute">{tr('ไอเดียโปรเจกต์', 'Project ideas')}</div>
                <div className="grid gap-px bg-rule md:grid-cols-3">
                  {rm.project_ideas.map((idea, i) => (
                    <Reveal key={idea.title} delay={i * 0.06} className="bg-paper p-5 md:first:pl-0">
                      <h4 className="font-serif text-2xl leading-tight">{idea.title}</h4>
                      <p className="mt-2 text-sm text-mute">{idea.why}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">{idea.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <Note>{tr('แผนนี้สร้างโดย AI จากผลสรุปในรายงาน ใช้เป็นแนวทาง ไม่ใช่การประเมินความสามารถ', 'This plan is AI-generated from the report findings. Treat it as guidance, not an assessment of ability.')}</Note>
              {onGenerate && <Button variant="ghost" onClick={onGenerate} className="no-print text-xs">{tr('สร้างใหม่', 'Regenerate')}</Button>}
            </div>
          </div>
        </ViewTransition>
      )}
    </div>
  );
}
