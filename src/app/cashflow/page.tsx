'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen } from '@/lib/format';
import { CFRow, SimInput } from '@/lib/calc/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

async function exportCashflowPDF(rows: CFRow[], input: SimInput) {
  const yenFmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const NAVY: [number, number, number] = [28, 43, 74];

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TERASS Cash Flow Analysis — ${input.propertyName}`, 14, 12);

  autoTable(doc, {
    startY: 22,
    head: [['年', '家賃収入', '運営費', '運営CF', 'ローン返済', '税金', '税引後CF', '累計CF', '残債']],
    body: rows.map(r => [
      r.year + '年',
      yenFmt(r.rentalIncome), yenFmt(r.managementCosts),
      yenFmt(r.operatingCF), yenFmt(r.annualLoanPayment),
      yenFmt(r.incomeTax), yenFmt(r.afterTaxCF),
      yenFmt(r.cumulativeCF), yenFmt(r.loanBalance),
    ]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    margin: { left: 10, right: 10 },
  });

  doc.save(`TERASS_CF_${input.propertyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
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
  a.download = `TERASS_CF_${input.propertyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g,'')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CashFlowPage() {
  const { resultA, resultB, activePattern } = useSimStore();
  const result = activePattern === 'B' ? resultB : resultA;
  const rows = result.cashFlows.slice(0, 30);

  const chartData = rows.map(r => ({
    year: r.year + '年',
    '運営CF': Math.round(r.operatingCF / 10000),
    '税引後CF': Math.round(r.afterTaxCF / 10000),
    '累計CF': Math.round(r.cumulativeCF / 10000),
  }));

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">キャッシュフロー分析</h1><p className="text-xs text-navy-100">30年間の年次収支</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportCashflowPDF(rows, result.input)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            📄 PDF出力
          </button>
          <button onClick={() => exportCashflowCSV(rows, result.input)} className="flex items-center gap-1.5 bg-navy-600 hover:bg-navy-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            📥 CSV
          </button>
          <PatternToggle />
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
          <h3 className="text-sm font-bold text-navy-500 mb-3">年次CF推移（万円）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#667085" strokeDasharray="3 3" />
              <Bar dataKey="運営CF" fill="#1C2B4A" radius={[2,2,0,0]} />
              <Bar dataKey="税引後CF" fill="#E8632A" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
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
