'use client';
import { Eye, Lightbulb, MessageSquareQuote } from 'lucide-react';
import type { Report } from '@/lib/types';
import { useLang } from '@/lib/i18n';
import { Card, LinkButton, Note, SectionTitle, cx } from './ui';

export function sourceMap(report: Report): Record<string, string> {
  const map: Record<string, string> = {};
  report.github.samples.forEach((s) => { map[s.source_id] = s.source_url; });
  report.kaggle.competitions.forEach((r) => { map['kaggle:' + r.url.replace(/\/$/, '').split('/').pop()] = r.url; });
  return map;
}

export function Sources({ ids, map }: { ids: string[]; map: Record<string, string> }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {ids.map((id) => map[id]
        ? <a key={id} href={map[id]} target="_blank" rel="noopener noreferrer" className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-brand-100 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-400">{id}</a>
        : <span key={id} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800">{id}</span>)}
    </span>
  );
}

export function SkillsPanel({ report }: { report: Report }) {
  const { tr, lang } = useLang();
  const deep = report.deep;
  if (deep.status !== 'ok') return null;
  const map = sourceMap(report);
  const skills = deep.inferred_skills ?? [];
  return (
    <Card>
      <SectionTitle icon={<Lightbulb size={18} />}>{tr('ทักษะและสิ่งที่ควรตรวจต่อ', 'Skills and follow-up checks')}</SectionTitle>
      {report.language !== lang && (
        <div className="mb-4"><Note tone="info">{tr('คำรีวิวนี้สร้างในภาษา EN กดวิเคราะห์ผลงานอีกครั้งเพื่อสร้างเป็นภาษาไทย',
          'This review was generated in Thai. Run the review again for English feedback.')}</Note></div>
      )}
      {!!skills.length && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />{tr('พบในหลักฐาน', 'Observed in evidence')}</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-400" />{tr('ผู้สมัครระบุ', 'Self-reported')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.skill} title={tr('อ้างอิง: ', 'Sources: ') + s.sources.join(', ')}
                className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm',
                  s.basis === 'observed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300')}>
                {s.basis === 'observed' ? <Eye size={13} /> : <MessageSquareQuote size={13} />}{s.skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {!!deep.recommendations?.length && (
        <ol className="grid gap-3">
          {deep.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">{i + 1}</span>
              <div className="grid gap-1.5">
                <p className="text-sm leading-relaxed">{rec.text}</p>
                <div className="text-xs text-slate-500">{tr('อ้างอิง: ', 'Sources: ')}<Sources ids={rec.sources} map={map} /></div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {!!deep.project_sources?.length && (
        <div className="mt-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {tr('คะแนนโปรเจกต์ประเมินโดย AI จาก: ', 'Project score estimated by AI from: ')}<Sources ids={deep.project_sources} map={map} />
        </div>
      )}
      {!!Object.keys(map).length && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(map).map(([id, url]) => <LinkButton key={id} href={url}>{id}</LinkButton>)}
        </div>
      )}
    </Card>
  );
}
