'use client';
import { ViewTransition, type ReactNode } from 'react';

/** Directional slide between routes (Next.js view-transitions guide, step 3). Put it in each page, not the layout. */
export function PageTransition({ children }: { children: ReactNode }) {
  const types = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' };
  return <ViewTransition enter={types} exit={types} default="none">{children}</ViewTransition>;
}
