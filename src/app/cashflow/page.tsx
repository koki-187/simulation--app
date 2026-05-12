'use client';
import { useMemo, useState } from 'react';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen } from '@/lib/format';
import { CFRow, SimInput, SimResult } from '@/lib/calc/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

async function exportCashflowPDF(
  resultA: SimResult,
  resultB: SimResult,
  activePattern: string,
) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');
  const { cashflowSectionHtml } = await import('@/lib/pdf/sectionHtml');
  const today = new Date().toLocaleDateString('ja-JP');

  let html: string;
  if (activePattern === 'compare') {
    html = cashflowSectionHtml(resultA, 'パターンA')
         + cashflowSectionHtml(resultB, 'パターンB');
  } else {
    const result = activePattern === 'B' ? resultB : resultA;
    html = cashflowSectionHtml(result, '');
  }

  await elementToPdf({
    html,
    filename: `MAS_CF_${resultA.input.propertyName}_${today.replace(/\//g, '')}.pdf`,
    orientation: 'landscape',
  });
}

function exportCashflowCSV(rows: CFRow[], input: SimInput) {
  const yenNum = (n: number) => Math.round(n);
  const header = ['年', '家賃収入', '運営費', '固都税', '運営CF', 'ローン返済', '税前CF', '減価償却', '課税所得', '税金', '税引後CF', '累計CF', '残債'];
  const body = rows.map(r => [
    r.year, yenNum(r.rentalIncome), yenNum(r.managementCosts), yenNum(r.fixedAssetTax),
    yenNum(r.operatingCF), yenNum(r.annualLoanPayment), yenNum(r.preTaxCF),
    yenNum(r.depreciation), yenNum(r.taxableIncome), yenNum(r.incomeTax),
    yenNum(r.afterTaxCF), yenNum(r.cumulativeCF), yenNum(r.loanBalance),
  ]);
  const csv = [header, ...body].map(row => row.join(',')).join('\n');
  const bom = '﻿'; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAS_CF_${input.propertyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g,'')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CashFlowPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
  const result = activePattern === 'B' ? resultB : resultA;
  const rows = result.cashFlows; // 全期間を表示
  const [pdfLoading, setPdfLoading] = useState(false);

  const chartData = useMemo(() => rows
    .filter(r => r.year === 1 || r.year % 5 === 0)
    .map(r => ({
      year: r.year + '年',
      '運営CF': Math.round(r.operatingCF / 10000),
      '税引後CF': Math.round(r.afterTaxCF / 10000),
      '累計CF': Math.round(r.cumulativeCF / 10000),
    })), [rows]);

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">キャッシュフロー分析</h1><p className="text-xs text-navy-100">全期間の年次収支</p></div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setPdfLoading(true);
              try { await exportCashflowPDF(resultA, resultB, activePattern); }
              catch(e) { console.error(e); alert('PDF出力でエラーが発生しました。'); }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
          </button>
          <button onClick={() => exportCashflowCSV(rows, result.input)} className="flex items-center gap-1.5 bg-navy-600 hover:bg-navy-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            📥 CSV
          </button>
          <PatternToggle />
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4 overflow-hidden">
          <h3 className="text-sm font-bold text-navy-500 mb-3">年次CF推移（万円）</h3>
          <div className="overflow-hidden">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                <XAxis dataKey="year" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => v.toLocaleString('ja-JP')} width={60} />
                <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#667085" strokeDasharray="3 3" />
                <Bar dataKey="運営CF" fill="#1C2B4A" radius={[2,2,0,0]} />
                <Bar dataKey="税引後CF" fill="#E8632A" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="bg-navy-500 text-white px-4 py-2.5 font-bold text-sm">年次キャッシュフロー詳細</div>
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  {['年','家賃収入','運営費','固都税','運営CF','ローン返済','税前CF','減価償却','課税所得','税金','税引後CF','累計CF','残債'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isBreakeven = r.cumulativeCF >= 0 && (rows[i-1]?.cumulativeCF ?? -1) < 0;
                  return (
                    <tr key={r.year} className={`${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} ${isBreakeven ? 'ring-2 ring-orange-400' : ''}`}>
                      <td className="px-2 py-1.5 text-center font-medium">{r.year}</td>
                      <td className="px-2 py-1.5 text-right">{yen(r.rentalIncome)}</td>
                      <td className="px-2 py-1.5 text-right">{yen(r.managementCosts)}</td>
                      <td className="px-2 py-1.5 text-right">{yen(r.fixedAssetTax)}</td>
                      <td className={`px-2 py-1.5 text-right font-semibold ${r.operatingCF >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{yen(r.operatingCF)}</td>
                      <td className="px-2 py-1.5 text-right">{yen(r.annualLoanPayment)}</td>
                      <td className={`px-2 py-1.5 text-right font-semibold ${r.preTaxCF >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{yen(r.preTaxCF)}</td>
                      <td className="px-2 py-1.5 text-right text-neutral-400">{yen(r.depreciation)}</td>
                      <td className={`px-2 py-1.5 text-right ${r.taxableIncome < 0 ? 'text-success-500' : ''}`}>{yen(r.taxableIncome)}</td>
                      <td className="px-2 py-1.5 text-right text-danger-500">{yen(r.incomeTax)}</td>
                      <td className={`px-2 py-1.5 text-right font-bold ${r.afterTaxCF >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{yen(r.afterTaxCF)}</td>
                      <td className={`px-2 py-1.5 text-right font-bold ${r.cumulativeCF >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{yen(r.cumulativeCF)}</td>
                      <td className="px-2 py-1.5 text-right text-neutral-500">{yen(r.loanBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
