'use client';
import { motion } from 'motion/react';
import type { Step, StepState } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { cx } from './ui';

/** Step list styled as a quiet log: [ ok ] github ... */
export function ReviewProgress({ steps }: { steps: Record<Step, StepState> }) {
  const { tr } = useLang();
  const labels: Record<Step, string> = {
    github: tr('อ่าน GitHub', 'reading GitHub'),
    kaggle: tr('อ่าน Kaggle', 'reading Kaggle'),
    resume: tr('อ่าน Resume', 'reading resume'),
    review: tr('AI เขียนรีวิว', 'AI review'),
  };
  const mark = { idle: '  ·  ', running: ' ··· ', done: ' ok  ', skipped: ' —   ' } as const;
  return (
    <ol className="grid gap-1 font-mono text-xs" aria-live="polite">
      {(Object.keys(labels) as Step[]).map((step, i) => {
        const s = steps[step];
        return (
          <motion.li key={step} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className={cx('flex gap-3 whitespace-pre', s === 'skipped' || s === 'idle' ? 'text-mute/60' : 'text-ink')}>
            <span className={cx(s === 'done' && 'text-good', s === 'running' && 'animate-pulse text-accent')}>[{mark[s]}]</span>
            <span>{labels[step]}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
