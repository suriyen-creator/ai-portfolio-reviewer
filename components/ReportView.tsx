'use client';
import { startTransition, useEffect, useState } from 'react';
import type { Report } from '@/lib/types';
import { fetchRoadmap, getHealth, shareReport } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Button, Note, Reveal, Section } from './ui';
import { ScoreSummary } from './ScoreSummary';
import { EvidenceStatus } from './EvidenceStatus';
import { DetailTabs } from './DetailTabs';
import { SkillsPanel } from './SkillsPanel';
import { RoadmapPanel } from './RoadmapPanel';

function ShareButton({ report }: { report: Report }) {
  const { tr } = useLang();
  const [state, setState] = useState<'idle' | 'confirm' | 'saving' | 'done' | 'error'>('idle');
  const [url, setUrl] = useState('');

  const share = async () => {
    setState('saving');
    try {
      const { id } = await shareReport(report);
      const link = `${location.origin}/r/${id}`;
      setUrl(link);
      await navigator.clipboard?.writeText(link).catch(() => undefined);
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'confirm') {
    return (
      <div className="flex flex-wrap items-baseline gap-4 border-l-2 border-warn pl-3 text-xs">
        <span className="max-w-xs">{tr('ทุกคนที่มีลิงก์จะเห็นรายงานนี้ (ไม่รวมข้อความ Resume ต้นฉบับ) เป็นเวลา 30 วัน', 'Anyone with the link can view this report (without raw resume text) for 30 days.')}</span>
        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={share}>{tr('สร้างลิงก์', 'Create link')}</Button>
        <Button variant="ghost" className="text-xs" onClick={() => setState('idle')}>{tr('ยกเลิก', 'Cancel')}</Button>
      </div>
    );
  }
  if (state === 'done') {
    return (
      <div className="flex items-baseline gap-3 text-xs">
        <span className="text-good">{tr('คัดลอกลิงก์แล้ว', 'Link copied')}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono underline underline-offset-4 hover:text-accent">{url.replace(/^https?:\/\//, '')}</a>
      </div>
    );
  }
  return (
    <Button variant="ghost" onClick={() => setState('confirm')} disabled={state === 'saving'}>
      {state === 'saving' ? tr('กำลังสร้างลิงก์…', 'Creating link…') : state === 'error' ? tr('แชร์ไม่สำเร็จ ลองอีกครั้ง', 'Sharing failed, retry') : tr('แชร์ลิงก์', 'Share link')}
    </Button>
  );
}

export function ReportView({ report: initial, readOnly = false }: { report: Report; readOnly?: boolean }) {
  const { tr, lang } = useLang();
  const [report, setReport] = useState(initial);
  const [canShare, setCanShare] = useState(false);
  const [planning, setPlanning] = useState(false);
  useEffect(() => setReport(initial), [initial]);
  useEffect(() => { if (!readOnly) getHealth().then((h) => setCanShare(h.share)).catch(() => undefined); }, [readOnly]);

  const generate = async () => {
    setPlanning(true);
    const roadmap = await fetchRoadmap(report, lang);
    startTransition(() => {
      setReport((r) => ({ ...r, roadmap }));
      setPlanning(false);
    });
  };

  const showSkills = report.deep.status === 'ok';
  return (
    <article>
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <h2 className="font-serif text-5xl leading-display sm:text-6xl">{report.label || tr('ผลประเมิน', 'The review')}</h2>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-caps text-mute">{new Date(report.created_at).toLocaleString()}</p>
        </div>
        <div className="no-print flex flex-wrap items-baseline gap-5">
          <Button variant="ghost" onClick={() => window.print()}>{tr('พิมพ์ / PDF', 'Print / PDF')}</Button>
          {!readOnly && canShare && <ShareButton report={report} />}
        </div>
      </header>

      <Section index="01" label={tr('สรุป', 'Summary')}><Reveal><ScoreSummary report={report} /></Reveal></Section>
      <Section index="02" label={tr('สถานะข้อมูล', 'Evidence')}><Reveal><EvidenceStatus report={report} /></Reveal></Section>
      <Section index="03" label={tr('รายละเอียด', 'Details')}><Reveal><DetailTabs report={report} /></Reveal></Section>
      {showSkills && <Section index="04" label={tr('ทักษะและสิ่งที่ควรตรวจต่อ', 'Skills & follow-ups')}><Reveal><SkillsPanel report={report} /></Reveal></Section>}
      {(report.roadmap || !readOnly) && (
        <Section index={showSkills ? '05' : '04'} label={tr('แผนพัฒนา 30/60/90 วัน', '30/60/90-day plan')}>
          <RoadmapPanel report={report} loading={planning} onGenerate={readOnly ? undefined : generate} />
        </Section>
      )}
      {readOnly && <Note className="border-t border-rule pt-4">{tr('รายงานที่แชร์เป็นภาพ ณ เวลาที่สร้าง ข้อมูลสาธารณะอาจเปลี่ยนไปแล้ว', 'Shared reports are a snapshot from when they were created; public data may have changed since.')}</Note>}
    </article>
  );
}
