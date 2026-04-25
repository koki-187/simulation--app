'use client';
import { AppShell } from '@/components/layout';
import { StatBox, ExportBar } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { yen, pct, yenM, cagr, mult } from '@/lib/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { resultA, resultB, inputA, inputB } = useSimStore();

  // Chart data: annual CF for 20 years
  const cfData = resultA.cashFlows.slice(0, 20).map((row, i) => ({
    year: `${row.year}年`,
    'A 税引後CF': Math.round(row.afterTaxCF / 10000),
    'B 税引後CF': Math.round(resultB.cashFlows[i]?.afterTaxCF / 10000),
    'A 累計CF': Math.round(row.cumulativeCF / 10000),
    'B 累計CF': Math.round(resultB.cashFlows[i]?.cumulativeCF / 10000),
  }));

  const saleA = resultA.saleScenarios[1]; // standard
  const saleB = resultB.saleScenarios[1];

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">不動産投資シミュレーター</h1>
          <p className="text-navy-100 text-sm mt-0.5">購入・保有・売却のキャッシュフロー総合分析</p>
        </div>
        <ExportBar resultA={resultA} resultB={resultB} />
      </div>

      <div className="p-6 space-y-6">
        {/* Pattern A Quick Stats */}
        <section>
          <h2 className="text-sm font-bold text-navy-500 mb-3 flex items-center gap-2">
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">Pattern A</span>
            {inputA.propertyName} — {yen(inputA.propertyPrice)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox label="月々返済額" value={yen(resultA.monthlyPayment)} unit="/月" />
            <StatBox label="表面利回り" value={pct(resultA.ratios.grossYield)} positive={resultA.ratios.grossYield >= 0.04} />
            <StatBox label="実質利回り" value={pct(resultA.ratios.netYield)} positive={resultA.ratios.netYield >= 0.02} negative={resultA.ratios.netYield < 0} />
            <StatBox label="税引後CF(1年目)" value={yen(resultA.cashFlows[0]?.afterTaxCF)} positive={resultA.cashFlows[0]?.afterTaxCF >= 0} negative={resultA.cashFlows[0]?.afterTaxCF < 0} />
            <StatBox label="売却手残り(標準)" value={yen(saleA.afterTaxProfit)} positive={saleA.afterTaxProfit >= 0} negative={saleA.afterTaxProfit < 0} />
            <StatBox label="CAGR" value={cagr(saleA.cagr)} positive={saleA.cagr >= 0.03} negative={saleA.cagr < 0} />
          </div>
        </section>

        {/* Pattern B Quick Stats */}
        <section>
          <h2 className="text-sm font-bold text-navy-500 mb-3 flex items-center gap-2">
            <span className="bg-orange-300 text-navy-500 text-xs px-2 py-0.5 rounded font-bold">Pattern B</span>
            {inputB.propertyName} — {yen(inputB.propertyPrice)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox label="月々返済額" value={yen(resultB.monthlyPayment)} unit="/月" />
            <StatBox label="表面利回り" value={pct(resultB.ratios.grossYield)} positive={resultB.ratios.grossYield >= 0.04} />
            <StatBox label="実質利回り" value={pct(resultB.ratios.netYield)} positive={resultB.ratios.netYield >= 0.02} negative={resultB.ratios.netYield < 0} />
            <StatBox label="税引後CF(1年目)" value={yen(resultB.cashFlows[0]?.afterTaxCF)} positive={resultB.cashFlows[0]?.afterTaxCF >= 0} negative={resultB.cashFlows[0]?.afterTaxCF < 0} />
            <StatBox label="売却手残り(標準)" value={yen(saleB.afterTaxProfit)} positive={saleB.afterTaxProfit >= 0} negative={saleB.afterTaxProfit < 0} />
            <StatBox label="CAGR" value={cagr(saleB.cagr)} positive={saleB.cagr >= 0.03} negative={saleB.cagr < 0} />
          </div>
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annual CF Chart */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
            <h3 className="text-sm font-bold text-navy-500 mb-3">年次税引後キャッシュフロー（万円）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cfData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="A 税引後CF" fill="#E8632A" radius={[2,2,0,0]} />
                <Bar dataKey="B 税引後CF" fill="#F5A623" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative CF Chart */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
            <h3 className="text-sm font-bold text-navy-500 mb-3">累計キャッシュフロー（万円）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cfData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="A 累計CF" stroke="#1C2B4A" fill="#EEF1F6" strokeWidth={2} />
                <Area type="monotone" dataKey="B 累計CF" stroke="#E8632A" fill="#FFF5F0" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sale Scenario Summary */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="bg-navy-500 text-white px-4 py-2.5 font-bold text-sm">出口戦略サマリー（{inputA.holdingYears}年後売却想定）</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="px-4 py-2 text-left text-xs text-neutral-500 font-semibold">シナリオ</th>
                  {['悲観(−10%)', '標準', '楽観(+10%)'].map(s => (
                    <th key={s} colSpan={2} className="px-4 py-2 text-center text-xs text-neutral-500 font-semibold">{s}</th>
                  ))}
                </tr>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-2 text-left text-xs text-neutral-400"></th>
                  {[0,1,2].map(i => (
                    <>
                      <th key={`a${i}`} className="px-3 py-1.5 text-center text-xs font-semibold text-orange-500">A</th>
                      <th key={`b${i}`} className="px-3 py-1.5 text-center text-xs font-semibold text-orange-300">B</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '税引後手残り', key: 'afterTaxProfit' as const, fmt: (v: number) => yen(v) },
                  { label: 'CAGR', key: 'cagr' as const, fmt: (v: number) => cagr(v) },
                  { label: '投資倍率', key: 'investmentMultiple' as const, fmt: (v: number) => mult(v) },
                ].map((row, ri) => (
                  <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="px-4 py-2 text-xs font-medium text-neutral-700">{row.label}</td>
                    {[0,1,2].map(si => {
                      const vA = resultA.saleScenarios[si][row.key] as number;
                      const vB = resultB.saleScenarios[si][row.key] as number;
                      return (
                        <>
                          <td key={`va${si}`} className={`px-3 py-2 text-right text-xs font-semibold ${vA >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{row.fmt(vA)}</td>
                          <td key={`vb${si}`} className={`px-3 py-2 text-right text-xs font-semibold ${vB >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{row.fmt(vB)}</td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
