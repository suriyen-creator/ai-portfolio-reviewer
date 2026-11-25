'use client';
import { Check, Loader2, Minus } from 'lucide-react';
import type { Step, StepState } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { cx } from './ui';

export function ReviewProgress({ steps }: { steps: Record<Step, StepState> }) {
  const { tr } = useLang();
  const labels: Record<Step, string> = {
    github: tr('อ่าน GitHub', 'Reading GitHub'),
    kaggle: tr('อ่าน Kaggle', 'Reading Kaggle'),
    resume: tr('อ่าน Resume', 'Reading resume'),
    review: tr('AI สรุปผล', 'AI review'),
  };
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
      {(Object.keys(labels) as Step[]).map((step) => {
        const s = steps[step];
        return (
          <li key={step} className={cx('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
            s === 'running' && 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300',
            s === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
            (s === 'idle' || s === 'skipped') && 'border-slate-200 text-slate-400 dark:border-slate-800')}>
            {s === 'running' ? <Loader2 size={16} className="animate-spin" /> : s === 'done' ? <Check size={16} /> : <Minus size={16} />}
            {labels[step]}
          </li>
        );
      })}
    </ol>
  );
}
