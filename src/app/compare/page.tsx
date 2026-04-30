'use client';
import { AppShell } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct, cagr, mult } from '@/lib/format';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';

async function exportComparePDF(
  rows: { label: string; fmtA: string; fmtB: string; betterA: boolean }[],
  inputA: { propertyName: string },
  inputB: { propertyName: string },
  aWins: number,
  bWins: number,
) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const NAVY: [number, number, number] = [28, 43, 74];
  const ORANGE: [number, number, number] = [232, 99, 42];
  const GREEN: [number, number, number] = [39, 174, 96];

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TERASS A/B Pattern Comparison`, 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const winner = aWins > bWins ? `A (${inputA.propertyName})` : `B (${inputB.propertyName})`;
  doc.text(`Winner: Pattern ${winner} — ${Math.max(aWins, bWins)}/${rows.length} metrics`, 14, 17);

  autoTable(doc, {
    startY: 22,
    head: [['指標', `A: ${inputA.propertyName}`, `B: ${inputB.propertyName}`, '優位']],
    body: rows.map(r => [r.label, r.fmtA, r.fmtB, r.betterA ? 'A ◀' : '▶ B']),
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' as const },
      2: { halign: 'right' as const },
      3: { halign: 'center' as const, fontStyle: 'bold' },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const row = rows[data.row.index];
        if (row) {
          data.cell.styles.textColor = row.betterA ? [...ORANGE] : [...GREEN];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '');
  doc.save(`TERASS_AB比較_${dateStr}.pdf`);
}

export default function ComparePage() {
  const { resultA, resultB, inputA, inputB } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, inputA: s.inputA, inputB: s.inputB }))
  );

  const rows = [
    { label: '物件価格', fmtA: yen(inputA.propertyPrice), fmtB: yen(inputB.propertyPrice), betterA: inputA.propertyPrice <= inputB.propertyPrice },
    { label: '自己資金', fmtA: yen(inputA.equity), fmtB: yen(inputB.equity), betterA: inputA.equity <= inputB.equity },
    { label: '借入額', fmtA: yen(resultA.loanAmount), fmtB: yen(resultB.loanAmount), betterA: resultA.loanAmount <= resultB.loanAmount },
    { label: '金利', fmtA: pct(inputA.rate), fmtB: pct(inputB.rate), betterA: inputA.rate <= inputB.rate },
    { label: '月々返済額', fmtA: yen(resultA.monthlyPayment), fmtB: yen(resultB.monthlyPayment), betterA: resultA.monthlyPayment <= resultB.monthlyPayment },
    { label: '表面利回り', fmtA: pct(resultA.ratios.grossYield), fmtB: pct(resultB.ratios.grossYield), betterA: resultA.ratios.grossYield >= resultB.ratios.grossYield },
    { label: '実質利回り', fmtA: pct(resultA.ratios.netYield), fmtB: pct(resultB.ratios.netYield), betterA: resultA.ratios.netYield >= resultB.ratios.netYield },
    { label: '返済比率', fmtA: pct(resultA.ratios.repaymentRatioTax), fmtB: pct(resultB.ratios.repaymentRatioTax), betterA: resultA.ratios.repaymentRatioTax <= resultB.ratios.repaymentRatioTax },
    { label: '税引後CF(1年目)', fmtA: yen(resultA.cashFlows[0].afterTaxCF), fmtB: yen(resultB.cashFlows[0].afterTaxCF), betterA: resultA.cashFlows[0].afterTaxCF >= resultB.cashFlows[0].afterTaxCF },
    { label: '累計CF(10年)', fmtA: yen(resultA.cashFlows[9].cumulativeCF), fmtB: yen(resultB.cashFlows[9].cumulativeCF), betterA: resultA.cashFlows[9].cumulativeCF >= resultB.cashFlows[9].cumulativeCF },
    { label: '売却手残り(標準)', fmtA: yen(resultA.saleScenarios[1].afterTaxProfit), fmtB: yen(resultB.saleScenarios[1].afterTaxProfit), betterA: resultA.saleScenarios[1].afterTaxProfit >= resultB.saleScenarios[1].afterTaxProfit },
    { label: 'CAGR', fmtA: cagr(resultA.saleScenarios[1].cagr), fmtB: cagr(resultB.saleScenarios[1].cagr), betterA: resultA.saleScenarios[1].cagr >= resultB.saleScenarios[1].cagr },
    { label: '投資倍率', fmtA: mult(resultA.saleScenarios[1].investmentMultiple), fmtB: mult(resultB.saleScenarios[1].investmentMultiple), betterA: resultA.saleScenarios[1].investmentMultiple >= resultB.saleScenarios[1].investmentMultiple },
    { label: 'DSCR', fmtA: resultA.ratios.dscr.toFixed(2)+'倍', fmtB: resultB.ratios.dscr.toFixed(2)+'倍', betterA: resultA.ratios.dscr >= resultB.ratios.dscr },
  ];

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
    { subject: 'CF(1年目)', A: Math.min(100, Math.max(0, (resultA.cashFlows[0].afterTaxCF + 2000000) / 40000)), B: Math.min(100, Math.max(0, (resultB.cashFlows[0].afterTaxCF + 2000000) / 40000)) },
    { subject: 'CAGR', A: Math.min(100, Math.max(0, resultA.saleScenarios[1].cagr * 500)), B: Math.min(100, Math.max(0, resultB.saleScenarios[1].cagr * 500)) },
    { subject: 'DSCR', A: Math.min(100, resultA.ratios.dscr * 40), B: Math.min(100, resultB.ratios.dscr * 40) },
    { subject: '低金利', A: Math.max(0, 100 - inputA.rate * 2000), B: Math.max(0, 100 - inputB.rate * 2000) },
    { subject: '低返済比率', A: Math.max(0, 100 - resultA.ratios.repaymentRatioTax * 300), B: Math.max(0, 100 - resultB.ratios.repaymentRatioTax * 300) },
    { subject: '売却益', A: Math.min(100, Math.max(0, (resultA.saleScenarios[1].afterTaxProfit + 5000000) / 100000)), B: Math.min(100, Math.max(0, (resultB.saleScenarios[1].afterTaxProfit + 5000000) / 100000)) },
  ];

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">A/B パターン比較</h1>
          <p className="text-xs text-navy-100">全指標の横断比較</p>
        </div>
        <button
          onClick={() => exportComparePDF(rows, inputA, inputB, aWins, bWins)}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          📄 PDF出力
        </button>
      </div>
      <div className="p-6 space-y-6">
        {/* Score cards */}
        <div className="flex gap-4">
          <div className={`flex-1 rounded-xl p-4 text-center border-2 ${aWins >= bWins ? 'bg-orange-50 border-orange-500' : 'bg-neutral-50 border-neutral-200'}`}>
            <div className="text-xs font-bold text-orange-500 mb-1">Pattern A — {inputA.propertyName}</div>
            <div className={`text-3xl font-bold ${aWins >= bWins ? 'text-orange-500' : 'text-navy-500'}`}>{aWins}</div>
            <div className="text-xs text-neutral-500">指標でリード</div>
          </div>
          <div className={`flex-1 rounded-xl p-4 text-center border-2 ${bWins > aWins ? 'bg-orange-50 border-orange-500' : 'bg-neutral-50 border-neutral-200'}`}>
            <div className="text-xs font-bold text-orange-300 mb-1">Pattern B — {inputB.propertyName}</div>
            <div className={`text-3xl font-bold ${bWins > aWins ? 'text-orange-500' : 'text-navy-500'}`}>{bWins}</div>
            <div className="text-xs text-neutral-500">指標でリード</div>
          </div>
        </div>

        {/* Insight text */}
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${aWins !== bWins ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
          💡 {insightText}
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
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">指標</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-orange-500">Pattern A</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-navy-500">Pattern B</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500">優位</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-4 py-2.5 text-xs font-medium text-neutral-700">{row.label}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-semibold ${row.betterA ? 'text-success-500 bg-success-50' : ''}`}>{row.fmtA}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-semibold ${!row.betterA ? 'text-success-500 bg-success-50' : ''}`}>{row.fmtB}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{row.betterA ? '🟠 A' : '🟡 B'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
