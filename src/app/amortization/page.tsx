'use client';
import { useState } from 'react';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen } from '@/lib/format';
import { SimInput } from '@/lib/calc/types';

type AnnualRow = {
  year: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  endBalance: number;
  cumInterest: number;
};

async function exportAmortPDF(annualRows: AnnualRow[], input: SimInput) {
  const yenFmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');
  const { jsPDF } = await import('jspdf');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const NAVY: [number, number, number] = [28, 43, 74];

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TERASS Amortization Schedule — ${input.propertyName}`, 14, 12);

  (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
    startY: 22,
    head: [['年', '年間返済額', 'うち利息', 'うち元金', '残高', '累計利息']],
    body: annualRows.map(r => [
      r.year + '年',
      yenFmt(r.totalPayment), yenFmt(r.totalInterest),
      yenFmt(r.totalPrincipal), yenFmt(r.endBalance), yenFmt(r.cumInterest),
    ]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`TERASS_返済スケジュール_${input.propertyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
}

export default function AmortizationPage() {
  const { resultA, resultB, activePattern } = useSimStore();
  const result = activePattern === 'B' ? resultB : resultA;
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual');

  const rows = result.amortization;
  // Annual summary
  const annualRows = Array.from({ length: result.input.termYears }, (_, i) => {
    const yr = rows.filter(r => r.year === i + 1);
    return {
      year: i + 1,
      totalPayment: yr.reduce((s,r) => s + r.payment, 0),
      totalInterest: yr.reduce((s,r) => s + r.interest, 0),
      totalPrincipal: yr.reduce((s,r) => s + r.principal, 0),
      endBalance: yr[yr.length - 1]?.balance ?? 0,
      cumInterest: yr[yr.length - 1]?.cumInterest ?? 0,
    };
  });

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">返済スケジュール</h1><p className="text-xs text-navy-100">{result.input.termYears}年 × 12ヶ月 ＝ {result.input.termYears * 12}回</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportAmortPDF(annualRows, result.input)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            📄 PDF出力
          </button>
          <div className="flex gap-1 bg-navy-600 rounded p-1">
            {(['annual','monthly'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === m ? 'bg-orange-500 text-white' : 'text-navy-100 hover:text-white'}`}>
                {m === 'annual' ? '年次' : '月次'}
              </button>
            ))}
          </div>
          <PatternToggle />
        </div>
      </div>
      <div className="p-6">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            {viewMode === 'annual' ? (
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr>
                    {['年','年間返済額','うち利息','うち元金','残高','累計利息'].map(h => (
                      <th key={h} className="table-header whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {annualRows.map((r, i) => (
                    <tr key={r.year} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="px-3 py-2 text-center font-bold">{r.year}年</td>
                      <td className="px-3 py-2 text-right">{yen(r.totalPayment)}</td>
                      <td className="px-3 py-2 text-right text-danger-500">{yen(r.totalInterest)}</td>
                      <td className="px-3 py-2 text-right text-success-500">{yen(r.totalPrincipal)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{yen(r.endBalance)}</td>
                      <td className="px-3 py-2 text-right text-neutral-400">{yen(r.cumInterest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr>
                    {['No.','年','月','返済額','利息','元金','残高'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.no} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="px-2 py-1.5 text-center text-neutral-400">{r.no}</td>
                      <td className="px-2 py-1.5 text-center">{r.year}</td>
                      <td className="px-2 py-1.5 text-center">{r.month}</td>
                      <td className="px-2 py-1.5 text-right">{yen(r.payment)}</td>
                      <td className="px-2 py-1.5 text-right text-danger-500">{yen(r.interest)}</td>
                      <td className="px-2 py-1.5 text-right text-success-500">{yen(r.principal)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{yen(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
