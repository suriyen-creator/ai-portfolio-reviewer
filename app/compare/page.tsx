'use client';
import { startTransition, useState, ViewTransition } from 'react';
import { motion } from 'motion/react';
import type { Report, Track } from '@/lib/types';
import { idleSteps, runReview, type Step, type StepState } from '@/lib/api';
import { AREAS, summarize, validScore } from '@/lib/score';
import { useLang } from '@/lib/i18n';
import { Button, Eyebrow, Note, Reveal, Section, Segmented, TextInput, cx } from '@/components/ui';
import { ProfileInputs, emptyProfile, type ProfileValue } from '@/components/ProfileInputs';
import { ReviewProgress } from '@/components/Progress';
import { RadarCompare, SIDE_COLORS } from '@/components/RadarCompare';
import { BigScore, useAreaLabel } from '@/components/ScoreSummary';
import { ReportView } from '@/components/ReportView';
import { PageTransition } from '@/components/PageTransition';

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

  const fallback = (i: number) => names[i].trim() || profiles[i].github.trim() || profiles[i].kaggle.trim() || (i === 0 ? 'A' : 'B');
  const filled = (p: ProfileValue) => !!(p.github.trim() || p.kaggle.trim() || p.file);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');
    if (!profiles.every(filled)) return setWarning(tr('กรุณาระบุข้อมูลอย่างน้อยหนึ่งแหล่งให้ทั้งสองฝั่ง', 'Provide at least one source for both sides.'));
    let labels = [fallback(0), fallback(1)];
    if (labels[0] === labels[1]) labels = [labels[0] + ' (A)', labels[1] + ' (B)'];
    setBusy(true);
    setSteps([idleSteps, idleSteps]);
    try {
      const results = await Promise.all(([0, 1] as Side[]).map((i) =>
        runReview({ ...profiles[i], track, lang, label: labels[i] }, (step, state) =>
          setSteps((all) => all.map((s, j) => (j === i ? { ...s, [step]: state } : s))))));
      startTransition(() => { setReports(results); setDetail(0); });
    } finally {
      setBusy(false);
    }
  };

  const summaries = reports?.map(summarize);
  const skillMaps = reports?.map((r) => new Map((r.deep.inferred_skills ?? []).map((s) => [s.skill.toLowerCase(), s.skill])));
  const shared = skillMaps ? [...skillMaps[0].keys()].filter((s) => skillMaps[1].has(s)) : [];
  const only = skillMaps ? skillMaps.map((m, i) => [...m.keys()].filter((s) => !skillMaps[1 - i].has(s))) : [];
  const shownNames = reports ? reports.map((r) => r.label!) : [fallback(0), fallback(1)];

  return (
    <PageTransition>
      <div>
        <section className="grid gap-8 pb-12 pt-16 md:grid-cols-12 md:pt-24">
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="font-serif text-[3.4rem] leading-display tracking-tight sm:text-[5.5rem] md:col-span-8">
            {tr('สองโปรไฟล์', 'Two profiles,')}<br /><span className="italic-latin text-mute">{tr('เกณฑ์เดียวกัน', 'one yardstick.')}</span>
          </motion.h1>
          <p className="self-end leading-relaxed text-mute md:col-span-4">
            {tr('รีวิวสองคนพร้อมกันด้วยน้ำหนักเดียวกัน แล้วดูว่าจุดแข็งต่างกันตรงไหน', 'Review two people with the same weights and see exactly where their strengths differ.')}
          </p>
        </section>

        <form onSubmit={submit} className="border-t border-ink pt-8">
          <div className="mb-8 flex flex-wrap items-baseline gap-6">
            <Eyebrow index="00">{tr('สายงาน', 'Track')}</Eyebrow>
            <Segmented value={track} onChange={setTrack} options={[{ value: 'Software', label: 'Software' }, { value: 'Data/ML', label: 'Data / ML' }]} />
          </div>
          <div className="grid gap-12 md:grid-cols-2 md:gap-10">
            {([0, 1] as Side[]).map((i) => (
              <div key={i}>
                <div className="flex items-baseline gap-3 border-b-2 pb-2" style={{ borderColor: SIDE_COLORS[i] }}>
                  <span className="font-serif text-3xl leading-none">{i === 0 ? 'A' : 'B'}</span>
                  <TextInput value={names[i]} onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                    placeholder={tr('ชื่อที่แสดง (ไม่บังคับ)', 'Display name (optional)')} className="border-b-0 py-1 text-sm" maxLength={40} />
                </div>
                <ProfileInputs idPrefix={`side${i}-`} value={profiles[i]} onChange={(v) => setProfiles(profiles.map((p, j) => (j === i ? v : p)))} />
                {busy && <div className="mt-4"><ReviewProgress steps={steps[i]} /></div>}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-end gap-6">
            {warning && <Note tone="warn">{warning}</Note>}
            <Button type="submit" disabled={busy} className="min-w-48 py-4">
              {busy ? tr('กำลังรีวิวทั้งสองโปรไฟล์…', 'Reviewing both…') : tr('เปรียบเทียบ', 'Compare')}
              {!busy && <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>}
            </Button>
          </div>
        </form>

        {reports && summaries && (
          <ViewTransition key={reports[0].created_at} enter="slide-up" default="none">
            <div className="pt-20">
              <Section index="01" label={tr('คะแนนรวม', 'Overall')}>
                <div className="grid gap-10 lg:grid-cols-2">
                  <div className="grid grid-cols-2 gap-6">
                    {summaries.map((s, i) => (
                      <div key={i}>
                        <div className="flex items-baseline gap-2 text-sm font-medium">
                          <span className="inline-block size-2.5" style={{ background: SIDE_COLORS[i] }} />{shownNames[i]}
                        </div>
                        <BigScore score={s.score} size="md" className="mt-3" />
                        {!s.complete && <Note className="mt-2">{tr('ข้อมูลไม่ครบ', 'Incomplete evidence')}</Note>}
                      </div>
                    ))}
                  </div>
                  <Reveal><RadarCompare reports={reports} names={shownNames} /></Reveal>
                </div>
                <table className="mt-8 w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink font-mono text-[11px] uppercase tracking-caps text-mute">
                      <th className="pb-2 text-left font-normal">{tr('ด้าน', 'Area')}</th>
                      {shownNames.map((n) => <th key={n} className="pb-2 text-right font-normal">{n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {AREAS.map((k) => {
                      const vals = summaries.map((s) => s.scores[k]);
                      const best = vals.every(validScore) && vals[0] !== vals[1] ? (vals[0]! > vals[1]! ? 0 : 1) : -1;
                      return (
                        <tr key={k} className="border-b border-rule">
                          <td className="py-3">{label(k)}</td>
                          {vals.map((v, i) => (
                            <td key={i} className={cx('py-3 text-right font-mono tabular-nums', best === i && 'text-accent')}>
                              {validScore(v) ? v.toFixed(1) : '—'}{best === i && ' ▲'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Note className="mt-3">{tr('ถ้าข้อมูลของแต่ละฝั่งไม่ครบเท่ากัน คะแนนรวมจะปรับน้ำหนักต่างกัน ควรดูคะแนนรายด้านประกอบ คะแนนไม่ใช่คำตัดสินจ้างงาน',
                  'If the two sides have different evidence, their overall scores use different weights; read the per-area scores too. Scores are not a hiring decision.')}</Note>
              </Section>

              {(reports[0].deep.status === 'ok' || reports[1].deep.status === 'ok') && (
                <Section index="02" label={tr('ทักษะ', 'Skills')}>
                  <div className="grid gap-8 md:grid-cols-3">
                    {[{ title: tr('เฉพาะ ', 'Only ') + shownNames[0], list: only[0], map: skillMaps![0] },
                      { title: tr('มีร่วมกัน', 'Both'), list: shared, map: skillMaps![0] },
                      { title: tr('เฉพาะ ', 'Only ') + shownNames[1], list: only[1], map: skillMaps![1] }].map((col) => (
                      <div key={col.title}>
                        <div className="border-b border-ink pb-2 font-mono text-[11px] uppercase tracking-caps text-mute">{col.title}</div>
                        <ul className="mt-2">
                          {col.list.length ? col.list.map((s) => <li key={s} className="border-b border-rule py-2 text-sm">{col.map.get(s)}</li>)
                            : <li className="py-2 text-sm text-mute">—</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <div className="mt-16 flex flex-wrap items-baseline gap-6 border-t border-ink pt-6">
                <Eyebrow>{tr('รายงานฉบับเต็ม', 'Full report')}</Eyebrow>
                <Segmented value={String(detail) as '0' | '1'} onChange={(v) => startTransition(() => setDetail(Number(v) as Side))}
                  options={[{ value: '0', label: shownNames[0] }, { value: '1', label: shownNames[1] }]} />
              </div>
              <ViewTransition key={detail} enter="auto" exit="auto" default="none">
                <div className="pt-10"><ReportView report={reports[detail]} /></div>
              </ViewTransition>
            </div>
          </ViewTransition>
        )}
      </div>
    </PageTransition>
  );
}
