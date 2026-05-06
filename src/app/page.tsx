'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout';
import { StatBox, ExportBar } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct, yenM, cagr, mult } from '@/lib/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { resultA, resultB, inputA, inputB } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, inputA: s.inputA, inputB: s.inputB }))
  );

  // Chart data: annual CF for 20 years
  const cfData = useMemo(() =>
    resultA.cashFlows.slice(0, 20).map((row, i) => ({
      year: `${row.year}年`,
      'A 税引後CF': Math.round(row.afterTaxCF / 10000),
      'B 税引後CF': Math.round((resultB.cashFlows[i]?.afterTaxCF ?? 0) / 10000),
      'A 累計CF': Math.round(row.cumulativeCF / 10000),
      'B 累計CF': Math.round((resultB.cashFlows[i]?.cumulativeCF ?? 0) / 10000),
    })),
    [resultA.cashFlows, resultB.cashFlows]
  );

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

      {/* Loan Type Selector */}
      <div className="p-6 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 住宅ローン */}
          <Link href="/home-sim" className="group bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 p-5 transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏠</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-navy-500">住宅ローン</h3>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">マイホーム</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-3">自宅購入のシミュレーション。月々返済額・住宅ローン控除（13年）・金利上昇リスクを分析します。</p>
                <div className="flex flex-wrap gap-1.5">
                  {['月々返済額', '住宅ローン控除', '金利リスク', '繰上げ返済'].map(t => (
                    <span key={t} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-blue-300 group-hover:text-blue-500 text-xl transition-colors">→</span>
            </div>
          </Link>

          {/* 収益用ローン */}
          <Link href="/input" className="group bg-white rounded-xl border-2 border-orange-200 hover:border-orange-400 p-5 transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏗️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-navy-500">収益用ローン</h3>
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">投資物件</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-3">投資用不動産のシミュレーション。家賃収入・キャッシュフロー・売却益・税金を総合分析します。</p>
                <div className="flex flex-wrap gap-1.5">
                  {['家賃収入CF', '売却シナリオ', 'CAGR/DSCR', '税引後利回り'].map(t => (
                    <span key={t} className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-orange-300 group-hover:text-orange-500 text-xl transition-colors">→</span>
            </div>
          </Link>
        </div>

        {/* 3-step guide */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4 mb-6">
          <div className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-wider">📋 はじめての方へ — 3ステップで完成</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: '01', icon: '📝', title: '物件情報を入力', desc: '入力フォームで物件価格・金利・家賃を入力', href: '/input', color: 'border-orange-200 bg-orange-50' },
              { step: '02', icon: '📊', title: '各指標を確認', desc: 'CF分析・返済スケジュール・利回り・売却試算を確認', href: '/cashflow', color: 'border-blue-200 bg-blue-50' },
              { step: '03', icon: '📄', title: 'PDF出力して提案', desc: '各ページのPDF出力ボタンで資金計画書を作成', href: '/funding-plan', color: 'border-success-500 bg-success-50' },
            ].map(s => (
              <Link key={s.step} href={s.href} className={`rounded-lg border-2 ${s.color} p-3 hover:shadow-md transition-all group`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[10px] font-bold text-neutral-400">STEP {s.step}</span>
                </div>
                <div className="text-sm font-bold text-neutral-700 mb-1">{s.title}</div>
                <div className="text-xs text-neutral-500 leading-relaxed">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Pattern A Quick Stats */}
        <section>
          <h2 className="text-sm font-bold text-navy-500 mb-3 flex items-center gap-2">
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">パターンA</span>
            {inputA.propertyName} — {yen(inputA.propertyPrice)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox label="月々返済額" value={yen(resultA.monthlyPayment)} unit="/月" sub="元利均等返済" />
            <StatBox label="表面利回り" value={pct(resultA.ratios.grossYield)} positive={resultA.ratios.grossYield >= 0.04} sub="4%以上が目安" />
            <StatBox label="実質利回り" value={pct(resultA.ratios.netYield)} positive={resultA.ratios.netYield >= 0.02} negative={resultA.ratios.netYield < 0} sub="空室・費用控除後" />
            <StatBox label="税引後CF(1年目)" value={yen(resultA.cashFlows[0]?.afterTaxCF)} positive={resultA.cashFlows[0]?.afterTaxCF >= 0} negative={resultA.cashFlows[0]?.afterTaxCF < 0} sub="税・ローン返済後の手取り" />
            <StatBox label="売却手残り(標準)" value={yen(saleA.afterTaxProfit)} positive={saleA.afterTaxProfit >= 0} negative={saleA.afterTaxProfit < 0} sub={`${inputA.holdingYears}年後・譲渡税控除後`} />
            <StatBox label="CAGR" value={cagr(saleA.cagr)} positive={saleA.cagr >= 0.03} negative={saleA.cagr < 0} sub="年平均複利リターン" />
          </div>
        </section>

        {/* Pattern B Quick Stats */}
        <section>
          <h2 className="text-sm font-bold text-navy-500 mb-3 flex items-center gap-2">
            <span className="bg-orange-300 text-navy-500 text-xs px-2 py-0.5 rounded font-bold">パターンB</span>
            {inputB.propertyName} — {yen(inputB.propertyPrice)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox label="月々返済額" value={yen(resultB.monthlyPayment)} unit="/月" sub="元利均等返済" />
            <StatBox label="表面利回り" value={pct(resultB.ratios.grossYield)} positive={resultB.ratios.grossYield >= 0.04} sub="4%以上が目安" />
            <StatBox label="実質利回り" value={pct(resultB.ratios.netYield)} positive={resultB.ratios.netYield >= 0.02} negative={resultB.ratios.netYield < 0} sub="空室・費用控除後" />
            <StatBox label="税引後CF(1年目)" value={yen(resultB.cashFlows[0]?.afterTaxCF)} positive={resultB.cashFlows[0]?.afterTaxCF >= 0} negative={resultB.cashFlows[0]?.afterTaxCF < 0} sub="税・ローン返済後の手取り" />
            <StatBox label="売却手残り(標準)" value={yen(saleB.afterTaxProfit)} positive={saleB.afterTaxProfit >= 0} negative={saleB.afterTaxProfit < 0} sub={`${inputB.holdingYears}年後・譲渡税控除後`} />
            <StatBox label="CAGR" value={cagr(saleB.cagr)} positive={saleB.cagr >= 0.03} negative={saleB.cagr < 0} sub="年平均複利リターン" />
          </div>
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annual CF Chart */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4 overflow-hidden">
            <h3 className="text-sm font-bold text-navy-500 mb-3">年次税引後キャッシュフロー（万円）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cfData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4 overflow-hidden">
            <h3 className="text-sm font-bold text-navy-500 mb-3">累計キャッシュフロー（万円）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cfData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                  <th scope="col" className="px-4 py-2 text-left text-xs text-neutral-500 font-semibold">シナリオ</th>
                  {['悲観(−10%)', '標準', '楽観(+10%)'].map(s => (
                    <th key={s} scope="col" colSpan={2} className="px-4 py-2 text-center text-xs text-neutral-500 font-semibold">{s}</th>
                  ))}
                </tr>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th scope="col" className="px-4 py-2 text-left text-xs text-neutral-400"></th>
                  {[0,1,2].map(i => (
                    <React.Fragment key={i}>
                      <th scope="col" className="px-3 py-1.5 text-center text-xs font-semibold text-orange-500">パターンA</th>
                      <th scope="col" className="px-3 py-1.5 text-center text-xs font-semibold text-orange-300">パターンB</th>
                    </React.Fragment>
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
                        <React.Fragment key={si}>
                          <td className={`px-3 py-2 text-right text-xs font-semibold ${vA >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{row.fmt(vA)}</td>
                          <td className={`px-3 py-2 text-right text-xs font-semibold ${vB >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{row.fmt(vB)}</td>
                        </React.Fragment>
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
