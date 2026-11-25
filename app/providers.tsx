'use client';
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'motion/react';
import { LangProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <LangProvider>{children}</LangProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
