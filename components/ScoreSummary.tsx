'use client';
import { AlertTriangle } from 'lucide-react';
import type { AreaKey, Report } from '@/lib/types';
import { AREAS, WEIGHTS, grade, summarize, validScore } from '@/lib/score';
import { useLang } from '@/lib/i18n';
import { Card, Note, cx } from './ui';

const ringColor = { good: '#10b981', mid: '#f59e0b', low: '#f43f5e', muted: '#94a3b8' };
const barColor = { good: 'bg-emerald-500', mid: 'bg-amber-500', low: 'bg-rose-500', muted: 'bg-slate-300' };

export function useAreaLabel() {
  const { tr } = useLang();
  return (k: AreaKey) => ({ github: 'GitHub', resume: 'Resume', projects: tr('โปรเจกต์', 'Projects'), kaggle: 'Kaggle' })[k];
}

export function ScoreGauge({ score, size = 168 }: { score: number | null; size?: number }) {
  const stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const { tone } = grade(score);
  const pct = score === null ? 0 : score / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100 dark:stroke-slate-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={ringColor[tone]} strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{score === null ? '—' : score.toFixed(1)}</div>
          <div className="text-xs text-slate-500">/ 100</div>
        </div>
      </div>
    </div>
  );
}

export function ScoreSummary({ report }: { report: Report }) {
  const { tr } = useLang();
  const label = useAreaLabel();
  const summary = summarize(report);
  const partial = !summary.complete || report.github.status === 'partial' || report.kaggle.status === 'partial';

  return (
    <Card className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
      <div className="flex flex-col items-center gap-2">
        <ScoreGauge score={summary.score} />
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{tr('คะแนนประเมิน', 'Estimated score')}</div>
        <div className="text-xs text-slate-500">{tr('สายงาน: ', 'Track: ')}{report.track}</div>
      </div>
      <div className="grid gap-4">
        <ul className="grid gap-3">
          {AREAS.map((k) => {
            const s = summary.scores[k];
            const ok = validScore(s);
            const applied = summary.weights[k] ?? 0;
            return (
              <li key={k}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{label(k)}</span>
                  <span className="text-xs text-slate-500">
                    <span className="mr-2 font-semibold tabular-nums text-slate-800 dark:text-slate-100">{ok ? s!.toFixed(1) : '—'}</span>
                    {tr('น้ำหนัก ', 'weight ')}{(WEIGHTS[report.track][k] * 100).toFixed(0)}%
                    {ok && Math.abs(applied - WEIGHTS[report.track][k]) > 1e-9 && <> → {(applied * 100).toFixed(1)}%</>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={cx('h-full rounded-full transition-all duration-700', barColor[grade(ok ? s : null).tone])} style={{ width: `${ok ? s : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        {summary.score === null && (
          <Note tone="info">{tr('ยังไม่มีข้อมูลเพียงพอสำหรับคำนวณคะแนน ตรวจสถานะของแต่ละแหล่งด้านล่าง', 'There is not enough evidence to calculate a score. Check each source below.')}</Note>
        )}
        {partial && summary.score !== null && (
          <Note tone="warn">
            <AlertTriangle size={14} className="mr-1 inline -translate-y-px" />
            {tr('ประเมินไม่ครบทุกด้าน คะแนนคำนวณจากข้อมูลที่มีและปรับน้ำหนักใหม่ ไม่ควรเทียบตรงกับรายงานที่มีข้อมูลครบ',
              'Incomplete assessment. Weights are normalized over available scores; comparison with fully evidenced reports is limited.')}
          </Note>
        )}
        <Note>{tr('คะแนนเป็นเกณฑ์ของแอปและการประมาณจาก AI ไม่ใช่ข้อยืนยันความสามารถหรือคำตัดสินจ้างงาน',
          'Scores combine app heuristics and AI estimates, and do not establish ability or a hiring decision.')}</Note>
      </div>
    </Card>
  );
}
