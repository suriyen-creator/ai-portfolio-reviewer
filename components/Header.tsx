'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { Segmented, cx } from './ui';

export function Header() {
  const { lang, setLang, tr } = useLang();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);

  // Review → Compare reads as "forward"; going back to Review slides the other way.
  const nav = [
    { href: '/', label: tr('รีวิว', 'Review'), types: ['nav-back'] },
    { href: '/compare', label: tr('เทียบโปรไฟล์', 'Compare'), types: ['nav-forward'] },
  ];
  return (
    <header style={{ viewTransitionName: 'site-header' }}
      className="no-print sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-5 px-5 sm:gap-8 sm:px-8">
        <Link href="/" transitionTypes={['nav-back']} className="flex items-baseline gap-2">
          <span className="font-serif text-2xl leading-none">Portfolio</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-caps text-mute sm:inline">Review</span>
        </Link>
        <nav className="flex gap-4 whitespace-nowrap text-sm sm:gap-5">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} transitionTypes={n.types}
              className={cx('transition-colors', path === n.href ? 'text-ink underline decoration-accent decoration-2 underline-offset-[6px]' : 'text-mute hover:text-ink')}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4 sm:gap-5">
          <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'TH', label: 'TH' }, { value: 'EN', label: 'EN' }]} />
          <button aria-label={tr('สลับธีม', 'Toggle theme')} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="font-mono text-xs text-mute transition-colors hover:text-ink">
            {mounted ? (resolvedTheme === 'dark' ? tr('สว่าง', 'Light') : tr('มืด', 'Dark')) : ' '}
          </button>
        </div>
      </div>
    </header>
  );
}
