'use client';
import { useState } from 'react';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
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
  const { elementToPdf } = await import('@/lib/pdf/jpdf');

  const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');
  const today = new Date().toLocaleDateString('ja-JP');

  const tableRows = annualRows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:center;font-weight:bold;">${r.year}年</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.totalPayment)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;">${fmt(r.totalInterest)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#16A34A;">${fmt(r.totalPrincipal)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${fmt(r.endBalance)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#6B7280;">${fmt(r.cumInterest)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="padding:20px;">
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">返済スケジュール</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">物件: ${input.propertyName} ／ 作成日: ${today}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#1C2B4A;color:white;">
            <th style="padding:5px 8px;border:1px solid #374151;text-align:center;">年</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">年間返済額</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">うち利息</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">うち元金</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">残高</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">累計利息</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | TERASS株式会社
      </div>
    </div>
  `;

  await elementToPdf({
    html,
    filename: `TERASS_返済スケジュール_${input.propertyName}_${today.replace(/\//g, '')}.pdf`,
    orientation: 'portrait',
  });
}

export default function AmortizationPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
  const result = activePattern === 'B' ? resultB : resultA;
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual');
  const [pdfLoading, setPdfLoading] = useState(false);

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
          <button
            onClick={async () => {
              setPdfLoading(true);
              try { await exportAmortPDF(annualRows, result.input); }
              catch(e) { console.error(e); alert('PDF出力でエラーが発生しました。'); }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
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
