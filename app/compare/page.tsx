'use client';
import { useState } from 'react';
import { GitCompareArrows, Loader2, Trophy } from 'lucide-react';
import type { Report, Track } from '@/lib/types';
import { idleSteps, runReview, type Step, type StepState } from '@/lib/api';
import { AREAS, summarize, validScore } from '@/lib/score';
import { useLang } from '@/lib/i18n';
import { Badge, Button, Card, Note, Segmented, SectionTitle, TextInput, cx } from '@/components/ui';
import { ProfileInputs, emptyProfile, type ProfileValue } from '@/components/ProfileInputs';
import { ReviewProgress } from '@/components/Progress';
import { RadarCompare, SIDE_COLORS } from '@/components/RadarCompare';
import { ScoreGauge, useAreaLabel } from '@/components/ScoreSummary';
import { ReportView } from '@/components/ReportView';

type Side = 0 | 1;

export default function Compare() {
  const { tr, lang } = useLang();
  const label = useAreaLabel();
  const [track, setTrack] = useState<Track>('Software');
  const [profiles, setProfiles] = useState<ProfileValue[]>([emptyProfile, emptyProfile]);
  const [names, setNames] = useState(['', '']);
  const [steps, setSteps] = useState<Record<Step, StepState>[]>([idleSteps, idleSteps]);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [detail, setDetail] = useState<Side>(0);

  const displayNames = names.map((n, i) => n.trim() || profiles[i].github.trim() || profiles[i].kaggle.trim() || (i === 0 ? 'A' : 'B'));
  const filled = (p: ProfileValue) => !!(p.github.trim() || p.kaggle.trim() || p.file);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');
    if (!profiles.every(filled)) {
      return setWarning(tr('กรุณาระบุข้อมูลอย่างน้อยหนึ่งแหล่งให้ทั้งสองฝั่ง', 'Provide at least one source for both sides.'));
    }
    if (displayNames[0] === displayNames[1]) setNames(['A', 'B']);
    setBusy(true);
    setSteps([idleSteps, idleSteps]);
    try {
      const results = await Promise.all(([0, 1] as Side[]).map((i) =>
        runReview({ ...profiles[i], track, lang, label: displayNames[i] }, (step, state) =>
          setSteps((all) => all.map((s, j) => (j === i ? { ...s, [step]: state } : s))))));
      setReports(results);
      setDetail(0);
    } finally {
      setBusy(false);
    }
  };

  const summaries = reports?.map(summarize);
  const skillSets = reports?.map((r) => new Set((r.deep.inferred_skills ?? []).map((s) => s.skill.toLowerCase())));
  const skillNames = reports?.map((r) => new Map((r.deep.inferred_skills ?? []).map((s) => [s.skill.toLowerCase(), s.skill])));
  const shared = skillSets ? [...skillSets[0]].filter((s) => skillSets[1].has(s)) : [];
  const only = skillSets ? skillSets.map((set, i) => [...set].filter((s) => !skillSets[1 - i].has(s))) : [];
  const names2 = reports ? reports.map((r) => r.label!) : displayNames;

  return (
    <div className="grid gap-8">
      <section className="pt-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{tr('เทียบ 2 โปรไฟล์', 'Compare two profiles')}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          {tr('รีวิวสองคนพร้อมกันด้วยเกณฑ์เดียวกัน แล้วดูจุดแข็งที่ต่างกันในกราฟเดียว', 'Review two people with the same criteria and see where their strengths differ.')}
        </p>
      </section>

      <form onSubmit={submit} className="grid gap-5">
        <div className="flex justify-center">
          <Segmented value={track} onChange={setTrack} options={[{ value: 'Software', label: 'Software' }, { value: 'Data/ML', label: 'Data / ML' }]} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {([0, 1] as Side[]).map((i) => (
            <Card key={i} className="relative overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: SIDE_COLORS[i] }} />
              <TextInput value={names[i]} onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                placeholder={tr('ชื่อที่แสดง (ไม่บังคับ)', 'Display name (optional)')} className="mb-4 font-medium" maxLength={40} />
              <ProfileInputs idPrefix={`side${i}-`} value={profiles[i]} onChange={(v) => setProfiles(profiles.map((p, j) => (j === i ? v : p)))} />
              {busy && <div className="mt-4"><ReviewProgress steps={steps[i]} /></div>}
            </Card>
          ))}
        </div>
        {warning && <div className="mx-auto"><Note tone="warn">{warning}</Note></div>}
        <Button type="submit" disabled={busy} className="mx-auto w-full max-w-sm py-3 text-base">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <GitCompareArrows size={18} />}
          {busy ? tr('กำลังรีวิวทั้งสองโปรไฟล์', 'Reviewing both profiles') : tr('เปรียบเทียบ', 'Compare')}
        </Button>
      </form>

      {reports && summaries && (
        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <Card>
              <SectionTitle icon={<Trophy size={18} />}>{tr('คะแนนรวม', 'Overall')}</SectionTitle>
              <div className="flex justify-around gap-4">
                {summaries.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <ScoreGauge score={s.score} size={136} />
                    <span className="flex items-center gap-1.5 text-sm font-medium"><span className="size-2.5 rounded-full" style={{ background: SIDE_COLORS[i] }} />{names2[i]}</span>
                    {!s.complete && <Badge tone="mid">{tr('ข้อมูลไม่ครบ', 'Incomplete')}</Badge>}
                  </div>
                ))}
              </div>
              <table className="mt-6 w-full text-sm">
                <thead className="text-xs text-slate-500"><tr><th className="py-1.5 text-left font-medium">{tr('ด้าน', 'Area')}</th>{names2.map((n) => <th key={n} className="py-1.5 text-right font-medium">{n}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {AREAS.map((k) => {
                    const vals = summaries.map((s) => s.scores[k]);
                    const best = vals.every(validScore) && vals[0] !== vals[1] ? (vals[0]! > vals[1]! ? 0 : 1) : -1;
                    return (
                      <tr key={k}>
                        <td className="py-2">{label(k)}</td>
                        {vals.map((v, i) => <td key={i} className={cx('py-2 text-right tabular-nums', best === i && 'font-semibold text-emerald-600 dark:text-emerald-400')}>{validScore(v) ? v.toFixed(1) : '—'}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4"><Note>{tr('ถ้าข้อมูลของแต่ละฝั่งไม่ครบเท่ากัน คะแนนรวมจะปรับน้ำหนักต่างกัน ควรดูคะแนนรายด้านประกอบ คะแนนไม่ใช่คำตัดสินจ้างงาน',
                'If the two sides have different evidence, their overall scores use different weights; read the per-area scores too. Scores are not a hiring decision.')}</Note></div>
            </Card>
            <Card><RadarCompare reports={reports} names={names2} /></Card>
          </div>

          {(reports[0].deep.status === 'ok' || reports[1].deep.status === 'ok') && (
            <Card>
              <SectionTitle>{tr('ทักษะ', 'Skills')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-3">
                {[{ title: tr('มีเฉพาะ ', 'Only ') + names2[0], list: only[0], map: skillNames![0], color: SIDE_COLORS[0] },
                  { title: tr('มีร่วมกัน', 'Shared'), list: shared, map: skillNames![0], color: '#10b981' },
                  { title: tr('มีเฉพาะ ', 'Only ') + names2[1], list: only[1], map: skillNames![1], color: SIDE_COLORS[1] }].map((col) => (
                  <div key={col.title}>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium"><span className="size-2.5 rounded-full" style={{ background: col.color }} />{col.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {col.list.length ? col.list.map((s) => <Badge key={s}>{col.map.get(s)}</Badge>) : <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="mt-4 flex justify-center">
            <Segmented value={String(detail) as '0' | '1'} onChange={(v) => setDetail(Number(v) as Side)}
              options={[{ value: '0', label: names2[0] }, { value: '1', label: names2[1] }]} />
          </div>
          <ReportView key={detail} report={reports[detail]} />
        </div>
      )}
    </div>
  );
}
