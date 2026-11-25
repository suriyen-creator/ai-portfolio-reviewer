'use client';
import { useRef, useState } from 'react';
import { FileText, Trophy, Upload, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Field, Github, TextInput, cx } from './ui';

export interface ProfileValue { github: string; kaggle: string; file: File | null }
export const emptyProfile: ProfileValue = { github: '', kaggle: '', file: null };
export const MAX_PDF_BYTES = 4_000_000;

export function ProfileInputs({ value, onChange, idPrefix = '' }: { value: ProfileValue; onChange: (v: ProfileValue) => void; idPrefix?: string }) {
  const { tr } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  const pick = (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError(tr('รองรับเฉพาะไฟล์ PDF', 'Only PDF files are supported'));
    if (file.size > MAX_PDF_BYTES) return setError(tr('ไฟล์ PDF ต้องไม่เกิน 4 MB', 'PDF must be at most 4 MB'));
    onChange({ ...value, file });
  };

  return (
    <div className="grid gap-4">
      <Field label={tr('GitHub username หรือลิงก์โปรไฟล์', 'GitHub username or profile URL')}>
        <div className="relative">
          <Github size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <TextInput id={idPrefix + 'github'} className="pl-9" placeholder="octocat" value={value.github}
            onChange={(e) => onChange({ ...value, github: e.target.value })} autoComplete="off" />
        </div>
      </Field>
      <Field label={tr('Kaggle username หรือลิงก์โปรไฟล์', 'Kaggle username or profile URL')}>
        <div className="relative">
          <Trophy size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <TextInput id={idPrefix + 'kaggle'} className="pl-9" placeholder="kaggle.com/username" value={value.kaggle}
            onChange={(e) => onChange({ ...value, kaggle: e.target.value })} autoComplete="off" />
        </div>
      </Field>
      <Field label={tr('Resume / CV (PDF สูงสุด 4 MB, 30 หน้า)', 'Resume / CV (PDF, up to 4 MB and 30 pages)')}>
        {value.file ? (
          <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <FileText size={18} className="text-brand-600 dark:text-brand-400" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{value.file.name}</span>
            <span className="text-xs text-slate-500">{(value.file.size / 1024 / 1024).toFixed(1)} MB</span>
            <button type="button" aria-label={tr('ลบไฟล์', 'Remove file')} onClick={() => onChange({ ...value, file: null })}
              className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800"><X size={16} /></button>
          </div>
        ) : (
          <div role="button" tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            className={cx('flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm transition',
              drag ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-brand-400 dark:border-slate-700')}>
            <Upload size={20} className="text-slate-400" />
            <span className="font-medium text-slate-600 dark:text-slate-300">{tr('ลากไฟล์มาวาง หรือคลิกเพื่อเลือก', 'Drop a file here or click to browse')}</span>
            <span className="text-xs text-slate-400">PDF</span>
          </div>
        )}
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
      </Field>
    </div>
  );
}
