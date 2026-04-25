'use client';
import { AppShell } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen, pct, cagr, mult } from '@/lib/format';

export default function ComparePage() {
  const { resultA, resultB, inputA, inputB } = useSimStore();

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

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4">
        <h1 className="text-lg font-bold">A/B パターン比較</h1>
        <p className="text-xs text-navy-100">全指標の横断比較</p>
      </div>
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-orange-50 border-2 border-orange-500 rounded-xl p-4 text-center">
            <div className="text-xs font-bold text-orange-500 mb-1">Pattern A — {inputA.propertyName}</div>
            <div className="text-3xl font-bold text-orange-500">{aWins}</div>
            <div className="text-xs text-neutral-500">指標でリード</div>
          </div>
          <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
            <div className="text-xs font-bold text-orange-300 mb-1">Pattern B — {inputB.propertyName}</div>
            <div className="text-3xl font-bold text-navy-500">{bWins}</div>
            <div className="text-xs text-neutral-500">指標でリード</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-500 text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold">指標</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-orange-300">Pattern A</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-orange-200">Pattern B</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">優位</th>
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
