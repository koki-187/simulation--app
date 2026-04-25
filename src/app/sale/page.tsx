'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen, pct, cagr, mult } from '@/lib/format';

export default function SalePage() {
  const { resultA, resultB, activePattern, inputA, inputB } = useSimStore();
  const result = activePattern === 'B' ? resultB : resultA;
  const input = activePattern === 'B' ? inputB : inputA;

  const rows = [
    { label: '売却価格', key: 'salePrice' as const, fmt: yen },
    { label: 'ローン残債', key: 'loanBalance' as const, fmt: yen },
    { label: '売却費用(3%)', key: 'sellingCosts' as const, fmt: yen },
    { label: '税引前手残り', key: 'preTaxProfit' as const, fmt: yen },
    { label: '譲渡所得', key: 'taxableGain' as const, fmt: yen },
    { label: '譲渡所得税', key: 'capitalGainsTax' as const, fmt: yen },
    { label: '税引後手残り', key: 'afterTaxProfit' as const, fmt: yen },
    { label: 'CAGR', key: 'cagr' as const, fmt: cagr },
    { label: '投資倍率', key: 'investmentMultiple' as const, fmt: mult },
  ];

  const positiveKeys = new Set(['salePrice', 'afterTaxProfit', 'preTaxProfit', 'cagr', 'investmentMultiple']);
  const negativeKeys = new Set(['capitalGainsTax', 'sellingCosts', 'loanBalance']);

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">売却シミュレーション</h1>
          <p className="text-xs text-navy-100">{input.holdingYears}年後売却 — 悲観/標準/楽観3シナリオ</p>
        </div>
        <PatternToggle />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {result.saleScenarios.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
              <div className={`px-4 py-2.5 font-bold text-sm text-white ${s.multiplier < 1 ? 'bg-danger-500' : s.multiplier > 1 ? 'bg-success-500' : 'bg-navy-500'}`}>
                {s.label}
              </div>
              <div className="p-4 space-y-2">
                <div className="text-center">
                  <div className="text-xs text-neutral-500">税引後手残り</div>
                  <div className={`text-2xl font-bold mt-1 ${s.afterTaxProfit >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{yen(s.afterTaxProfit)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-50 rounded p-2 text-center">
                    <div className="text-neutral-500">CAGR</div>
                    <div className={`font-bold mt-0.5 ${s.cagr >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{cagr(s.cagr)}</div>
                  </div>
                  <div className="bg-neutral-50 rounded p-2 text-center">
                    <div className="text-neutral-500">投資倍率</div>
                    <div className={`font-bold mt-0.5 ${s.investmentMultiple >= 1 ? 'text-success-500' : 'text-danger-500'}`}>{mult(s.investmentMultiple)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="bg-navy-500 text-white px-4 py-2.5 font-bold text-sm">詳細内訳</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="table-header text-left px-4">指標</th>
                {result.saleScenarios.map(s => <th key={s.label} className="table-header text-right px-4">{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-4 py-2 text-xs font-medium text-neutral-700">{row.label}</td>
                  {result.saleScenarios.map(s => {
                    const val = s[row.key] as number;
                    const isPos = positiveKeys.has(row.key);
                    const isNeg = negativeKeys.has(row.key);
                    return (
                      <td key={s.label} className={`px-4 py-2 text-right text-xs font-semibold ${isPos && val >= 0 ? 'text-success-500' : isNeg ? 'text-danger-500' : ''}`}>
                        {row.fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-neutral-700 space-y-1">
          <div className="font-bold text-orange-600 mb-2">前提条件</div>
          <div>• 標準売却価格 ＝ 物件価格 × (1＋成長率)^保有年数</div>
          <div>• 売却費用 ＝ 売却価格 × 3%（仲介手数料等）</div>
          <div>• 譲渡所得税：{input.holdingYears >= 5 ? '長期 20.315%（保有5年超）' : '短期 39.63%（保有5年以下）'}</div>
          <div>• 累計キャッシュフローを含む総合利回りで CAGR 計算</div>
        </div>
      </div>
    </AppShell>
  );
}
