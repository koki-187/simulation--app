'use client';
import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct, cagr, mult } from '@/lib/format';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { radarChartSvg } from '@/lib/pdf/chartSvg';

async function exportComparePDF(
  rows: { label: string; fmtA: string; fmtB: string; betterA: boolean }[],
  inputA: { propertyName: string },
  inputB: { propertyName: string },
  aWins: number,
  bWins: number,
  radarData: { subject: string; A: number; B: number }[],
) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');

  const today = new Date().toLocaleDateString('ja-JP');
  const winnerLabel = aWins > bWins
    ? `A（${inputA.propertyName}）`
    : aWins < bWins
      ? `B（${inputB.propertyName}）`
      : '引き分け';

  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:500;">${r.label}</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;${r.betterA ? 'background:#F0FDF4;color:#16A34A;font-weight:bold;' : ''}">${r.fmtA}</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;${!r.betterA ? 'background:#F0FDF4;color:#16A34A;font-weight:bold;' : ''}">${r.fmtB}</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:center;font-weight:bold;color:${r.betterA ? '#E8632A' : '#27AE60'};">${r.betterA ? 'A' : 'B'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="padding:20px;">
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:12px;">
        <div style="font-size:16px;font-weight:bold;">A/Bパターン比較レポート</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">
          パターンA: ${inputA.propertyName} ／ パターンB: ${inputB.propertyName} ／ 作成日: ${today}
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <div style="flex:1;text-align:center;padding:10px;border-radius:6px;border:2px solid ${aWins >= bWins ? '#E8632A' : '#E5E7EB'};">
          <div style="font-size:11px;font-weight:bold;color:#E8632A;">パターンA — ${inputA.propertyName}</div>
          <div style="font-size:28px;font-weight:bold;color:${aWins >= bWins ? '#E8632A' : '#1C2B4A'};">${aWins}</div>
          <div style="font-size:10px;color:#6B7280;">指標でリード</div>
        </div>
        <div style="flex:1;text-align:center;padding:10px;border-radius:6px;border:2px solid ${aWins < bWins ? '#E8632A' : '#E5E7EB'};">
          <div style="font-size:11px;font-weight:bold;color:#1C2B4A;">パターンB — ${inputB.propertyName}</div>
          <div style="font-size:28px;font-weight:bold;color:${bWins > aWins ? '#E8632A' : '#1C2B4A'};">${bWins}</div>
          <div style="font-size:10px;color:#6B7280;">指標でリード</div>
        </div>
      </div>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:10px;color:#92400E;">
        総合評価: パターン${winnerLabel}が${Math.max(aWins, bWins)}/${rows.length}指標でリード
      </div>
      ${radarChartSvg(radarData, inputA.propertyName, inputB.propertyName)}
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#1C2B4A;color:white;">
            <th style="padding:5px 8px;border:1px solid #374151;text-align:left;">指標</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">A: ${inputA.propertyName}</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">B: ${inputB.propertyName}</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:center;">優位</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;

  const propA = inputA.propertyName || 'A';
  const propB = inputB.propertyName || 'B';
  await elementToPdf({
    html,
    filename: `MAS_AB比較_${propA}vs${propB}_${today.replace(/\//g, '')}.pdf`,
    orientation: 'portrait',
  });
}

export default function ComparePage() {
  const { resultA, resultB, inputA, inputB } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, inputA: s.inputA, inputB: s.inputB }))
  );
  const [pdfLoading, setPdfLoading] = useState(false);

  // Safe accessors — guard against holdingYears < 10
  const cf0A = resultA.cashFlows[0]?.afterTaxCF ?? 0;
  const cf0B = resultB.cashFlows[0]?.afterTaxCF ?? 0;
  const cf9A = resultA.cashFlows[9]?.cumulativeCF ?? resultA.cashFlows.at(-1)?.cumulativeCF ?? 0;
  const cf9B = resultB.cashFlows[9]?.cumulativeCF ?? resultB.cashFlows.at(-1)?.cumulativeCF ?? 0;
  const cf9Label = `累計CF(${Math.min(10, resultA.cashFlows.length)}年)`;
  const saleA = resultA.saleScenarios[1];
  const saleB = resultB.saleScenarios[1];

  const rows = useMemo(() => [
    { label: '物件価格', fmtA: yen(inputA.propertyPrice), fmtB: yen(inputB.propertyPrice), betterA: inputA.propertyPrice <= inputB.propertyPrice },
    { label: '自己資金', fmtA: yen(inputA.equity), fmtB: yen(inputB.equity), betterA: inputA.equity <= inputB.equity },
    { label: '借入額', fmtA: yen(resultA.loanAmount), fmtB: yen(resultB.loanAmount), betterA: resultA.loanAmount <= resultB.loanAmount },
    { label: '金利', fmtA: pct(inputA.rate), fmtB: pct(inputB.rate), betterA: inputA.rate <= inputB.rate },
    { label: '月々返済額', fmtA: yen(resultA.monthlyPayment), fmtB: yen(resultB.monthlyPayment), betterA: resultA.monthlyPayment <= resultB.monthlyPayment },
    { label: '表面利回り', fmtA: pct(resultA.ratios.grossYield), fmtB: pct(resultB.ratios.grossYield), betterA: resultA.ratios.grossYield >= resultB.ratios.grossYield },
    { label: '実質利回り', fmtA: pct(resultA.ratios.netYield), fmtB: pct(resultB.ratios.netYield), betterA: resultA.ratios.netYield >= resultB.ratios.netYield },
    { label: '返済比率', fmtA: pct(resultA.ratios.repaymentRatioTax), fmtB: pct(resultB.ratios.repaymentRatioTax), betterA: resultA.ratios.repaymentRatioTax <= resultB.ratios.repaymentRatioTax },
    { label: '税引後CF(1年目)', fmtA: yen(cf0A), fmtB: yen(cf0B), betterA: cf0A >= cf0B },
    { label: cf9Label, fmtA: yen(cf9A), fmtB: yen(cf9B), betterA: cf9A >= cf9B },
    { label: '売却手残り(標準)', fmtA: yen(saleA.afterTaxProfit), fmtB: yen(saleB.afterTaxProfit), betterA: saleA.afterTaxProfit >= saleB.afterTaxProfit },
    { label: 'CAGR', fmtA: cagr(saleA.cagr), fmtB: cagr(saleB.cagr), betterA: saleA.cagr >= saleB.cagr },
    { label: '投資倍率', fmtA: mult(saleA.investmentMultiple), fmtB: mult(saleB.investmentMultiple), betterA: saleA.investmentMultiple >= saleB.investmentMultiple },
    { label: 'DSCR', fmtA: resultA.ratios.dscr.toFixed(2)+'倍', fmtB: resultB.ratios.dscr.toFixed(2)+'倍', betterA: resultA.ratios.dscr >= resultB.ratios.dscr },
  ], [inputA, inputB, resultA, resultB, cf0A, cf0B, cf9A, cf9B, cf9Label, saleA, saleB]);

  const aWins = rows.filter(r => r.betterA).length;
  const bWins = rows.length - aWins;

  const winnerLabel = aWins > bWins ? `A（${inputA.propertyName}）` : aWins < bWins ? `B（${inputB.propertyName}）` : null;
  const topMetricA = rows.filter(r => r.betterA).map(r => r.label)[0] ?? '';
  const topMetricB = rows.filter(r => !r.betterA).map(r => r.label)[0] ?? '';
  const insightText = winnerLabel
    ? `パターン${winnerLabel}が${Math.max(aWins, bWins)}/${rows.length}指標でリード。特に「${aWins > bWins ? topMetricA : topMetricB}」で有利です。`
    : `両パターンは${aWins}/${rows.length}指標で同等です。投資目的に合わせてご選択ください。`;

  // Normalize values for radar chart (0-100 scale, higher = better)
  const radarData = [
    { subject: '利回り', A: Math.min(100, resultA.ratios.grossYield * 1000), B: Math.min(100, resultB.ratios.grossYield * 1000) },
    { subject: '実質利回り', A: Math.min(100, Math.max(0, resultA.ratios.netYield * 1000)), B: Math.min(100, Math.max(0, resultB.ratios.netYield * 1000)) },
    { subject: 'CF(1年目)', A: Math.min(100, Math.max(0, (cf0A + 2000000) / 40000)), B: Math.min(100, Math.max(0, (cf0B + 2000000) / 40000)) },
    { subject: 'CAGR', A: Math.min(100, Math.max(0, saleA.cagr * 500)), B: Math.min(100, Math.max(0, saleB.cagr * 500)) },
    { subject: 'DSCR', A: Math.min(100, resultA.ratios.dscr * 40), B: Math.min(100, resultB.ratios.dscr * 40) },
    { subject: '低金利', A: Math.max(0, 100 - inputA.rate * 2000), B: Math.max(0, 100 - inputB.rate * 2000) },
    { subject: '低返済比率', A: Math.max(0, 100 - resultA.ratios.repaymentRatioTax * 300), B: Math.max(0, 100 - resultB.ratios.repaymentRatioTax * 300) },
    { subject: '売却益', A: Math.min(100, Math.max(0, (saleA.afterTaxProfit + 5000000) / 100000)), B: Math.min(100, Math.max(0, (saleB.afterTaxProfit + 5000000) / 100000)) },
  ];

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">A/B パターン比較</h1>
          <p className="text-xs text-navy-100">全指標の横断比較</p>
        </div>
        <button
          onClick={async () => {
            setPdfLoading(true);
            try { await exportComparePDF(rows, inputA, inputB, aWins, bWins, radarData); }
            catch(e) { console.error(e); alert('PDF出力でエラーが発生しました。'); }
            finally { setPdfLoading(false); }
          }}
          disabled={pdfLoading}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
        </button>
      </div>
      <div className="p-6 space-y-6">
        {/* Score cards */}
        <div className="flex gap-4">
          <div className={`flex-1 rounded-xl p-4 text-center border-2 transition-all ${aWins > bWins ? 'bg-orange-50 border-orange-500 shadow-md' : aWins === bWins ? 'bg-orange-50 border-orange-300' : 'bg-neutral-50 border-neutral-200'}`}>
            {aWins > bWins && <div className="text-2xl mb-1">🏆</div>}
            <div className="text-xs font-bold text-orange-500 mb-1">パターンA — {inputA.propertyName}</div>
            <div className={`text-4xl font-black ${aWins >= bWins ? 'text-orange-500' : 'text-navy-500'}`}>{aWins}</div>
            <div className="text-xs text-neutral-500 mt-0.5">/ {rows.length} 指標でリード</div>
          </div>
          <div className={`flex-1 rounded-xl p-4 text-center border-2 transition-all ${bWins > aWins ? 'bg-orange-50 border-orange-500 shadow-md' : 'bg-neutral-50 border-neutral-200'}`}>
            {bWins > aWins && <div className="text-2xl mb-1">🏆</div>}
            <div className="text-xs font-bold text-navy-500 mb-1">パターンB — {inputB.propertyName}</div>
            <div className={`text-4xl font-black ${bWins > aWins ? 'text-orange-500' : 'text-navy-500'}`}>{bWins}</div>
            <div className="text-xs text-neutral-500 mt-0.5">/ {rows.length} 指標でリード</div>
          </div>
        </div>

        {/* Insight text */}
        <div className={`rounded-xl px-5 py-4 text-sm font-semibold border-l-4 ${aWins !== bWins ? 'bg-orange-50 border-l-orange-500 border border-orange-200 text-orange-800' : 'bg-neutral-50 border-l-neutral-400 border border-neutral-200 text-neutral-700'}`}>
          <span className="mr-2">{aWins !== bWins ? '🏆' : '🤝'}</span>{insightText}
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
          <h3 className="text-sm font-bold text-navy-500 mb-3">総合評価レーダー（正規化スコア）</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name={`A: ${inputA.propertyName}`} dataKey="A" stroke="#E8632A" fill="#E8632A" fillOpacity={0.25} strokeWidth={2} />
              <Radar name={`B: ${inputB.propertyName}`} dataKey="B" stroke="#1C2B4A" fill="#1C2B4A" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => [`${Math.round(Number(v))}pt`]} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-neutral-400 mt-1 text-center">※各指標を0〜100に正規化したスコアです。数値の絶対値ではなく相対比較にご利用ください。</p>
        </div>

        {/* Detail table */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="bg-navy-500 text-white px-4 py-2.5 font-bold text-sm">指標別詳細比較</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">指標</th>
                <th scope="col" className={`px-4 py-2.5 text-right text-xs font-bold ${aWins >= bWins ? 'text-orange-500' : 'text-neutral-500'}`}>
                  {aWins > bWins ? '🏆 ' : ''}パターンA
                </th>
                <th scope="col" className={`px-4 py-2.5 text-right text-xs font-bold ${bWins > aWins ? 'text-orange-500' : 'text-neutral-500'}`}>
                  {bWins > aWins ? '🏆 ' : ''}パターンB
                </th>
                <th scope="col" className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500">優位</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-4 py-2.5 text-xs font-medium text-neutral-700">{row.label}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-semibold ${row.betterA ? 'text-success-500 bg-success-50' : ''}`}>{row.fmtA}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-semibold ${!row.betterA ? 'text-success-500 bg-success-50' : ''}`}>{row.fmtB}</td>
                  <td className="px-4 py-2.5 text-center text-xs font-bold">
                    {row.betterA
                      ? <span className="text-orange-500">A が有利</span>
                      : <span className="text-navy-500">B が有利</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
