'use client';
import { useEffect, useState } from 'react';
import { Check, Link2, Loader2, Printer, Share2 } from 'lucide-react';
import type { Report } from '@/lib/types';
import { fetchRoadmap, getHealth, shareReport } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Button, Note } from './ui';
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        {tr('ทุกคนที่มีลิงก์จะเห็นรายงานนี้ (ไม่รวมข้อความ Resume ต้นฉบับ) เป็นเวลา 30 วัน', 'Anyone with the link can view this report (without raw resume text) for 30 days.')}
        <Button className="px-3 py-1.5 text-xs" onClick={share}>{tr('สร้างลิงก์', 'Create link')}</Button>
        <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setState('idle')}>{tr('ยกเลิก', 'Cancel')}</Button>
      </div>
    );
  }
  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check size={14} />{tr('คัดลอกลิงก์แล้ว', 'Link copied')}
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono underline"><Link2 size={12} />{url.replace(/^https?:\/\//, '')}</a>
      </div>
    );
  }
  return (
    <Button variant="secondary" onClick={() => setState('confirm')} disabled={state === 'saving'}>
      {state === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
      {state === 'error' ? tr('แชร์ไม่สำเร็จ ลองอีกครั้ง', 'Sharing failed, retry') : tr('แชร์ลิงก์', 'Share link')}
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
    setReport((r) => ({ ...r, roadmap }));
    setPlanning(false);
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{report.label || tr('สรุปผลประเมิน', 'Review summary')}</h2>
          <p className="text-sm text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => window.print()}><Printer size={16} />{tr('พิมพ์ / PDF', 'Print / PDF')}</Button>
          {!readOnly && canShare && <ShareButton report={report} />}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <ScoreSummary report={report} />
        <EvidenceStatus report={report} />
      </div>
      <DetailTabs report={report} />
      <SkillsPanel report={report} />
      <RoadmapPanel report={report} loading={planning} onGenerate={readOnly ? undefined : generate} />
      {readOnly && <Note>{tr('รายงานที่แชร์เป็นภาพ ณ เวลาที่สร้าง ข้อมูลสาธารณะอาจเปลี่ยนไปแล้ว', 'Shared reports are a snapshot from when they were created; public data may have changed since.')}</Note>}
    </div>
  );
}
