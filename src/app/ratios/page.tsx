'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { StatBox } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { yen, pct, num } from '@/lib/format';

export default function RatiosPage() {
  const { resultA, resultB, activePattern } = useSimStore();
  const result = activePattern === 'B' ? resultB : resultA;
  const r = result.ratios;

  const getRatioStatus = (ratio: number, goodMax: number, warnMax: number) =>
    ratio <= goodMax ? 'positive' : ratio <= warnMax ? false : 'negative';

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">年収倍率・返済比率</h1><p className="text-xs text-navy-100">融資審査の健全性指標</p></div>
        <PatternToggle />
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="年収倍率（源泉）" value={r.incomeMultipleTax.toFixed(2)} unit="倍" positive={r.incomeMultipleTax <= 7} negative={r.incomeMultipleTax > 10} sub="7倍以下が融資理想" />
          <StatBox label="年収倍率（申告）" value={r.incomeMultipleDeclared.toFixed(2)} unit="倍" positive={r.incomeMultipleDeclared <= 7} negative={r.incomeMultipleDeclared > 10} sub="申告所得ベース" />
          <StatBox label="返済比率（源泉）" value={pct(r.repaymentRatioTax)} positive={r.repaymentRatioTax <= 0.25} negative={r.repaymentRatioTax > 0.35} sub="25%以下が目安" />
          <StatBox label="返済比率（申告）" value={pct(r.repaymentRatioDeclared)} positive={r.repaymentRatioDeclared <= 0.25} negative={r.repaymentRatioDeclared > 0.35} sub="申告所得ベース" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="表面利回り" value={pct(r.grossYield)} positive={r.grossYield >= 0.04} negative={r.grossYield < 0.02} sub="4%以上が目安" />
          <StatBox label="実質利回り" value={pct(r.netYield)} positive={r.netYield >= 0.02} negative={r.netYield < 0} sub="2%以上が目安" />
          <StatBox label="損益分岐点賃料" value={yen(r.breakevenRent)} unit="/月" sub="この家賃を下回ると赤字" warn />
          <StatBox label="DSCR" value={r.dscr.toFixed(2)} unit="倍" positive={r.dscr >= 1.2} negative={r.dscr < 1.0} sub="1.2倍以上が安全圏" />
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-4">融資健全性チェックリスト</h3>
          {[
            { label: '年収倍率（源泉）≤ 7倍', ok: r.incomeMultipleTax <= 7 },
            { label: '返済比率（源泉）≤ 25%', ok: r.repaymentRatioTax <= 0.25 },
            { label: '実質利回り ≥ 2%', ok: r.netYield >= 0.02 },
            { label: 'DSCR ≥ 1.2倍', ok: r.dscr >= 1.2 },
            { label: '損益分岐賃料 < 現行家賃', ok: r.breakevenRent < result.effectiveMonthlyRent },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
              <span className={`text-lg ${item.ok ? '✅' : '❌'}`}>{item.ok ? '✅' : '❌'}</span>
              <span className={`text-sm ${item.ok ? 'text-success-500 font-medium' : 'text-danger-500'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
