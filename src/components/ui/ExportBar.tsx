'use client';

import { useState } from 'react';
import type { SimResult } from '@/lib/calc/types';

interface Props {
  resultA: SimResult;
  resultB?: SimResult | null;
}

export function ExportBar({ resultA, resultB = null }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsLoading, setXlsLoading] = useState(false);

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const { exportPDF } = await import('@/lib/export/pdf');
      await exportPDF(resultA, resultB);
    } catch (e) {
      console.error('PDF export error', e);
      alert('PDF出力でエラーが発生しました。');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcel = async () => {
    setXlsLoading(true);
    try {
      const { exportExcel } = await import('@/lib/export/excel');
      await exportExcel(resultA, resultB);
    } catch (e) {
      console.error('Excel export error', e);
      alert('Excel出力でエラーが発生しました。');
    } finally {
      setXlsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePDF}
        disabled={pdfLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-navy-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5 text-danger" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 0h5.586L14 4.414V16H4V0zm1 1v14h8V5h-4V1H5zm5 0v3h3l-3-3zM2 3H1v12h1V3zM0 4h1v10H0V4z" />
        </svg>
        {pdfLoading ? '生成中...' : 'PDF出力'}
      </button>

      <button
        onClick={handleExcel}
        disabled={xlsLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-navy-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5 text-success" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 0h5.586L14 4.414V16H4V0zm1 1v14h8V5h-4V1H5zm5 0v3h3l-3-3z" />
          <path d="M6 7h4v1H6V7zm0 2h4v1H6V9zm0 2h4v1H6v-1z" />
        </svg>
        {xlsLoading ? '生成中...' : 'Excel出力'}
      </button>
    </div>
  );
}
