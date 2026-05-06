'use client';

import { useState, useEffect, useRef } from 'react';
import type { SimResult } from '@/lib/calc/types';

interface Props {
  resultA: SimResult;
  resultB?: SimResult | null;
}

export function ExportBar({ resultA, resultB = null }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsLoading, setXlsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const { exportPDF } = await import('@/lib/export/pdf');
      await exportPDF(resultA, resultB);
      showToast('PDFを出力しました', true);
    } catch (e) {
      console.error('PDF export error', e);
      showToast('PDF出力でエラーが発生しました', false);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcel = async () => {
    setXlsLoading(true);
    try {
      const { exportExcel } = await import('@/lib/export/excel');
      await exportExcel(resultA, resultB);
      showToast('Excelを出力しました', true);
    } catch (e) {
      console.error('Excel export error', e);
      showToast('Excel出力でエラーが発生しました', false);
    } finally {
      setXlsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Success / error toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-0 -bottom-9 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md whitespace-nowrap transition-all
            ${toast.ok ? 'bg-success-50 border border-success-200 text-success-700' : 'bg-danger-50 border border-danger-200 text-danger-700'}`}
        >
          <span>{toast.ok ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2" role="group" aria-label="エクスポート">
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          aria-busy={pdfLoading}
          aria-label={pdfLoading ? 'PDF生成中' : 'PDF出力'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-navy-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          {pdfLoading ? (
            <svg aria-hidden="true" className="w-3.5 h-3.5 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-danger-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 0h5.586L14 4.414V16H4V0zm1 1v14h8V5h-4V1H5zm5 0v3h3l-3-3zM2 3H1v12h1V3zM0 4h1v10H0V4z" />
            </svg>
          )}
          {pdfLoading ? '生成中...' : 'PDF出力'}
        </button>

        <button
          onClick={handleExcel}
          disabled={xlsLoading}
          aria-busy={xlsLoading}
          aria-label={xlsLoading ? 'Excel生成中' : 'Excel出力'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-navy-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          {xlsLoading ? (
            <svg aria-hidden="true" className="w-3.5 h-3.5 animate-spin text-success-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-success-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 0h5.586L14 4.414V16H4V0zm1 1v14h8V5h-4V1H5zm5 0v3h3l-3-3z" />
              <path d="M6 7h4v1H6V7zm0 2h4v1H6V9zm0 2h4v1H6v-1z" />
            </svg>
          )}
          {xlsLoading ? '生成中...' : 'Excel出力'}
        </button>
      </div>
    </div>
  );
}
