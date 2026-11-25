'use client';
import clsx from 'clsx';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

export const cx = clsx;
const EASE = [0.2, 0.8, 0.2, 1] as const;

/* ---------- Typography ---------- */

/** Small mono label, optionally numbered: "01 — GitHub". */
export function Eyebrow({ index, children, className }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx('font-mono text-[11px] uppercase tracking-caps text-mute', className)}>
      {index && <span className="text-accent">{index}</span>}{index && <span className="mx-2">—</span>}{children}
    </div>
  );
}

/** Editorial section: label column on the left, content on the right, hairline on top. */
export function Section({ index, label, aside, children, className }:
  { index?: string; label: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('grid gap-6 border-t border-ink py-8 md:grid-cols-12 md:gap-8', className)}>
      <div className="md:col-span-3">
        <Eyebrow index={index}>{label}</Eyebrow>
        {aside && <div className="mt-4">{aside}</div>}
      </div>
      <div className="min-w-0 md:col-span-9">{children}</div>
    </section>
  );
}

export function Note({ children, tone = 'muted', className }: { children: ReactNode; tone?: 'muted' | 'warn' | 'info'; className?: string }) {
  return (
    <p className={cx('text-xs leading-relaxed',
      tone === 'muted' && 'text-mute',
      tone === 'warn' && 'border-l-2 border-warn pl-3 text-ink',
      tone === 'info' && 'border-l-2 border-accent pl-3 text-ink', className)}>
      {children}
    </p>
  );
}

/* ---------- Controls ---------- */

type Variant = 'primary' | 'secondary' | 'ghost';
export function Button({ variant = 'primary', className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button {...props}
      className={cx('group inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-ink px-5 py-3 text-paper hover:bg-accent',
        variant === 'secondary' && 'border border-ink px-4 py-2 hover:bg-ink hover:text-paper',
        variant === 'ghost' && 'px-1 py-1 underline decoration-rule underline-offset-4 hover:decoration-accent',
        className)}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={cx('inline-flex items-center gap-1 font-mono text-[11px] text-mute underline decoration-rule underline-offset-4 transition-colors hover:text-accent hover:decoration-accent', className)}>
      {children}<span aria-hidden>↗</span>
    </a>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={cx('w-full border-0 border-b border-rule bg-transparent px-0 py-2.5 text-base outline-none transition-colors placeholder:text-mute/60',
        'focus:border-ink focus-visible:outline-none', className)} />
  );
}

/** Text options with a sliding underline (layoutId), a 21st.dev-style segmented control. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md' }:
  { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  const id = useId();
  return (
    <div className={cx('inline-flex', size === 'sm' ? 'gap-3' : 'gap-5')} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('relative pb-1 transition-colors', size === 'sm' ? 'font-mono text-xs' : 'text-sm font-medium',
            value === o.value ? 'text-ink' : 'text-mute hover:text-ink')}>
          {o.label}
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-x-0 -bottom-px h-px bg-accent"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
          )}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="mb-6 flex gap-6 border-b border-rule" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors',
            value === t.value ? 'text-ink' : 'text-mute hover:text-ink')}>
          {t.label}
          {value === t.value && (
            <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Status ---------- */

export type Tone = 'good' | 'mid' | 'low' | 'muted' | 'info';
const toneColor: Record<Tone, string> = { good: 'bg-good', mid: 'bg-warn', low: 'bg-accent', muted: 'bg-mute/40', info: 'bg-ink' };

/** Square marker + text. Replaces pill badges. */
export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-baseline gap-2 text-xs text-ink', className)}>
      <span className={cx('inline-block size-2 shrink-0 translate-y-[-1px]', toneColor[tone])} aria-hidden />{children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center border border-rule px-2 py-0.5 font-mono text-[11px] text-mute', className)}>{children}</span>;
}

/* ---------- Motion ---------- */

/** Fade/slide in once when scrolled into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Counts up to `value` when visible (Magic UI / 21st.dev "number ticker" pattern). */
export function NumberTicker({ value, decimals = 0, className }: { value: number | null; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value === null || !inView) return;
    if (reduce) { setShown(value); return; }
    const controls = animate(0, value, { duration: 1.1, ease: EASE, onUpdate: setShown });
    return () => controls.stop();
  }, [value, inView, reduce]);
  return <span ref={ref} className={cx('tabular-nums', className)}>{value === null ? '—' : shown.toFixed(decimals)}</span>;
}

/** Thin bar that grows to `pct` when visible. */
export function Meter({ pct, tone = 'info', delay = 0 }: { pct: number; tone?: Tone; delay?: number }) {
  return (
    <div className="h-[3px] w-full bg-rule">
      <motion.div className={cx('h-full', toneColor[tone])} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE, delay }} />
    </div>
  );
}

// lucide-react no longer ships brand logos, so the GitHub mark is inlined here.
export function Github({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
