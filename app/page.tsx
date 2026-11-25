'use client';
import { useRef, useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import type { Report, Track } from '@/lib/types';
import { idleSteps, runReview } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Button, Card, Note, Segmented } from '@/components/ui';
import { ProfileInputs, emptyProfile, type ProfileValue } from '@/components/ProfileInputs';
import { ReviewProgress } from '@/components/Progress';
import { ReportView } from '@/components/ReportView';



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
      setReport(r);
      setTimeout(() => results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-10">
      <section className="pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-slate-900/60 dark:text-brand-400">
          <ShieldCheck size={14} />{tr('ทุกข้อสรุปมีลิงก์หลักฐานให้ตรวจต่อ', 'Every finding links back to its evidence')}
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {tr('รีวิวพอร์ตโฟลิโอจาก', 'Review a portfolio from')}{' '}
          <span className="bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">GitHub, Resume & Kaggle</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          {tr('ดูผลงานและประสบการณ์จาก GitHub, Resume และ Kaggle พร้อมหลักฐานที่ตรวจต่อได้ และแผนพัฒนาที่ทำได้จริง',
            'Review GitHub, resume and Kaggle work, with sources you can inspect and a practical improvement plan.')}
        </p>
      </section>

      <Card className="mx-auto w-full max-w-3xl">
        <form onSubmit={submit} className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tr('สายงานที่ประเมิน', 'Review track')}</span>
            <Segmented value={track} onChange={setTrack} options={[{ value: 'Software', label: 'Software' }, { value: 'Data/ML', label: 'Data / ML' }]} />
          </div>
          <ProfileInputs value={profile} onChange={setProfile} />
          <Note>{tr('เลือกกรอกแหล่งข้อมูลที่มี ข้อความใน Resume และหลักฐานโปรเจกต์จะส่งให้ Gemini เพื่อเขียนรีวิว ข้อมูลสาธารณะเก็บใน cache 1 ชั่วโมง',
            'Provide the sources you have. Resume text and project evidence are sent to Gemini for the written review. Public evidence is cached for one hour.')}</Note>
          {warning && <Note tone="warn">{warning}</Note>}
          {busy && <ReviewProgress steps={steps} />}
          <Button type="submit" disabled={busy} className="py-3 text-base">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {busy ? tr('กำลังอ่านหลักฐานและสรุปผล', 'Reading evidence and preparing the review') : tr('วิเคราะห์ผลงาน', 'Review portfolio')}
          </Button>
        </form>
      </Card>

      <div ref={results} className="scroll-mt-20">
        {report ? <ReportView report={report} /> : (
          <p className="text-center text-sm text-slate-500">{tr('เริ่มจากโปรไฟล์หรือ Resume อย่างน้อยหนึ่งแหล่ง ผลจะแสดงพร้อมลิงก์หลักฐานและสิ่งที่ยังตรวจไม่ได้',
            'Start with a profile or resume. Results include source links and any gaps in the available evidence.')}</p>
        )}
      </div>
    </div>
  );
}
