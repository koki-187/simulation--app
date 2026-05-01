'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { Section } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct } from '@/lib/format';

export default function TaxPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
  const result = activePattern === 'B' ? resultB : resultA;
  const t = result.taxDetail;

  const expenseRows = [
    ['管理費・修繕積立金', yen(t.managementExp)],
    ['損害保険料（概算）', yen(t.insuranceEst)],
    ['固定資産税', yen(t.fixedAssetTax)],
    ['減価償却費', yen(t.depreciation)],
    ['ローン利息', yen(t.loanInterest)],
    ['経費合計', yen(t.totalExpenses)],
  ];

  const taxBrackets = [
    { limit: '195万以下', rate: '5%', deduction: '0' },
    { limit: '330万以下', rate: '10%', deduction: '9.75万' },
    { limit: '695万以下', rate: '20%', deduction: '42.75万' },
    { limit: '900万以下', rate: '23%', deduction: '63.6万' },
    { limit: '1,800万以下', rate: '33%', deduction: '153.6万' },
    { limit: '4,000万以下', rate: '40%', deduction: '279.6万' },
    { limit: '4,000万超', rate: '45%', deduction: '479.6万' },
  ];

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">税金詳細</h1><p className="text-xs text-navy-100">不動産所得税・譲渡所得税の概算</p></div>
        <PatternToggle />
      </div>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="grid grid-cols-2 gap-6">
          <Section title="不動産所得の計算（1年目）">
            <div className="space-y-0 text-sm">
              {[
                ['家賃収入', yen(t.rentalRevenue), false],
                ...expenseRows.map(([l,v]) => [l, v, true]),
                ['不動産所得', yen(t.realEstateIncome), false],
              ].map(([label, val, isExpense], i) => (
                <div key={i} className={`flex justify-between items-center py-1.5 border-b border-neutral-100 ${label === '不動産所得' ? 'font-bold bg-navy-50 px-2 rounded' : ''}`}>
                  <span className={`text-neutral-700 ${isExpense ? 'text-neutral-500 pl-3' : ''}`}>{label}</span>
                  <span className={`font-mono ${isExpense ? 'text-danger-500' : 'text-navy-500 font-semibold'}`}>
                    {isExpense ? `(${val})` : val}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm">
              <div className="flex justify-between"><span>所得税率（概算）</span><span className="font-bold text-orange-600">{pct(t.incomeTaxRate)}</span></div>
              <div className="flex justify-between mt-1"><span>所得税概算</span><span className="font-bold text-danger-500">{yen(t.incomeTax)}</span></div>
              <div className="flex justify-between mt-1"><span>住民税（10%）</span><span className="font-bold text-danger-500">{yen(t.residentTax)}</span></div>
              <div className="flex justify-between mt-2 border-t border-orange-200 pt-2 font-bold"><span>合計税負担</span><span className="text-danger-500">{yen(t.totalTaxBurden)}</span></div>
            </div>
          </Section>

          <Section title="譲渡所得税の計算">
            <div className="space-y-0 text-sm">
              {[
                ['売却価格', yen(t.salePrice)],
                ['取得費（購入価格）', yen(t.acquisitionCost)],
                ['累計減価償却費', yen(t.accumulatedDep)],
                ['税務上の取得費', yen(t.acquisitionCost - t.accumulatedDep)],
                ['売却費用(3%)', yen(t.sellingCosts)],
                ['譲渡所得', yen(t.taxableGain)],
              ].map(([l,v], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-700">{l}</span>
                  <span className="font-mono font-semibold text-navy-500">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.isLongTerm ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
                  {t.isLongTerm ? '長期譲渡（5年超）' : '短期譲渡（5年以下）'}
                </span>
              </div>
              <div className="flex justify-between"><span>税率</span><span className="font-bold text-orange-600">{pct(t.taxRate)}</span></div>
              <div className="flex justify-between mt-2 font-bold"><span>譲渡所得税概算</span><span className="text-danger-500">{yen(t.capitalGainsTax)}</span></div>
            </div>
          </Section>
        </div>

        <Section title="所得税速算表（参考）" color="navy">
          <table className="w-full text-xs">
            <thead><tr className="bg-navy-50"><th className="px-3 py-2 text-left">課税所得</th><th className="px-3 py-2 text-right">税率</th><th className="px-3 py-2 text-right">控除額</th></tr></thead>
            <tbody>
              {taxBrackets.map((b, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-3 py-1.5">{b.limit}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-navy-500">{b.rate}</td>
                  <td className="px-3 py-1.5 text-right text-neutral-500">{b.deduction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </AppShell>
  );
}
