'use client';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export const cx = clsx;

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6',
      'dark:border-slate-800 dark:bg-slate-900/70', className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ icon, children, aside }: { icon?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        {icon && <span className="text-brand-500">{icon}</span>}{children}
      </h2>
      {aside}
    </div>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost';
export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        className)}
    />
  );
}

export function LinkButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={cx('inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-600',
        'dark:border-slate-700 dark:text-slate-300 dark:hover:text-brand-400', className)}>
      {children}
    </a>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={cx('w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400',
        'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950', className)} />
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }:
  { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('rounded-lg font-medium transition', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm',
            value === o.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type Tone = 'good' | 'mid' | 'low' | 'muted' | 'info';
const tones: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  mid: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  low: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
  muted: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400',
  info: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-400',
};
export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>{children}</span>;
}

export function Note({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'warn' | 'info' }) {
  return (
    <p className={cx('text-xs leading-relaxed',
      tone === 'muted' && 'text-slate-500 dark:text-slate-400',
      tone === 'warn' && 'rounded-xl bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
      tone === 'info' && 'rounded-xl bg-brand-50 px-3 py-2 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400')}>
      {children}
    </p>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-5 flex gap-1 border-b border-slate-200 dark:border-slate-800" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition',
            value === t.value ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}>
          {t.label}
        </button>
      ))}
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
