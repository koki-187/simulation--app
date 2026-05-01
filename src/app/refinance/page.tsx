'use client';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout';
import { useShallow } from 'zustand/react/shallow';
import { useRefinanceStore } from '@/store/refinanceStore';
import { REFINANCE_BANKS_2026, calcProcessingFee } from '@/lib/data/refinanceBanks2026';
import { calcRefinance, type RefinanceResult } from '@/lib/calc/refinance';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';

const yenM = (n: number) => (n / 10000).toFixed(0) + '万円';
const pct = (n: number) => n.toFixed(3) + '%';

function NumberInput({
  label, value, onChange, min, max, step, unit, hint, readOnly
}: {
  label: string; value: number; onChange?: (v: number) => void;
  min?: number; max?: number; step?: number;
  unit?: string; hint?: string; readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number" value={value}
          readOnly={readOnly}
          min={min} max={max} step={step}
          onChange={e => onChange?.(Number(e.target.value))}
          className={`input-cell flex-1 ${readOnly ? 'bg-neutral-50 text-neutral-500' : ''}`}
        />
        {unit && <span className="text-xs text-neutral-500 shrink-0">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const filled = Math.round(value);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-3 h-3 rounded-sm ${i < filled ? 'bg-orange-500' : 'bg-neutral-200'}`} />
      ))}
    </div>
  );
}

export default function RefinancePage() {
  const {
    currentBalance, currentRate, remainingYears, prepaymentPenalty,
    currentBank, registrationFee, otherFees,
    selectedBankId, rateTypeFilter, sortBy, set,
  } = useRefinanceStore(
    useShallow(s => ({
      currentBalance: s.currentBalance, currentRate: s.currentRate,
      remainingYears: s.remainingYears, prepaymentPenalty: s.prepaymentPenalty,
      currentBank: s.currentBank, registrationFee: s.registrationFee,
      otherFees: s.otherFees, selectedBankId: s.selectedBankId,
      rateTypeFilter: s.rateTypeFilter, sortBy: s.sortBy, set: s.set,
    }))
  );

  const [showAllBanks, setShowAllBanks] = useState(false);

  // Use 2026 bank data; showAllBanks = include banks with rate >= current rate (for reference)
  const eligibleBanks = useMemo(() =>
    REFINANCE_BANKS_2026.filter(b =>
      (rateTypeFilter === 'all' || b.rateType === rateTypeFilter) &&
      (showAllBanks || b.rate < currentRate)
    ),
    [showAllBanks, rateTypeFilter, currentRate]
  );

  const input = { currentBalance, currentRate, remainingYears, prepaymentPenalty, registrationFee, otherFees };

  const results: RefinanceResult[] = useMemo(() =>
    eligibleBanks.map(b => {
      const processingFee = calcProcessingFee(b, currentBalance);
      return calcRefinance(input, { id: b.id, name: b.name, rate: b.rate, fee: processingFee, rateType: b.rateType, areas: [] });
    }).sort((a, b_) => {
      if (sortBy === 'savings') return b_.totalSavingsAll - a.totalSavingsAll;
      if (sortBy === 'breakeven') return a.breakEvenMonths - b_.breakEvenMonths;
      if (sortBy === 'rate') return a.newRate - b_.newRate;
      return a.processingFee - b_.processingFee;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eligibleBanks, currentBalance, currentRate, remainingYears, prepaymentPenalty, registrationFee, otherFees, sortBy]
  );

  const selectedResult = results.find(r => r.bankId === selectedBankId) ?? results[0] ?? null;
  const months = remainingYears * 12;

  // Chart data: cumulative savings over time
  const chartData = useMemo(() => {
    if (!selectedResult) return [];
    return Array.from({ length: Math.min(months, 360) }, (_, i) => {
      const m = i + 1;
      const grossSaving = selectedResult.monthlySavings * m;
      const netSaving = grossSaving - selectedResult.totalCost;
      return {
        month: m,
        year: (m / 12).toFixed(1),
        '累計節約額（費用差引後）': Math.round(netSaving),
        '損益分岐': 0,
      };
    }).filter(d => d.month % 6 === 0 || d.month === 1);
  }, [selectedResult, months]);

  const currentMonthly = useMemo(() => {
    if (currentRate <= 0 || currentBalance <= 0 || remainingYears <= 0) return 0;
    const r = currentRate / 100 / 12;
    const n = remainingYears * 12;
    return (currentBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [currentBalance, currentRate, remainingYears]);

  const totalInterestCurrent = useMemo(() => {
    if (currentMonthly <= 0) return 0;
    return currentMonthly * remainingYears * 12 - currentBalance;
  }, [currentMonthly, remainingYears, currentBalance]);

  const bestResult = results[0];
  const rateDiff = bestResult ? (currentRate - bestResult.newRate).toFixed(3) : '0';

  // Score for each result (1-5 stars)
  const getScore = (r: RefinanceResult): number => {
    if (!r.isWorthwhile) return 1;
    if (r.breakEvenMonths <= 24) return 5;
    if (r.breakEvenMonths <= 48) return 4;
    if (r.breakEvenMonths <= 72) return 3;
    return 2;
  };

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4">
        <h1 className="text-lg font-bold">🔄 借り換えシミュレーター</h1>
        <p className="text-xs text-navy-100 mt-0.5">
          現在のローンを見直して、最適な借り換え先を比較・試算します
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

        {/* KPI Alert Banner */}
        {bestResult && bestResult.isWorthwhile && (
          <div className="bg-success-50 border border-success-500 rounded-xl p-4 flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-success-500 text-sm">
                {bestResult.bankName.slice(0, 20)} に借り換えると…
              </p>
              <p className="text-sm text-neutral-700 mt-0.5">
                月々 <span className="font-bold text-success-500">{yenM(bestResult.monthlySavings)}</span> の削減、
                残期間合計で <span className="font-bold text-success-500">{yenM(bestResult.totalSavingsAll)}</span> の節約。
                損益分岐点は <span className="font-bold text-navy-500">{bestResult.breakEvenMonths}ヶ月後</span>。
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">📋 現在のローン情報</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">現行銀行名</label>
                  <input
                    type="text" value={currentBank}
                    onChange={e => set({ currentBank: e.target.value })}
                    placeholder="例：楽天銀行"
                    className="input-cell text-left"
                  />
                </div>
                <NumberInput label="現在の残債" value={currentBalance / 10000}
                  onChange={v => set({ currentBalance: v * 10000 })}
                  min={100} max={100000} step={100} unit="万円"
                  hint={`残債 ${yenM(currentBalance)}`} />
                <NumberInput label="現在の金利（年）" value={currentRate}
                  onChange={v => set({ currentRate: v })}
                  min={0.1} max={10} step={0.001} unit="%"
                  hint="変動金利は毎月更新されます" />
                <NumberInput label="残返済期間" value={remainingYears}
                  onChange={v => set({ remainingYears: Math.max(1, Math.min(50, v)) })}
                  min={1} max={50} step={1} unit="年" />
                <NumberInput label="現在の月返済額（参考）"
                  value={Math.round(currentMonthly)} readOnly unit="円" />
                <NumberInput label="残利息総額（参考）"
                  value={Math.round(totalInterestCurrent)} readOnly unit="円"
                  hint={`${yenM(totalInterestCurrent)} の利息が残っています`} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">💴 借り換えコスト設定</h3>
              <div className="space-y-3">
                <NumberInput label="繰上返済手数料（現行銀行）"
                  value={prepaymentPenalty / 10000}
                  onChange={v => set({ prepaymentPenalty: v * 10000 })}
                  min={0} max={100} step={1} unit="万円"
                  hint="楽天銀行はオンライン手続きで0円" />
                <NumberInput label="抵当権設定・抹消（登記費用）"
                  value={registrationFee / 10000}
                  onChange={v => set({ registrationFee: v * 10000 })}
                  min={0} max={100} step={1} unit="万円"
                  hint="司法書士費用込み目安：15万円" />
                <NumberInput label="その他費用"
                  value={otherFees / 10000}
                  onChange={v => set({ otherFees: v * 10000 })}
                  min={0} max={100} step={1} unit="万円" />
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">🔍 絞り込み</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">金利タイプ</label>
                  <div className="flex gap-1">
                    {(['all', '変動', '固定'] as const).map(t => (
                      <button key={t} onClick={() => set({ rateTypeFilter: t })}
                        className={`flex-1 text-xs px-2 py-1.5 rounded border transition-colors ${rateTypeFilter === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>
                        {t === 'all' ? '全て' : t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">並び順</label>
                  <select value={sortBy} onChange={e => set({ sortBy: e.target.value as typeof sortBy })}
                    className="input-cell w-full text-left text-xs">
                    <option value="savings">節約総額（大きい順）</option>
                    <option value="breakeven">損益分岐点（早い順）</option>
                    <option value="rate">金利（低い順）</option>
                    <option value="fee">事務手数料（安い順）</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showAllBanks} onChange={e => setShowAllBanks(e.target.checked)}
                    className="rounded" />
                  <span className="text-xs text-neutral-600">借換え対応タグ以外も表示</span>
                </label>
              </div>
            </div>
          </div>

          {/* Center + Right: Results */}
          <div className="lg:col-span-2 space-y-4">

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">現在の月返済額</p>
                <p className="text-lg font-bold text-danger-500">{yenM(currentMonthly)}</p>
                <p className="text-xs text-neutral-400">金利 {pct(currentRate)}</p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">最大月間節約額</p>
                <p className="text-lg font-bold text-success-500">{bestResult ? yenM(bestResult.monthlySavings) : '—'}</p>
                <p className="text-xs text-neutral-400">金利差 {rateDiff}%</p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">最大総節約額</p>
                <p className="text-lg font-bold text-navy-500">{bestResult ? yenM(bestResult.totalSavingsAll) : '—'}</p>
                <p className="text-xs text-neutral-400">費用差引後</p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">最短損益分岐</p>
                <p className="text-lg font-bold text-orange-500">{bestResult ? `${bestResult.breakEvenMonths}ヶ月` : '—'}</p>
                <p className="text-xs text-neutral-400">{bestResult ? `約${(bestResult.breakEvenMonths / 12).toFixed(1)}年` : ''}</p>
              </div>
            </div>

            {/* Results table */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
              <div className="bg-navy-500 text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold text-sm">
                  借り換え候補 {results.length}件
                  <span className="text-navy-100 font-normal text-xs ml-2">（現在金利 {pct(currentRate)} より低い銀行のみ）</span>
                </span>
              </div>
              {results.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  現在の金利より低い銀行が見つかりません。<br />
                  「借換え対応タグ以外も表示」をオンにするか、金利タイプを変更してください。
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-3 py-2 text-left font-semibold text-neutral-600">銀行名</th>
                        <th className="px-3 py-2 text-center font-semibold text-neutral-600">金利</th>
                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">月削減額</th>
                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">事務手数料</th>
                        <th className="px-3 py-2 text-center font-semibold text-neutral-600">損益分岐</th>
                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">総節約額</th>
                        <th className="px-3 py-2 text-center font-semibold text-neutral-600">評価</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.bankId}
                          onClick={() => set({ selectedBankId: r.bankId })}
                          className={`cursor-pointer border-b border-neutral-100 transition-colors ${
                            (selectedBankId === r.bankId || (!selectedBankId && i === 0))
                              ? 'bg-orange-50 ring-1 ring-orange-300'
                              : i % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 hover:bg-neutral-100'
                          }`}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-navy-500 leading-tight">{r.bankName.slice(0, 22)}</div>
                            <div className="text-neutral-400 text-[10px]">{r.rateType}</div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-success-500">{pct(r.newRate)}</span>
                            <div className="text-[10px] text-danger-500">▼{(currentRate - r.newRate).toFixed(3)}%</div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-success-500">{yenM(r.monthlySavings)}</td>
                          <td className="px-3 py-2 text-right text-neutral-600">{yenM(r.processingFee)}</td>
                          <td className="px-3 py-2 text-center">
                            {r.breakEvenMonths === Infinity ? (
                              <span className="text-danger-500">—</span>
                            ) : (
                              <span className={`font-semibold ${r.breakEvenMonths <= 36 ? 'text-success-500' : r.breakEvenMonths <= 72 ? 'text-orange-500' : 'text-danger-500'}`}>
                                {r.breakEvenMonths}ヶ月
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={`font-bold ${r.totalSavingsAll > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              {yenM(r.totalSavingsAll)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <ScoreBar value={getScore(r)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected bank detail */}
            {selectedResult && (
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
                <h3 className="text-sm font-bold text-navy-500 mb-4">
                  📊 詳細分析：{selectedResult.bankName.slice(0, 30)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Cost breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 mb-2">借り換えコスト内訳</h4>
                    <div className="space-y-1 text-xs">
                      {[
                        ['事務手数料', selectedResult.processingFee],
                        ['繰上返済手数料', prepaymentPenalty],
                        ['抵当権設定・抹消費用', registrationFee],
                        ['その他費用', otherFees],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-600">{label as string}</span>
                          <span className="font-mono">{yenM(val as number)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold">
                        <span className="text-neutral-700">合計コスト</span>
                        <span className="text-danger-500">{yenM(selectedResult.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Interest comparison */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 mb-2">利息比較（残期間）</h4>
                    <div className="space-y-1 text-xs">
                      {[
                        ['現在の残利息', selectedResult.totalInterestCurrent, 'text-danger-500'],
                        ['借り換え後の残利息', selectedResult.totalInterestNew, 'text-success-500'],
                        ['利息節約額', selectedResult.totalInterestCurrent - selectedResult.totalInterestNew, 'text-navy-500 font-bold'],
                        ['費用差引後の純節約', selectedResult.totalSavingsAll, selectedResult.totalSavingsAll > 0 ? 'text-success-500 font-bold' : 'text-danger-500 font-bold'],
                      ].map(([label, val, cls]) => (
                        <div key={label as string} className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-600">{label as string}</span>
                          <span className={`font-mono ${cls as string}`}>{yenM(val as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cumulative savings chart */}
                <h4 className="text-xs font-bold text-neutral-500 mb-2">累計節約額の推移</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }}
                      tickFormatter={v => `${v}年`} interval={Math.floor(chartData.length / 6)} />
                    <YAxis tick={{ fontSize: 9 }}
                      tickFormatter={v => `${Math.round(v / 10000)}万`} />
                    <Tooltip formatter={(v: unknown) => [`${yenM(v as number)}`, '累計節約額']}
                      labelFormatter={v => `${v}年後`} />
                    <ReferenceLine y={0} stroke="#E74C3C" strokeDasharray="4 4" label={{ value: '損益分岐', position: 'right', fontSize: 9 }} />
                    <Area type="monotone" dataKey="累計節約額（費用差引後）"
                      stroke="#27AE60" fill="#E8F8EF" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Explanation panel */}
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-3">📖 借り換えの基礎知識</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              { title: '借り換えが有利になる目安', body: '一般的に「金利差0.3%以上」「残期間10年以上」「残債1,000万円以上」の3条件が揃うと効果が大きいとされます。' },
              { title: '損益分岐点とは', body: '借り換えにかかった費用を、毎月の削減額で回収するまでの期間。この月数が残返済期間より短ければ借り換えにメリットがあります。' },
              { title: '変動金利リスク', body: '変動金利は半年ごとに見直され、金利上昇時は月返済額が増加します。楽天銀行のように2022年0.537%→現在1.511%と約3倍になった事例もあります。' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-lg p-3 border border-neutral-100">
                <div className="font-bold text-navy-500 mb-1">{item.title}</div>
                <div className="text-neutral-600 leading-relaxed">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
