'use client';
import { Bot, FileText, Trophy } from 'lucide-react';
import type { Report } from '@/lib/types';
import { useLang, useStatusText } from '@/lib/i18n';
import { Badge, Card, Github, Note, type Tone } from './ui';

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
    { icon: <Github size={18} />, name: 'GitHub', code: report.github.status },
    { icon: <FileText size={18} />, name: 'Resume', code: report.resume.status },
    { icon: <Trophy size={18} />, name: 'Kaggle', code: report.kaggle.status },
    { icon: <Bot size={18} />, name: tr('คำรีวิว AI', 'Written review'), code: report.deep.status },
  ];
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr('สถานะข้อมูล', 'Evidence availability')}</h2>
      <ul className="grid gap-3">
        {rows.map((r) => (
          <li key={r.name} className="flex items-start gap-3">
            <span className="mt-0.5 text-slate-400">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{r.name}</div>
              <Badge tone={statusTone(r.code)} className="mt-1">{status(r.code)}</Badge>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4"><Note>{tr('การนับแหล่งข้อมูลไม่ใช่การวัดความแม่นยำ รายงานนี้จึงไม่แสดงค่าความมั่นใจเป็นเปอร์เซ็นต์',
        'Source availability does not measure accuracy; no numerical confidence is assigned.')}</Note></div>
    </Card>
  );
}
