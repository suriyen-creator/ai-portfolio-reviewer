'use client';
import { startTransition, useRef, useState, ViewTransition } from 'react';
import { motion } from 'motion/react';
import type { Report, Track } from '@/lib/types';
import { idleSteps, runReview } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Button, Eyebrow, Note, Segmented } from '@/components/ui';
import { ProfileInputs, emptyProfile, type ProfileValue } from '@/components/ProfileInputs';
import { ReviewProgress } from '@/components/Progress';
import { ReportView } from '@/components/ReportView';
import { PageTransition } from '@/components/PageTransition';

const rise = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const, delay } });

export default function Home() {
  const { tr, lang } = useLang();
  const [profile, setProfile] = useState<ProfileValue>(emptyProfile);
  const [track, setTrack] = useState<Track>('Software');
  const [steps, setSteps] = useState(idleSteps);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const results = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');
    if (!profile.github.trim() && !profile.kaggle.trim() && !profile.file) {
      return setWarning(tr('กรุณาระบุ GitHub, Kaggle หรืออัปโหลด Resume อย่างน้อยหนึ่งอย่าง', 'Provide a GitHub profile, Kaggle profile or resume to begin.'));
    }
    setBusy(true);
    setSteps(idleSteps);
    try {
      const r = await runReview({ ...profile, track, lang }, (step, state) => setSteps((s) => ({ ...s, [step]: state })));
      startTransition(() => setReport(r));
      setTimeout(() => results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div>
        <section className="grid gap-10 pb-14 pt-16 md:grid-cols-12 md:pt-24">
          <div className="md:col-span-8">
            <motion.div {...rise(0)}><Eyebrow index="№ 1">{tr('รีวิวพอร์ตโฟลิโอ', 'Portfolio review')}</Eyebrow></motion.div>
            <motion.h1 {...rise(0.06)} className="mt-6 font-serif text-[3.2rem] leading-display tracking-tight sm:text-[5.25rem]">
              <span className="block sm:whitespace-nowrap">{tr('อ่านพอร์ตโฟลิโอ', 'Read the portfolio')}</span>
              <span className="italic-latin block text-mute sm:whitespace-nowrap">{tr('จากหลักฐาน', 'from the evidence,')}</span>
              <span className="block sm:whitespace-nowrap">{tr('ไม่ใช่คำโฆษณา', 'not the pitch.')}</span>
            </motion.h1>
          </div>
          <motion.div {...rise(0.16)} className="self-end md:col-span-4">
            <p className="leading-relaxed text-mute">
              {tr('ดึงผลงานจาก GitHub, ผลการแข่งขัน Kaggle และ Resume มาให้คะแนนตามเกณฑ์ที่เปิดเผย ทุกข้อสรุปมีลิงก์กลับไปที่หลักฐาน และบอกตรงๆ ว่าอะไรยังตรวจไม่ได้',
                'GitHub work, Kaggle placements and a resume, scored on published weights. Every finding links back to its source, and gaps are stated plainly.')}
            </p>
            <dl className="mt-6 grid grid-cols-3 border-t border-ink pt-3 font-mono text-[11px] uppercase tracking-caps text-mute">
              <div><dt>{tr('แหล่ง', 'Sources')}</dt><dd className="mt-1 font-serif text-3xl normal-case tracking-normal text-ink">3</dd></div>
              <div><dt>{tr('สายงาน', 'Tracks')}</dt><dd className="mt-1 font-serif text-3xl normal-case tracking-normal text-ink">2</dd></div>
              <div><dt>{tr('แผน', 'Plan')}</dt><dd className="mt-1 font-serif text-3xl normal-case tracking-normal text-ink">90<span className="text-base">{tr(' วัน', 'd')}</span></dd></div>
            </dl>
          </motion.div>
        </section>

        <motion.form {...rise(0.24)} onSubmit={submit} className="grid gap-8 border-t border-ink pt-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <Eyebrow index="00">{tr('สายงานที่ประเมิน', 'Review track')}</Eyebrow>
            <div className="mt-4">
              <Segmented value={track} onChange={setTrack} options={[{ value: 'Software', label: 'Software' }, { value: 'Data/ML', label: 'Data / ML' }]} />
            </div>
            <Note className="mt-4 max-w-[16rem]">{track === 'Software'
              ? tr('น้ำหนัก GitHub 40 · Resume 25 · โปรเจกต์ 25 · Kaggle 10', 'Weights: GitHub 40 · Resume 25 · Projects 25 · Kaggle 10')
              : tr('น้ำหนัก GitHub 20 · Resume 25 · โปรเจกต์ 25 · Kaggle 30', 'Weights: GitHub 20 · Resume 25 · Projects 25 · Kaggle 30')}</Note>
          </div>
          <div className="md:col-span-9">
            <ProfileInputs value={profile} onChange={setProfile} />
            <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-3">
                <Note>{tr('กรอกเฉพาะแหล่งที่มี ข้อความใน Resume และหลักฐานโปรเจกต์จะส่งให้ Gemini เพื่อเขียนรีวิว ข้อมูลสาธารณะเก็บใน cache 1 ชั่วโมง',
                  'Fill in what you have. Resume text and project evidence are sent to Gemini for the written review. Public evidence is cached for one hour.')}</Note>
                {warning && <Note tone="warn">{warning}</Note>}
                {busy && <ReviewProgress steps={steps} />}
              </div>
              <Button type="submit" disabled={busy} className="min-w-48 py-4">
                {busy ? tr('กำลังอ่านหลักฐาน…', 'Reading evidence…') : tr('วิเคราะห์ผลงาน', 'Review portfolio')}
                {!busy && <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>}
              </Button>
            </div>
          </div>
        </motion.form>

        <div ref={results} className="scroll-mt-20 pt-20">
          {report && (
            <ViewTransition key={report.created_at} enter="slide-up" default="none">
              <div><ReportView report={report} /></div>
            </ViewTransition>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
