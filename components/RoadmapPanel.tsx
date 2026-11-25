'use client';
import { Flag, Hammer, Loader2, Map, Sparkles } from 'lucide-react';
import type { Report } from '@/lib/types';
import { useLang, useStatusText } from '@/lib/i18n';
import { Badge, Button, Card, Note, SectionTitle } from './ui';
import { Sources, sourceMap } from './SkillsPanel';

export function RoadmapPanel({ report, loading, onGenerate }: { report: Report; loading?: boolean; onGenerate?: () => void }) {
  const { tr } = useLang();
  const status = useStatusText();
  const rm = report.roadmap;
  if (!rm && !onGenerate) return null;
  const map = sourceMap(report);
  const windows = { '30': tr('30 วันแรก', 'First 30 days'), '60': tr('วันที่ 31–60', 'Days 31–60'), '90': tr('วันที่ 61–90', 'Days 61–90') };

  return (
    <Card>
      <SectionTitle icon={<Map size={18} />} aside={onGenerate && (
        <Button variant={rm?.status === 'ok' ? 'secondary' : 'primary'} onClick={onGenerate} disabled={loading} className="no-print">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {rm?.status === 'ok' ? tr('สร้างใหม่', 'Regenerate') : tr('สร้างแผนพัฒนา', 'Generate plan')}
        </Button>
      )}>
        {tr('แผนพัฒนา 30/60/90 วัน', '30/60/90-day plan')}
      </SectionTitle>
      {!rm && !loading && (
        <p className="text-sm text-slate-500">{tr('ให้ AI วางแผนพัฒนาจากจุดที่ยังขาดในรายงานนี้ ส่งเฉพาะผลสรุป ไม่ส่งข้อความ Resume ต้นฉบับ',
          'Let AI plan next steps from the gaps in this report. Only the processed findings are sent, never the raw resume text.')}</p>
      )}
      {loading && !rm && <div className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}
      {rm && rm.status !== 'ok' && <Badge tone="low">{status(rm.status)}</Badge>}
      {rm?.status === 'ok' && (
        <div className="grid gap-6">
          <ol className="relative grid gap-4 md:grid-cols-3">
            {rm.phases!.map((phase) => (
              <li key={phase.window} className="rounded-xl border border-slate-200 bg-gradient-to-b from-brand-50/60 to-transparent p-4 dark:border-slate-800 dark:from-brand-500/5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
                  <Flag size={15} />{windows[phase.window]}
                </div>
                <ul className="grid gap-3">
                  {phase.goals.map((g, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <div className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />{g.text}</div>
                      <div className="mt-1 pl-3.5"><Sources ids={g.sources.filter((s) => s !== 'findings')} map={map} /></div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {!!rm.project_ideas?.length && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Hammer size={15} className="text-brand-500" />{tr('ไอเดียโปรเจกต์', 'Project ideas')}</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {rm.project_ideas.map((idea) => (
                  <div key={idea.title} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="font-medium text-slate-900 dark:text-white">{idea.title}</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{idea.why}</p>
                    <div className="mt-3 flex flex-wrap gap-1">{idea.skills.map((s) => <Badge key={s} tone="info">{s}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Note>{tr('แผนนี้สร้างโดย AI จากผลสรุปในรายงาน ใช้เป็นแนวทาง ไม่ใช่การประเมินความสามารถ', 'This plan is AI-generated from the report findings. Treat it as guidance, not an assessment of ability.')}</Note>
        </div>
      )}
    </Card>
  );
}
