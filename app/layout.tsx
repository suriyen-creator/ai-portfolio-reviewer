import type { Metadata } from 'next';
import { Inter, Noto_Sans_Thai } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const thai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-thai' });

export const metadata: Metadata = {
  title: 'Portfolio Review',
  description: 'Review GitHub, resume and Kaggle work, with sources you can inspect.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={`${inter.variable} ${thai.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>
          <div className="bg-grid min-h-screen">
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
