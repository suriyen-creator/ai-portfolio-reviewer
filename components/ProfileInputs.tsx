'use client';
import { useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '@/lib/i18n';
import { TextInput, cx } from './ui';

export interface ProfileValue { github: string; kaggle: string; file: File | null }
export const emptyProfile: ProfileValue = { github: '', kaggle: '', file: null };
export const MAX_PDF_BYTES = 4_000_000;

function Row({ index, label, hint, htmlFor, children }: { index: string; label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-rule py-5 sm:grid-cols-[2.5rem_11rem_1fr]">
      <span className="pt-3 font-mono text-xs text-accent">{index}</span>
      <label htmlFor={htmlFor} className="pt-2.5 text-sm font-medium sm:pt-3">
        {label}{hint && <span className="mt-0.5 block font-mono text-[11px] font-normal text-mute">{hint}</span>}
      </label>
      <div className="col-start-2 min-w-0 sm:col-start-3">{children}</div>
    </div>
  );
}

export function ProfileInputs({ value, onChange, idPrefix = '', startIndex = 1 }:
  { value: ProfileValue; onChange: (v: ProfileValue) => void; idPrefix?: string; startIndex?: number }) {
  const { tr } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const n = (i: number) => String(startIndex + i).padStart(2, '0');

  const pick = (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError(tr('รองรับเฉพาะไฟล์ PDF', 'Only PDF files are supported'));
    if (file.size > MAX_PDF_BYTES) return setError(tr('ไฟล์ PDF ต้องไม่เกิน 4 MB', 'PDF must be at most 4 MB'));
    onChange({ ...value, file });
  };

  return (
    <div className="border-b border-rule">
      <Row index={n(0)} label="GitHub" hint={tr('username หรือลิงก์', 'username or URL')} htmlFor={idPrefix + 'github'}>
        <TextInput id={idPrefix + 'github'} placeholder="octocat" value={value.github}
          onChange={(e) => onChange({ ...value, github: e.target.value })} autoComplete="off" spellCheck={false} />
      </Row>
      <Row index={n(1)} label="Kaggle" hint={tr('username หรือลิงก์', 'username or URL')} htmlFor={idPrefix + 'kaggle'}>
        <TextInput id={idPrefix + 'kaggle'} placeholder="kaggle.com/username" value={value.kaggle}
          onChange={(e) => onChange({ ...value, kaggle: e.target.value })} autoComplete="off" spellCheck={false} />
      </Row>
      <Row index={n(2)} label="Resume / CV" hint={tr('PDF ≤ 4 MB, 30 หน้า', 'PDF ≤ 4 MB, 30 pages')}>
        <AnimatePresence mode="wait" initial={false}>
          {value.file ? (
            <motion.div key="file" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex items-baseline gap-3 border-b border-ink py-2.5">
              <span className="min-w-0 flex-1 truncate">{value.file.name}</span>
              <span className="font-mono text-[11px] text-mute">{(value.file.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => onChange({ ...value, file: null })}
                className="font-mono text-[11px] text-mute underline underline-offset-4 hover:text-accent">{tr('ลบ', 'remove')}</button>
            </motion.div>
          ) : (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              role="button" tabIndex={0}
              onClick={() => input.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              className={cx('flex cursor-pointer items-baseline justify-between gap-3 border border-dashed px-4 py-4 transition-colors',
                drag ? 'border-accent bg-accent/5' : 'border-rule hover:border-ink')}>
              <span className="text-sm">{drag ? tr('ปล่อยไฟล์ได้เลย', 'Drop it') : tr('ลากไฟล์มาวาง หรือคลิกเพื่อเลือก', 'Drop a file, or click to browse')}</span>
              <span className="font-mono text-[11px] text-mute">.pdf</span>
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      </Row>
    </div>
  );
}
