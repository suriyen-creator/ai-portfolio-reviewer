import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Instrument_Serif, Noto_Serif_Thai } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

const plex = IBM_Plex_Sans_Thai({ subsets: ['latin', 'thai'], weight: ['400', '500', '600'], variable: '--font-plex' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument' });
const serifThai = Noto_Serif_Thai({ subsets: ['thai'], weight: ['400', '500'], variable: '--font-serif-thai' });

export const metadata: Metadata = {
  title: 'Portfolio Review',
  description: 'Review GitHub, resume and Kaggle work, with sources you can inspect.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning
      className={`${plex.variable} ${plexMono.variable} ${instrument.variable} ${serifThai.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-[1200px] px-5 pb-24 sm:px-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
