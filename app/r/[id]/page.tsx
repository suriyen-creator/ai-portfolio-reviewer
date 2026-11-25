'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { Report } from '@/lib/types';
import { ApiError, loadReport } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Card } from '@/components/ui';
import { ReportView } from '@/components/ReportView';

export default function SharedReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tr } = useLang();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    loadReport(id).then(setReport).catch((e) => setError(e instanceof ApiError ? e.httpStatus : 500));
  }, [id]);

  if (error) {
    return (
      <Card className="mx-auto mt-16 max-w-md text-center">
        <h1 className="text-lg font-semibold">{error === 404 ? tr('ไม่พบรายงาน หรือรายงานหมดอายุแล้ว', 'Report not found or expired') : tr('เปิดรายงานไม่ได้ในขณะนี้', 'Unable to open this report right now')}</h1>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">{tr('สร้างรีวิวใหม่', 'Start a new review')}</Link>
      </Card>
    );
  }
  if (!report) return <div className="grid place-items-center py-32 text-slate-400"><Loader2 className="animate-spin" /></div>;
  return <div className="pt-10"><ReportView report={report} readOnly /></div>;
}
