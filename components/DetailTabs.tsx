'use client';
import { startTransition, useState, ViewTransition } from 'react';
import type { Base, Report } from '@/lib/types';
import { LIMITS, useLang, useStatusText } from '@/lib/i18n';
import { validScore } from '@/lib/score';
import { Badge, Github, LinkButton, Note, NumberTicker, Tabs, Tag, cx } from './ui';
import { statusTone } from './EvidenceStatus';

function Check({ value }: { value: boolean | null }) {
  const { tr } = useLang();
  return value === true ? <span className="text-good">{tr('มี', 'yes')}</span>
    : value === false ? <span className="text-mute">{tr('ไม่มี', 'no')}</span>
    : <span className="text-mute/60">{tr('ยืนยันไม่ได้', 'n/a')}</span>;
}

function SourceFooter({ data }: { data: Base }) {
  const { tr, trp } = useLang();
  return (
    <div className="mt-6 grid gap-2 border-t border-rule pt-4">
      <div className="flex flex-wrap items-baseline gap-4">
        {data.source_url && <LinkButton href={data.source_url}>{tr('เปิดแหล่งข้อมูล', 'Open source')}</LinkButton>}
        {data.fetched_at && <span className="font-mono text-[11px] text-mute">{tr('ตรวจเมื่อ ', 'Checked ')}{new Date(data.fetched_at).toLocaleString()}</span>}
      </div>
      {data.limitations?.filter((c) => LIMITS[c]).map((c) => <Note key={c}>{trp(LIMITS[c])}</Note>)}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string | undefined | null }) {
  return (
    <div className="border-l border-rule pl-4 first:border-l-0 first:pl-0">
      <div className="font-mono text-[11px] uppercase tracking-caps text-mute">{label}</div>
      <div className="mt-1 font-serif text-4xl leading-none">
        {typeof value === 'number' ? <NumberTicker value={value} /> : (value ?? '—')}
      </div>
    </div>
  );
}

function GithubPanel({ report }: { report: Report }) {
  const { tr } = useLang();
  const status = useStatusText();
  const git = report.github;
  return (
    <div>
      <Badge tone={statusTone(git.status)}>{status(git.status)}</Badge>
      {git.score !== null && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            <Stat label={tr('Repo ที่อ่านได้', 'Repos sampled')} value={git.repos_count} />
            <Stat label={tr('อัปเดต 90 วัน', 'Updated 90d')} value={git.active_projects} />
            <Stat label="Stars" value={git.stars} />
            <Stat label={tr('คะแนน', 'Score')} value={git.score} />
          </div>
          {!!git.top_languages?.length && (
            <div className="mt-6 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[11px] uppercase tracking-caps text-mute">{tr('ภาษา', 'Languages')}</span>
              {git.top_languages.map(([name]) => <Tag key={name}>{name}</Tag>)}
            </div>
          )}
          <Note className="mt-2">{tr('วันที่อัปเดต repo ไม่ใช่จำนวน commit หรือหลักฐานความสม่ำเสมอในการเขียนโค้ด',
            'Repository update dates are not commit counts or evidence of coding consistency.')}</Note>

          {!!git.samples.length && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-ink text-left font-mono text-[11px] uppercase tracking-caps text-mute">
                    <th className="pb-2 font-normal">Repository</th>
                    <th className="pb-2 font-normal">README</th>
                    <th className="pb-2 font-normal">CI</th>
                    <th className="pb-2 font-normal">Deploy</th>
                    <th className="pb-2 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {git.samples.map((p) => (
                    <tr key={p.name} className="group border-b border-rule align-top">
                      <td className="py-3 pr-4">
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium transition-colors group-hover:text-accent">
                          <Github size={13} className="text-mute" />{p.name}
                        </a>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {p.language && <Tag>{p.language}</Tag>}
                          {p.fork && <Tag>fork</Tag>}
                        </div>
                        {p.description && <p className="mt-1 max-w-md text-xs text-mute">{p.description}</p>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs"><Check value={p.readme} /></td>
                      <td className="py-3 pr-4 font-mono text-xs"><Check value={p.cicd} /></td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {p.deployment ? <span title={tr('ตั้งค่า homepage ไว้ แต่ยังไม่ได้ตรวจว่าเปิดใช้งานได้', 'Homepage configured, availability unverified')}>{tr('ตั้งค่าไว้*', 'set*')}</span> : <span className="text-mute/60">{tr('ยืนยันไม่ได้', 'n/a')}</span>}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-3">
                          {p.readme && <LinkButton href={p.readme_url}>README</LinkButton>}
                          {p.cicd && <LinkButton href={p.workflow_url}>workflows</LinkButton>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 grid gap-1">
                <Note>{tr('พบ workflow ไม่ได้ยืนยันว่ารันทดสอบผ่าน', 'A workflow file does not establish that its checks pass.')}</Note>
                <Note>{tr('* ตั้งค่า homepage ไว้ แต่ยังไม่ได้ตรวจว่าเปิดใช้งานได้ · การใช้ API ยังยืนยันไม่ได้จากข้อมูลที่อ่าน', '* Homepage configured, availability unverified · API usage is unverified from inspected evidence')}</Note>
              </div>
            </div>
          )}
        </>
      )}
      <SourceFooter data={git} />
    </div>
  );
}

const medalColor = { gold: 'bg-[#c9a227]', silver: 'bg-[#a3a39b]', bronze: 'bg-[#a8642c]' };

function KagglePanel({ report }: { report: Report }) {
  const { tr, trp } = useLang();
  const status = useStatusText();
  const k = report.kaggle;
  const scored = (r: (typeof k.competitions)[number]) =>
    r.completed && r.final && Number.isInteger(r.rank) && Number.isInteger(r.teams) && r.teams! >= 2 && r.rank! >= 1 && r.rank! <= r.teams!;
  const pct = (r: (typeof k.competitions)[number]) => (scored(r) ? (100 * (r.teams! - r.rank!)) / (r.teams! - 1) : null);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-6">
        <Badge tone={statusTone(k.status)}>{status(k.status)}</Badge>
        {validScore(k.score) && <span className="font-mono text-xs text-mute">{tr('คะแนน Kaggle ', 'Kaggle score ')}<span className="text-ink">{k.score.toFixed(1)}</span></span>}
        {!!k.competitions.length && <span className="font-mono text-xs text-mute">{k.competitions.length} {tr('รายการ', 'results')}</span>}
      </div>
      <Note className="mt-2">{tr('ข้อมูลด้านล่างเป็นผลของทีม ไม่ได้ยืนยันสัดส่วนงานที่ผู้สมัครทำ', 'Placements are team results and do not establish the candidate’s individual contribution.')}</Note>
      {!!k.competitions.length && (
        <div className="mt-6 max-h-[460px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-paper">
              <tr className="border-b border-ink text-left font-mono text-[11px] uppercase tracking-caps text-mute">
                <th className="pb-2 font-normal">{tr('การแข่งขัน', 'Competition')}</th>
                <th className="pb-2 text-right font-normal">{tr('อันดับ', 'Rank')}</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">{tr('ปิดรับ', 'Deadline')}</th>
                <th className="pb-2 text-right font-normal">{tr('เปอร์เซ็นไทล์', 'Pctl')}</th>
              </tr>
            </thead>
            <tbody>
              {k.competitions.map((r) => {
                const p = pct(r);
                return (
                  <tr key={r.url} className="group border-b border-rule">
                    <td className="py-2.5 pr-4">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-2 transition-colors group-hover:text-accent">
                        {r.medal && <span className={cx('inline-block size-2 rounded-full', medalColor[r.medal])} aria-label={r.medal} title={r.medal} />}
                        {r.title}
                      </a>
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs tabular-nums">{r.rank ?? '—'}<span className="text-mute">/{r.teams ?? '—'}</span></td>
                    <td className="hidden py-2.5 pl-4 text-right font-mono text-xs text-mute sm:table-cell">{r.date ? new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—'}</td>
                    <td className="py-2.5 pl-4 text-right font-mono text-xs tabular-nums">{p === null ? <span className="text-mute/60">{tr('ยืนยันไม่ได้', 'n/a')}</span> : p.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Note className="mt-3">{tr('สูตร Kaggle: เฉลี่ย 3 ผลที่ดีที่สุดของ 100 × (จำนวนทีม − อันดับ) ÷ (จำนวนทีม − 1) หรือใช้ทั้งหมดหากมีน้อยกว่า 3 ผล เหรียญไม่บวกซ้ำ สูตรนี้ไม่ใช่คะแนนทางการ Kaggle',
        'Kaggle score: mean of the best three results using 100 × (teams − rank) ÷ (teams − 1), or all eligible results if fewer than three. Medals add no extra points. This is not the official Kaggle points formula.')}</Note>
      {!['not_provided', 'ok', 'partial', 'empty'].includes(k.status) && <Note className="mt-1">{trp(LIMITS.kaggle_website_api)}</Note>}
      <SourceFooter data={k} />
    </div>
  );
}

function ResumePanel({ report }: { report: Report }) {
  const { tr } = useLang();
  const status = useStatusText();
  const r = report.resume;
  const clarity = { High: tr('ชัดเจน', 'High'), Medium: tr('ปานกลาง', 'Medium'), Low: tr('ควรปรับปรุง', 'Low') };
  return (
    <div>
      <Badge tone={statusTone(r.status)}>{status(r.status)}</Badge>
      {r.status === 'ok' && (
        <>
          <div className="mt-6 grid grid-cols-3">
            <Stat label={tr('ความครบถ้วน', 'Completeness')} value={r.score} />
            <Stat label={tr('โปรเจกต์ที่ระบุ', 'Projects listed')} value={r.project_count} />
            <Stat label={tr('ความชัดเจน', 'Clarity')} value={r.clarity_level ? clarity[r.clarity_level] : '—'} />
          </div>
          {!!r.weaknesses?.length && (
            <div className="mt-8">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-caps text-mute">{tr('จุดที่ควรเพิ่ม', 'Gaps to address')}</div>
              <ol>
                {r.weaknesses.map((w, i) => (
                  <li key={i} className="grid grid-cols-[2rem_1fr] border-b border-rule py-3 text-sm leading-relaxed">
                    <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</span>{w}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Note className="mt-3">{tr('เนื้อหา Resume เป็นข้อมูลที่ผู้สมัครระบุเอง คะแนนความครบถ้วนประเมินโดย AI', 'Resume content is self-reported. Completeness is estimated by AI.')}</Note>
        </>
      )}
    </div>
  );
}

type TabKey = 'github' | 'kaggle' | 'resume';
const PANELS: Record<TabKey, (p: { report: Report }) => React.ReactElement> = { github: GithubPanel, kaggle: KagglePanel, resume: ResumePanel };

export function DetailTabs({ report }: { report: Report }) {
  const [tab, setTab] = useState<TabKey>('github');
  const Active = PANELS[tab];
  return (
    <div>
      <Tabs value={tab} onChange={(v) => startTransition(() => setTab(v))} tabs={[
        { value: 'github', label: 'GitHub' }, { value: 'kaggle', label: 'Kaggle' }, { value: 'resume', label: 'Resume' },
      ]} />
      {/* Same place, different content: crossfade (Next.js view-transitions guide, step 4). */}
      <ViewTransition key={tab} enter="auto" exit="auto" default="none">
        <div><Active report={report} /></div>
      </ViewTransition>
      <div className="hidden print:block">
        {(Object.keys(PANELS) as TabKey[]).filter((k) => k !== tab).map((k) => { const P = PANELS[k]; return <div key={k} className="mt-8"><P report={report} /></div>; })}
      </div>
    </div>
  );
}
