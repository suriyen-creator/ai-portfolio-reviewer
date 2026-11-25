'use client';
import { useState } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, FileText, GitFork, Medal, Trophy, XCircle } from 'lucide-react';
import type { Base, Report } from '@/lib/types';
import { LIMITS, useLang, useStatusText } from '@/lib/i18n';
import { validScore } from '@/lib/score';
import { Badge, Card, Github, LinkButton, Note, Tabs, cx } from './ui';
import { statusTone } from './EvidenceStatus';

function Check({ value, label }: { value: boolean | null; label: string }) {
  const { tr } = useLang();
  const text = value === true ? tr('พบไฟล์', 'File found') : value === false ? tr('ไม่พบไฟล์', 'File not found') : tr('ยังยืนยันไม่ได้', 'Unverified');
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {value === true ? <CheckCircle2 size={14} className="text-emerald-500" /> : value === false ? <XCircle size={14} className="text-rose-400" /> : <CircleDashed size={14} className="text-slate-400" />}
      <span className="font-medium">{label}</span><span className="text-slate-500">· {text}</span>
    </div>
  );
}

function SourceFooter({ data }: { data: Base }) {
  const { tr, trp } = useLang();
  return (
    <div className="mt-5 grid gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        {data.source_url && <LinkButton href={data.source_url}><ExternalLink size={12} />{tr('เปิดแหล่งข้อมูล', 'Open source')}</LinkButton>}
        {data.fetched_at && <span className="text-xs text-slate-500">{tr('ตรวจเมื่อ ', 'Checked at ')}{new Date(data.fetched_at).toLocaleString()}</span>}
      </div>
      {data.limitations?.filter((c) => LIMITS[c]).map((c) => <Note key={c}>{trp(LIMITS[c])}</Note>)}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</div>
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
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={tr('Repo ที่อ่านได้', 'Repositories sampled')} value={git.repos_count} />
            <Stat label={tr('อัปเดตใน 90 วัน', 'Updated in 90 days')} value={git.active_projects} />
            <Stat label="Stars" value={git.stars} />
            <Stat label={tr('คะแนน GitHub', 'GitHub score')} value={git.score?.toFixed(0)} />
          </div>
          {!!git.top_languages?.length && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500">{tr('ภาษาใน repo:', 'Repository languages:')}</span>
              {git.top_languages.map(([name]) => <Badge key={name} tone="info">{name}</Badge>)}
            </div>
          )}
          <div className="mt-2"><Note>{tr('วันที่อัปเดต repo ไม่ใช่จำนวน commit หรือหลักฐานความสม่ำเสมอในการเขียนโค้ด',
            'Repository update dates are not commit counts or evidence of coding consistency.')}</Note></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {git.samples.map((p) => (
              <div key={p.name} className="rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-500/40">
                <div className="flex items-start justify-between gap-2">
                  <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 font-medium text-slate-900 hover:text-brand-600 dark:text-white">
                    <Github size={15} className="shrink-0" /><span className="truncate">{p.name}</span>
                  </a>
                  <div className="flex shrink-0 gap-1">
                    {p.fork && <Badge><GitFork size={11} />fork</Badge>}
                    {p.language && <Badge tone="info">{p.language}</Badge>}
                  </div>
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</p>}
                <div className="mt-3 grid gap-1">
                  <Check value={p.readme} label="README" />
                  <Check value={p.cicd} label="CI workflow" />
                  <div className="text-xs text-slate-500">
                    {p.deployment ? tr('Deployment: ตั้งค่า homepage ไว้ แต่ยังไม่ได้ตรวจว่าเปิดใช้งานได้', 'Deployment: homepage configured, availability unverified') : tr('Deployment: ยังยืนยันไม่ได้', 'Deployment: unverified')}
                  </div>
                  <div className="text-xs text-slate-500">{tr('การใช้ API: ยังยืนยันไม่ได้จากข้อมูลที่อ่าน', 'API usage: unverified from inspected evidence')}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.readme && <LinkButton href={p.readme_url}>README</LinkButton>}
                  {p.cicd && <LinkButton href={p.workflow_url}>{tr('เปิด workflows', 'Open workflows')}</LinkButton>}
                </div>
              </div>
            ))}
          </div>
          {!!git.samples.length && <div className="mt-3"><Note>{tr('พบ workflow ไม่ได้ยืนยันว่ารันทดสอบผ่าน', 'A workflow file does not establish that its checks pass.')}</Note></div>}
        </>
      )}
      <SourceFooter data={git} />
    </div>
  );
}

const medalColor = { gold: 'text-amber-500', silver: 'text-slate-400', bronze: 'text-orange-600' };

function KagglePanel({ report }: { report: Report }) {
  const { tr, trp } = useLang();
  const status = useStatusText();
  const k = report.kaggle;
  const scored = (r: (typeof k.competitions)[number]) =>
    r.completed && r.final && Number.isInteger(r.rank) && Number.isInteger(r.teams) && r.teams! >= 2 && r.rank! >= 1 && r.rank! <= r.teams!;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(k.status)}>{status(k.status)}</Badge>
        {validScore(k.score) && <Badge tone="info">{tr('คะแนน Kaggle ', 'Kaggle score ')}{k.score.toFixed(1)}</Badge>}
      </div>
      <div className="mt-2"><Note>{tr('ข้อมูลด้านล่างเป็นผลของทีม ไม่ได้ยืนยันสัดส่วนงานที่ผู้สมัครทำ',
        'Placements are team results and do not establish the candidate’s individual contribution.')}</Note></div>
      {!!k.competitions.length && (
        <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2.5 font-medium">{tr('การแข่งขัน', 'Competition')}</th>
                <th className="px-4 py-2.5 font-medium">{tr('อันดับทีม', 'Team rank')}</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">{tr('วันปิดการแข่งขัน', 'Deadline')}</th>
                <th className="px-4 py-2.5 font-medium">{tr('ใช้คิดคะแนน', 'Scored')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {k.competitions.map((r) => (
                <tr key={r.url} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-brand-600">
                      {r.medal && <Medal size={14} className={medalColor[r.medal]} aria-label={r.medal} />}{r.title}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{r.rank ?? '—'} / {r.teams ?? '—'}</td>
                  <td className="hidden px-4 py-2.5 text-slate-500 sm:table-cell">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5">{scored(r) ? <Badge tone="good">{tr('ใช่', 'Yes')}</Badge> : <Badge>{tr('ยังยืนยันไม่ได้', 'Unverified')}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3"><Note>{tr('สูตร Kaggle: เฉลี่ย 3 ผลที่ดีที่สุดของ 100 × (จำนวนทีม − อันดับ) ÷ (จำนวนทีม − 1) หรือใช้ทั้งหมดหากมีน้อยกว่า 3 ผล เหรียญไม่บวกซ้ำ สูตรนี้ไม่ใช่คะแนนทางการ Kaggle',
        'Kaggle score: mean of the best three results using 100 × (teams − rank) ÷ (teams − 1), or all eligible results if fewer than three. Medals add no extra points. This is not the official Kaggle points formula.')}</Note></div>
      {!['not_provided', 'ok', 'partial', 'empty'].includes(k.status) && <div className="mt-1"><Note>{trp(LIMITS.kaggle_website_api)}</Note></div>}
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
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label={tr('ความครบถ้วน', 'Completeness')} value={r.score?.toFixed(0)} />
            <Stat label={tr('โปรเจกต์ที่ระบุ', 'Explicit projects')} value={r.project_count} />
            <Stat label={tr('ความชัดเจน', 'Clarity')} value={r.clarity_level ? clarity[r.clarity_level] : '—'} />
          </div>
          {!!r.weaknesses?.length && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">{tr('จุดที่ควรเพิ่ม', 'Gaps to address')}</h3>
              <ul className="grid gap-2">
                {r.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2.5 rounded-xl bg-amber-50/70 px-3.5 py-2.5 text-sm dark:bg-amber-500/5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-200/70 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">{i + 1}</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3"><Note>{tr('เนื้อหา Resume เป็นข้อมูลที่ผู้สมัครระบุเอง คะแนนความครบถ้วนประเมินโดย AI', 'Resume content is self-reported. Completeness is estimated by AI.')}</Note></div>
        </>
      )}
    </div>
  );
}

type TabKey = 'github' | 'kaggle' | 'resume';
export function DetailTabs({ report }: { report: Report }) {
  const [tab, setTab] = useState<TabKey>('github');
  return (
    <Card>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'github', label: <><Github size={15} />GitHub</> },
        { value: 'kaggle', label: <><Trophy size={15} />Kaggle</> },
        { value: 'resume', label: <><FileText size={15} />Resume</> },
      ]} />
      <div className={cx(tab !== 'github' && 'hidden print:block')}><GithubPanel report={report} /></div>
      <div className={cx(tab !== 'kaggle' && 'hidden print:block')}><KagglePanel report={report} /></div>
      <div className={cx(tab !== 'resume' && 'hidden print:block')}><ResumePanel report={report} /></div>
    </Card>
  );
}
