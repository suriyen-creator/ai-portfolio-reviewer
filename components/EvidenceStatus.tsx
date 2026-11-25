'use client';
import type { Report } from '@/lib/types';
import { useLang, useStatusText } from '@/lib/i18n';
import { Badge, Note, type Tone } from './ui';

export function statusTone(code: string): Tone {
  if (code === 'ok') return 'good';
  if (['partial', 'empty', 'rate_limited', 'ai_rate_limited'].includes(code)) return 'mid';
  if (code === 'not_provided' || code === 'ai_unconfigured') return 'muted';
  return 'low';
}

export function EvidenceStatus({ report }: { report: Report }) {
  const { tr } = useLang();
  const status = useStatusText();
  const rows = [
    { name: 'GitHub', code: report.github.status },
    { name: 'Resume', code: report.resume.status },
    { name: 'Kaggle', code: report.kaggle.status },
    { name: tr('คำรีวิว AI', 'Written review'), code: report.deep.status },
  ];
  return (
    <div>
      <dl className="grid gap-x-8 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
            <dt className="text-sm font-medium">{r.name}</dt>
            <dd className="text-right"><Badge tone={statusTone(r.code)}>{status(r.code)}</Badge></dd>
          </div>
        ))}
      </dl>
      <Note className="mt-3">{tr('การนับแหล่งข้อมูลไม่ใช่การวัดความแม่นยำ รายงานนี้จึงไม่แสดงค่าความมั่นใจเป็นเปอร์เซ็นต์',
        'Source availability does not measure accuracy; no numerical confidence is assigned.')}</Note>
    </div>
  );
}
