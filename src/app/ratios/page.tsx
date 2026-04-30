'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { StatBox } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct, num } from '@/lib/format';

export default function RatiosPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
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

        {/* 用語解説 */}
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-4">📖 用語解説</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { term: '年収倍率', desc: '借入額 ÷ 年収。7倍以下が融資審査の目安。10倍超は厳しいと判断されやすい。' },
              { term: '返済比率', desc: '年間ローン返済額 ÷ 年収。25%以下が理想。35%超は返済負担が重い水準。' },
              { term: '表面利回り', desc: '年間家賃収入 ÷ 物件価格。空室・費用を考慮しない単純利回り。4%以上が目安。' },
              { term: '実質利回り', desc: '（年間家賃 − 諸費用 − 固都税）÷ 物件価格。実際の手残り率。2%以上が目安。' },
              { term: 'DSCR', desc: 'Debt Service Coverage Ratio（借債返済余力）。運営CF ÷ 年間返済額。1.2倍以上が安全圏。1.0未満は赤字。' },
              { term: 'CAGR', desc: 'Compound Annual Growth Rate（年平均成長率）。投資元本が毎年何%複利で増えたかを示す。売却益＋累計CFを含む総合リターン。' },
              { term: '投資倍率', desc: '（税引後売却益 ＋ 累計CF ＋ 初期投資）÷ 初期投資。1.0x以下は元本割れ。2.0x以上が優良。' },
              { term: '損益分岐点賃料', desc: 'ローン返済・管理費・固都税を合算した最低限必要な月額家賃。現行家賃がこれを下回ると月次赤字。' },
            ].map(({ term, desc }) => (
              <div key={term} className="bg-white rounded-lg p-3 border border-neutral-100">
                <div className="font-bold text-navy-500 mb-1">{term}</div>
                <div className="text-neutral-600 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
