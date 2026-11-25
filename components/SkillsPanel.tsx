'use client';
import { motion } from 'motion/react';
import type { Report } from '@/lib/types';
import { useLang } from '@/lib/i18n';
import { LinkButton, Note, cx } from './ui';

export function sourceMap(report: Report): Record<string, string> {
  const map: Record<string, string> = {};
  report.github.samples.forEach((s) => { map[s.source_id] = s.source_url; });
  report.kaggle.competitions.forEach((r) => { map['kaggle:' + r.url.replace(/\/$/, '').split('/').pop()] = r.url; });
  return map;
}

export function Sources({ ids, map }: { ids: string[]; map: Record<string, string> }) {
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
      {ids.map((id) => map[id]
        ? <a key={id} href={map[id]} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-mute underline decoration-rule underline-offset-4 hover:text-accent hover:decoration-accent">{id}</a>
        : <span key={id} className="font-mono text-[11px] text-mute">{id}</span>)}
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
    <div className="grid gap-8">
      {report.language !== lang && (
        <Note tone="info">{tr('คำรีวิวนี้สร้างในภาษา EN กดวิเคราะห์ผลงานอีกครั้งเพื่อสร้างเป็นภาษาไทย', 'This review was generated in Thai. Run the review again for English feedback.')}</Note>
      )}
      {!!skills.length && (
        <div>
          <div className="mb-3 flex gap-5 font-mono text-[11px] uppercase tracking-caps text-mute">
            <span><span className="mr-1.5 inline-block size-2 bg-ink" />{tr('พบในหลักฐาน', 'Observed')}</span>
            <span><span className="mr-1.5 inline-block size-2 border border-mute" />{tr('ผู้สมัครระบุ', 'Self-reported')}</span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <motion.li key={s.skill} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                title={tr('อ้างอิง: ', 'Sources: ') + s.sources.join(', ')}
                className={cx('px-3 py-1.5 text-sm', s.basis === 'observed' ? 'bg-ink text-paper' : 'border border-rule text-ink')}>
                {s.skill}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
      {!!deep.recommendations?.length && (
        <ol>
          {deep.recommendations.map((rec, i) => (
            <li key={i} className="grid grid-cols-[2.5rem_1fr] border-t border-rule py-4 last:border-b">
              <span className="font-serif text-2xl leading-none text-accent">{i + 1}</span>
              <div className="grid gap-2">
                <p className="leading-relaxed">{rec.text}</p>
                <Sources ids={rec.sources} map={map} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="grid gap-3">
        {!!deep.project_sources?.length && (
          <div className="flex flex-wrap items-baseline gap-2 text-xs text-mute">
            {tr('คะแนนโปรเจกต์ประเมินโดย AI จาก: ', 'Project score estimated by AI from: ')}<Sources ids={deep.project_sources} map={map} />
          </div>
        )}
        {!!Object.keys(map).length && (
          <details className="text-xs">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-caps text-mute hover:text-ink">
              {tr('แหล่งข้อมูลทั้งหมด', 'All sources')} ({Object.keys(map).length})
            </summary>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {Object.entries(map).map(([id, url]) => <LinkButton key={id} href={url}>{id}</LinkButton>)}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
