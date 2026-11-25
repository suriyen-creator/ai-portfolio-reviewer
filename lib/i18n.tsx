'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './types';

type Pair = readonly [th: string, en: string];

// Ported from the former Streamlit app.py (STATUS / LIMITS / tr strings).
export const STATUS: Record<string, Pair> = {
  ok: ['ตรวจข้อมูลได้', 'Available'],
  partial: ['ตรวจข้อมูลได้บางส่วน', 'Partial evidence'],
  not_provided: ['ไม่ได้ระบุข้อมูล', 'Not provided'],
  empty: ['ไม่พบประวัติที่แสดงบนโปรไฟล์', 'No results displayed on the public profile'],
  not_found: ['ไม่พบโปรไฟล์ที่ URL นี้ โปรดตรวจลิงก์', 'Profile not found at this URL; check the link'],
  blocked: ['เว็บไซต์ไม่อนุญาตให้เข้าถึง ลองเปิดลิงก์ต้นทาง', 'Access denied; check the source page'],
  rate_limited: ['ถึงขีดจำกัดการเรียกข้อมูล กรุณาลองใหม่ภายหลัง', 'Rate limit reached; try again later'],
  unavailable: ['ยังอ่านข้อมูลไม่ได้ ลองตรวจที่แหล่งข้อมูลโดยตรง', 'Unable to read evidence; check the source directly'],
  invalid_username: ['รูปแบบ username หรือลิงก์ไม่ถูกต้อง', 'Invalid username or profile URL'],
  ai_unconfigured: ['ยังไม่ได้ตั้งค่า GEMINI_API_KEY จึงยังไม่มีคำรีวิวจาก AI', 'Set GEMINI_API_KEY to enable the written review'],
  ai_unavailable: ['บริการรีวิวไม่พร้อมใช้งาน ลองวิเคราะห์ใหม่ภายหลัง', 'Review service unavailable; try again later'],
  invalid_response: ['บริการรีวิวส่งข้อมูลไม่ครบ จึงยังไม่นำมาคิดคะแนน', 'Review response was invalid and excluded from scoring'],
  pdf_unreadable: ['อ่าน PDF ไม่ได้ กรุณาตรวจไฟล์หรือส่งไฟล์ที่ไม่เข้ารหัส', 'Cannot read this PDF; check the file or use an unencrypted copy'],
  pdf_no_text: ['PDF ไม่มีข้อความที่อ่านได้ กรุณาใช้ไฟล์ที่เลือกข้อความได้', 'No extractable text; use a text-based PDF'],
  pdf_too_large: ['ไฟล์ PDF ต้องไม่เกิน 4 MB', 'PDF must be at most 4 MB'],
  pdf_too_many_pages: ['PDF ต้องไม่เกิน 30 หน้า', 'PDF must be at most 30 pages'],
  pdf_too_much_text: ['ข้อความใน PDF ยาวเกิน 60,000 ตัวอักษร', 'PDF text exceeds 60,000 characters'],
};

export const LIMITS: Record<string, Pair> = {
  public_profile_only: ['ประวัติที่ซ่อนหรือไม่เปิดเผยจะไม่รวมในรายงาน', 'Hidden or private history is not included.'],
  kaggle_website_api: ['ดึงจากข้อมูลสาธารณะของเว็บไซต์ Kaggle ซึ่งอาจเปลี่ยนรูปแบบหรือจำกัดการเข้าถึงได้ แสดงเฉพาะประวัติที่เปิดเผยของการแข่งขันที่จบแล้ว', 'Read from Kaggle’s public website interface, which may change or restrict access. Only visible results from completed competitions are included.'],
  kaggle_partial: ['ประวัติการแข่งขันอ่านได้ไม่ครบ คะแนนใช้เฉพาะผลที่ดึงได้', 'Competition history is incomplete; scores use only the retrieved results.'],
  github_sampled: ['สถิติใช้ repo ที่อัปเดตล่าสุดสูงสุด 100 รายการ', 'Statistics cover at most the 100 most recently updated public repositories.'],
  github_files_unavailable: ['ไฟล์บางส่วนอ่านไม่ได้ สถานะนั้นจึงยังยืนยันไม่ได้', 'Some repository files were inaccessible; their status remains unverified.'],
};

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; tr: (th: string, en: string) => string; trp: (p: Pair) => string }
const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('TH');
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'TH' || saved === 'EN') setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang === 'TH' ? 'th' : 'en'; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('lang', l); };
  const tr = (th: string, en: string) => (lang === 'TH' ? th : en);
  return <Ctx.Provider value={{ lang, setLang, tr, trp: (p) => tr(p[0], p[1]) }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}

export function useStatusText() {
  const { trp } = useLang();
  return (code: string) => trp(STATUS[code] ?? STATUS.unavailable);
}
