'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Report } from '@/lib/types';
import { ApiError, loadReport } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { Eyebrow } from '@/components/ui';
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
      <div className="mx-auto max-w-xl py-32">
        <Eyebrow index={String(error)}>{tr('ไม่พบรายงาน', 'Not found')}</Eyebrow>
        <h1 className="mt-6 font-serif text-5xl leading-tight">
          {error === 404 ? tr('ไม่พบรายงาน หรือรายงานหมดอายุแล้ว', 'This report does not exist or has expired.') : tr('เปิดรายงานไม่ได้ในขณะนี้', 'This report cannot be opened right now.')}
        </h1>
        <Link href="/" className="mt-8 inline-block underline decoration-accent underline-offset-4">{tr('สร้างรีวิวใหม่ →', 'Start a new review →')}</Link>
      </div>
    );
  }
  if (!report) return <div className="py-32 font-mono text-xs text-mute">{tr('กำลังโหลดรายงาน…', 'Loading report…')}</div>;
  return (
    <div className="pt-12">
      <Eyebrow className="mb-6">{tr('รายงานที่แชร์', 'Shared report')} · {id}</Eyebrow>
      <ReportView report={report} readOnly />
    </div>
  );
}
