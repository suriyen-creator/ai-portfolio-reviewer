'use client';
import type { AreaKey, Report } from '@/lib/types';
import { AREAS, WEIGHTS, grade, summarize, validScore } from '@/lib/score';
import { useLang } from '@/lib/i18n';
import { Eyebrow, Meter, Note, NumberTicker, cx, type Tone } from './ui';

export function useAreaLabel() {
  const { tr } = useLang();
  return (k: AreaKey) => ({ github: 'GitHub', resume: 'Resume', projects: tr('โปรเจกต์', 'Projects'), kaggle: 'Kaggle' })[k];
}

const toTone = (s: number | null): Tone => ({ good: 'good', mid: 'mid', low: 'low', muted: 'muted' } as const)[grade(s).tone];

export function BigScore({ score, size = 'lg', className }: { score: number | null; size?: 'md' | 'lg'; className?: string }) {
  return (
    <div className={cx('flex items-baseline gap-2', className)}>
      <NumberTicker value={score} decimals={1}
        className={cx('font-serif leading-[0.8] tracking-tight', size === 'lg' ? 'text-[7rem] sm:text-[9rem]' : 'text-[4.5rem] sm:text-[5.5rem]')} />
      <span className="font-mono text-sm text-mute">/100</span>
    </div>
  );
}

export function ScoreSummary({ report }: { report: Report }) {
  const { tr } = useLang();
  const label = useAreaLabel();
  const summary = summarize(report);
  const partial = !summary.complete || report.github.status === 'partial' || report.kaggle.status === 'partial';

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <Eyebrow>{tr('คะแนนประเมิน', 'Estimated score')} · {report.track}</Eyebrow>
        <BigScore score={summary.score} className="mt-4" />
        {summary.score === null && (
          <Note tone="info" className="mt-4">{tr('ยังไม่มีข้อมูลเพียงพอสำหรับคำนวณคะแนน ตรวจสถานะของแต่ละแหล่งด้านล่าง', 'There is not enough evidence to calculate a score. Check each source below.')}</Note>
        )}
      </div>
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink font-mono text-[11px] uppercase tracking-caps text-mute">
              <th className="pb-2 text-left font-normal">{tr('ด้าน', 'Area')}</th>
              <th className="w-2/5 pb-2 font-normal" />
              <th className="pb-2 text-right font-normal">{tr('คะแนน', 'Score')}</th>
              <th className="pb-2 text-right font-normal">{tr('น้ำหนัก', 'Weight')}</th>
            </tr>
          </thead>
          <tbody>
            {AREAS.map((k, i) => {
              const s = summary.scores[k];
              const ok = validScore(s);
              const base = WEIGHTS[report.track][k];
              const applied = summary.weights[k] ?? 0;
              return (
                <tr key={k} className="border-b border-rule">
                  <td className="py-3 pr-4">{label(k)}</td>
                  <td className="py-3 pr-4"><Meter pct={ok ? s : 0} tone={toTone(ok ? s : null)} delay={0.1 + i * 0.08} /></td>
                  <td className="py-3 text-right font-mono tabular-nums">{ok ? s.toFixed(1) : '—'}</td>
                  <td className="py-3 pl-4 text-right font-mono text-xs tabular-nums text-mute">
                    {ok && Math.abs(applied - base) > 1e-9
                      ? <><s className="opacity-60">{(base * 100).toFixed(0)}%</s> {(applied * 100).toFixed(0)}%</>
                      : ok ? `${(base * 100).toFixed(0)}%` : <s className="opacity-60">{(base * 100).toFixed(0)}%</s>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 grid gap-2">
          {partial && summary.score !== null && (
            <Note tone="warn">{tr('ประเมินไม่ครบทุกด้าน คะแนนคำนวณจากข้อมูลที่มีและปรับน้ำหนักใหม่ ไม่ควรเทียบตรงกับรายงานที่มีข้อมูลครบ',
              'Incomplete assessment. Weights are normalized over available scores; comparison with fully evidenced reports is limited.')}</Note>
          )}
          <Note>{tr('คะแนนเป็นเกณฑ์ของแอปและการประมาณจาก AI ไม่ใช่ข้อยืนยันความสามารถหรือคำตัดสินจ้างงาน',
            'Scores combine app heuristics and AI estimates, and do not establish ability or a hiring decision.')}</Note>
        </div>
      </div>
    </div>
  );
}
