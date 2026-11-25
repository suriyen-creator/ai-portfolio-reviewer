'use client';
import { useLang } from '@/lib/i18n';

export function Footer() {
  const { tr } = useLang();
  return (
    <footer className="no-print border-t border-rule">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-baseline justify-between gap-4 px-5 py-8 font-mono text-[11px] text-mute sm:px-8">
        <span>{tr('คะแนนเป็นเครื่องช่วยอ่านพอร์ตโฟลิโอ ไม่ใช่คำตัดสินจ้างงาน', 'Scores are a reading aid, not a hiring verdict.')}</span>
        <span>GitHub · Kaggle · Resume · Gemini</span>
      </div>
    </footer>
  );
}
