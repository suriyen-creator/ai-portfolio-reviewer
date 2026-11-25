'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { GitCompareArrows, Moon, ScanSearch, Sun } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Segmented, cx } from './ui';

export function Header() {
  const { lang, setLang, tr } = useLang();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);

  const nav = [
    { href: '/', label: tr('รีวิว', 'Review'), icon: <ScanSearch size={16} /> },
    { href: '/compare', label: tr('เทียบโปรไฟล์', 'Compare'), icon: <GitCompareArrows size={16} /> },
  ];
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-md shadow-brand-500/30">
            <ScanSearch size={18} />
          </span>
          <span className="hidden sm:inline">Portfolio Review</span>
        </Link>
        <nav className="flex gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                path === n.href ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')}>
              {n.icon}<span className="hidden sm:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'TH', label: 'ไทย' }, { value: 'EN', label: 'EN' }]} />
          <button aria-label={tr('สลับธีม', 'Toggle theme')} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
