'use client';
import { Fragment, memo, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout';
import { useShallow } from 'zustand/react/shallow';
import { useRefinanceStore } from '@/store/refinanceStore';
import { REFINANCE_BANKS_2026, calcProcessingFee } from '@/lib/data/refinanceBanks2026';
import { findExitFee } from '@/lib/data/currentBankExitFees';
import {
  calcRefinance,
  estimateRegistrationFee,
  checkThreeConditions,
  calcRefinanceScenario,
  type RefinanceResult,
  type RefinanceInput,
} from '@/lib/calc/refinance';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area, Legend,
} from 'recharts';

const yenM = (n: number) => {
  const m = Math.round(n / 10000);
  return m.toLocaleString('ja-JP') + '万円';
};
const pct = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(3)) + '%';

async function exportRefinancePDF(
  results: RefinanceResult[],
  input: RefinanceInput,
  currentBank: string
) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');

  const today = new Date().toLocaleDateString('ja-JP');

  const tableRows = results.slice(0, 15).map((r, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:3px 6px;border:1px solid #E5E7EB;">${r.bankName}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:center;color:#16A34A;font-weight:bold;">${pct(r.newRate)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:#16A34A;">${yenM(r.monthlySavings)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${yenM(r.processingFee)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${yenM(r.totalCost)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:center;">${r.breakEvenMonths === Infinity ? '—' : r.breakEvenMonths + 'ヶ月'}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:${r.totalSavingsAll > 0 ? '#16A34A' : '#DC2626'};font-weight:bold;">${yenM(r.totalSavingsAll)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:center;">${r.isWorthwhile ? '◎' : '△'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="padding:20px;">
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:8px;">
        <div style="font-size:16px;font-weight:bold;">借り換えシミュレーション結果</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">
          現行: ${currentBank} ／ 残債 ${yenM(input.currentBalance)} ／ 金利 ${pct(input.currentRate)} ／ 残${input.remainingYears}年 ／ 作成日: ${today}
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead>
          <tr style="background:#1C2B4A;color:white;">
            <th style="padding:4px 6px;border:1px solid #374151;text-align:left;">銀行名</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:center;">金利</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">月削減額</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">事務手数料</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">総費用</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:center;">損益分岐</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">総節約額（費用後）</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:center;">評価</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | TERASS株式会社
      </div>
    </div>
  `;

  await elementToPdf({
    html,
    filename: `TERASS_借り換え比較_${today.replace(/\//g, '')}.pdf`,
    orientation: 'landscape',
  });
}

function NumberInput({
  label, value, onChange, min, max, step, unit, hint, readOnly,
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

const StarRating = memo(function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-sm ${i < score ? 'text-orange-400' : 'text-neutral-200'}`}>★</span>
      ))}
    </div>
  );
});

const ThreeConditionBadge = memo(function ThreeConditionBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${ok ? 'bg-success-50 border-success-200 text-success-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
      <span>{ok ? '✅' : '❌'}</span>
      <span>{label}</span>
    </div>
  );
});

function dansinIcon(dansin: string): string {
  if (dansin === 'がん100%無料') return '🩺';
  if (dansin === 'がん50%無料') return '💊';
  if (dansin === '充実団信') return '🛡️';
  return '';
}

function getScore(r: RefinanceResult): number {
  if (!r.isWorthwhile) return 1;
  const savingScore = r.totalSavingsAll > 5_000_000 ? 2 : r.totalSavingsAll > 2_000_000 ? 1 : 0;
  if (r.breakEvenMonths <= 24) return Math.min(5, 4 + savingScore);
  if (r.breakEvenMonths <= 48) return Math.min(4, 3 + savingScore);
  if (r.breakEvenMonths <= 72) return 3;
  return 2;
}

export default function RefinancePage() {
  const {
    currentBalance, currentRate, remainingYears, prepaymentPenalty,
    currentBank, registrationFee, autoRegistrationFee, otherFees,
    selectedBankId, rateTypeFilter, sortBy, set,
    rateDataMonth, refreshedRates, refreshDataDate,
  } = useRefinanceStore(
    useShallow(s => ({
      currentBalance: s.currentBalance, currentRate: s.currentRate,
      remainingYears: s.remainingYears, prepaymentPenalty: s.prepaymentPenalty,
      currentBank: s.currentBank, registrationFee: s.registrationFee,
      autoRegistrationFee: s.autoRegistrationFee,
      otherFees: s.otherFees, selectedBankId: s.selectedBankId,
      rateTypeFilter: s.rateTypeFilter, sortBy: s.sortBy, set: s.set,
      rateDataMonth: s.rateDataMonth,
      refreshedRates: s.refreshedRates,
      refreshDataDate: s.refreshDataDate,
    }))
  );

  const [showAllBanks, setShowAllBanks] = useState(false);
  const [scenarioDelta, setScenarioDelta] = useState(0);
  const [expandedBankId, setExpandedBankId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ foundCount: number; total: number } | null>(null);

  const currentMonthJST = useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit'
    }).formatToParts(now);
    const y = parts.find(p => p.type === 'year')?.value ?? String(now.getFullYear());
    const m = parts.find(p => p.type === 'month')?.value ?? String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const isAlreadyUpdatedThisMonth = rateDataMonth === currentMonthJST;

  const handleRefreshRates = async () => {
    if (isRefreshing || isAlreadyUpdatedThisMonth) return;
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshResult(null);
    try {
      const res = await fetch('/api/refresh-rates', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`サーバーエラー (${res.status}): ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? '更新に失敗しました');
      // Only update rates that passed validation (non-null values)
      const validRates: Record<string, number> = {};
      for (const [k, v] of Object.entries(data.rates as Record<string, unknown>)) {
        if (typeof v === 'number' && v >= 0.1 && v <= 3.5) validRates[k] = v;
      }
      // Use getState() to avoid stale closure when merging rates
      const currentRates = useRefinanceStore.getState().refreshedRates;
      set({
        rateDataMonth: data.month,
        refreshedRates: { ...currentRates, ...validRates },
        refreshDataDate: data.updatedAt,
      });
      setRefreshResult({ foundCount: data.foundCount, total: data.totalBanks });
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : '更新エラー');
    } finally {
      setIsRefreshing(false);
    }
  };

  const effectiveRegistrationFee = useMemo(
    () => autoRegistrationFee ? estimateRegistrationFee(currentBalance) : registrationFee,
    [autoRegistrationFee, currentBalance, registrationFee]
  );

  const currentBankExitFee = useMemo(() => findExitFee(currentBank), [currentBank]);

  const eligibleBanks = useMemo(() =>
    REFINANCE_BANKS_2026.filter(b => {
      const effectiveRate = refreshedRates[b.id] ?? b.rate;
      return (
        (rateTypeFilter === 'all' || b.rateType === rateTypeFilter) &&
        (showAllBanks || effectiveRate < currentRate)
      );
    }),
    [showAllBanks, rateTypeFilter, currentRate, refreshedRates]
  );

  const bankDataMap = useMemo(
    () => new Map(REFINANCE_BANKS_2026.map(b => [b.id, b])),
    []
  );

  const input: RefinanceInput = {
    currentBalance,
    currentRate,
    remainingYears,
    prepaymentPenalty,
    registrationFee: effectiveRegistrationFee,
    otherFees,
  };

  const results: RefinanceResult[] = useMemo(() =>
    eligibleBanks.map(b => {
      const processingFee = calcProcessingFee(b, currentBalance);
      const effectiveRate = refreshedRates[b.id] ?? b.rate;
      return calcRefinance(input, { id: b.id, name: b.name, rate: effectiveRate, fee: processingFee, rateType: b.rateType, areas: [] });
    }).sort((a, b_) => {
      if (sortBy === 'savings') return b_.totalSavingsAll - a.totalSavingsAll;
      if (sortBy === 'breakeven') {
        if (a.breakEvenMonths === Infinity && b_.breakEvenMonths === Infinity) return 0;
        if (a.breakEvenMonths === Infinity) return 1;
        if (b_.breakEvenMonths === Infinity) return -1;
        return a.breakEvenMonths - b_.breakEvenMonths;
      }
      if (sortBy === 'rate') return a.newRate - b_.newRate;
      return a.processingFee - b_.processingFee;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eligibleBanks, currentBalance, currentRate, remainingYears, prepaymentPenalty, effectiveRegistrationFee, otherFees, sortBy, refreshedRates]
  );

  const scenarioResults = useMemo(() =>
    scenarioDelta > 0
      ? results.map(r => ({ ...r, scenario: calcRefinanceScenario(r, input, scenarioDelta) }))
      : results.map(r => ({ ...r, scenario: null })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, scenarioDelta]
  );

  const selectedResult = useMemo(
    () => results.find(r => r.bankId === selectedBankId) ?? results[0] ?? null,
    [results, selectedBankId]
  );
  const bestResult = useMemo(() => results[0] ?? null, [results]);
  const months = remainingYears * 12;

  const bestConditions = bestResult
    ? checkThreeConditions(currentRate, bestResult.newRate, remainingYears, currentBalance)
    : null;

  const conditionsOkCount = bestConditions
    ? [bestConditions.rateDiffOk, bestConditions.remainingYearsOk, bestConditions.balanceOk].filter(Boolean).length
    : 0;

  // Chart data: cumulative savings over time (base + scenario)
  const chartData = useMemo(() => {
    if (!selectedResult) return [];
    const selectedScenario = scenarioDelta > 0
      ? calcRefinanceScenario(selectedResult, input, scenarioDelta)
      : null;
    return Array.from({ length: Math.min(months, 360) }, (_, i) => {
      const m = i + 1;
      const netSaving = selectedResult.monthlySavings * m - selectedResult.totalCost;
      const entry: Record<string, number> = {
        month: m,
        '累計節約額（ベース）': Math.round(netSaving),
      };
      if (selectedScenario) {
        entry['累計節約額（金利上昇シナリオ）'] = Math.round(
          selectedScenario.newMonthlySavings * m - selectedResult.totalCost
        );
      }
      return entry;
    }).filter(d => d.month % 6 === 0 || d.month === 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResult, months, scenarioDelta]);

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

  const autoFeeBreakdown = useMemo(() => {
    const mortgageTax = Math.floor(currentBalance * 0.004);
    const judicialScrivener = 70_000;
    const stampDuty = currentBalance >= 10_000_000 ? 20_000 : 10_000;
    const cancellation = 2_000;
    return { mortgageTax, judicialScrivener, stampDuty, cancellation };
  }, [currentBalance]);

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">🔄 借り換えシミュレーター</h1>
          <p className="text-xs text-navy-100 mt-0.5">現在のローンを見直して、最適な借り換え先を比較・試算します</p>
          <p className="text-[10px] text-navy-200 mt-0.5">
            📅 データ基準日：{refreshDataDate
              ? new Date(refreshDataDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' }) + '時点の金利水準'
              : '2026年5月1日時点の金利水準'}
            {rateDataMonth && (
              <span className="ml-1">（{rateDataMonth.replace(/^(\d{4})-0?(\d+)$/, '$1年$2月')}更新済）</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 金利更新ボタン */}
          <button
            onClick={handleRefreshRates}
            disabled={isRefreshing || isAlreadyUpdatedThisMonth}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${
              isAlreadyUpdatedThisMonth
                ? 'bg-navy-600 text-navy-300 cursor-not-allowed'
                : isRefreshing
                  ? 'bg-navy-600 text-white cursor-wait'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isRefreshing ? '⏳ 更新中...' : isAlreadyUpdatedThisMonth
              ? `✅ ${rateDataMonth?.replace(/^(\d{4})-0?(\d+)$/, '$1年$2月')} 更新済み`
              : '🔄 金利を最新化'}
          </button>
          {/* PDF出力ボタン */}
          <button
            onClick={async () => {
              setPdfLoading(true);
              try {
                await exportRefinancePDF(results, input, currentBank);
              } catch (e) {
                console.error(e);
                alert('PDF出力エラー');
              } finally {
                setPdfLoading(false);
              }
            }}
            disabled={pdfLoading || results.length === 0}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
          </button>
        </div>
      </div>
      {/* 更新結果トースト */}
      {(refreshResult || refreshError) && (
        <div className={`mx-6 mt-2 px-4 py-2 rounded-lg text-sm ${refreshError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {refreshError ? `⚠️ ${refreshError}` : `✅ ${refreshResult?.foundCount}/${refreshResult?.total}行を更新しました`}
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

        {/* 3-conditions check banner */}
        {bestConditions && (
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <ThreeConditionBadge ok={bestConditions.rateDiffOk} label={`金利差 ${bestConditions.rateDiff.toFixed(3)}% (目安0.3%以上)`} />
              <ThreeConditionBadge ok={bestConditions.remainingYearsOk} label={`残期間 ${remainingYears}年 (目安10年以上)`} />
              <ThreeConditionBadge ok={bestConditions.balanceOk} label={`残債 ${yenM(currentBalance)} (目安1,000万以上)`} />
            </div>
            <p className="text-xs text-neutral-600">
              {bestConditions.allOk
                ? '✅ 3条件クリア — 借り換えの効果が期待できます'
                : conditionsOkCount === 2
                  ? '⚠️ 2条件クリア — 一定の効果はあります'
                  : '❌ 借り換え効果が限定的な可能性があります'}
            </p>
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
                    onChange={e => {
                      const name = e.target.value;
                      set({ currentBank: name });
                      const exitFee = findExitFee(name);
                      if (exitFee !== null) {
                        set({ prepaymentPenalty: exitFee.fullPrepaymentFee });
                      }
                    }}
                    placeholder="例：楽天銀行"
                    className="input-cell text-left"
                  />
                  {currentBankExitFee ? (
                    <p className="text-[10px] text-orange-600">
                      💡 {currentBankExitFee.bankName}の繰上返済手数料を自動入力しました（{currentBankExitFee.notes}）
                    </p>
                  ) : null}
                </div>
                <NumberInput label="現在の残債" value={currentBalance / 10000}
                  onChange={v => set({ currentBalance: Math.max(0, v) * 10000 })}
                  min={100} max={100000} step={100} unit="万円"
                  hint={`残債 ${yenM(currentBalance)}`} />
                <NumberInput label="現在の金利（年）" value={currentRate}
                  onChange={v => set({ currentRate: Math.max(0.01, Math.min(20, v)) })}
                  min={0.1} max={10} step={0.001} unit="%"
                  hint="変動金利は毎月更新されます" />
                <NumberInput label="残返済期間" value={remainingYears}
                  onChange={v => set({ remainingYears: Math.max(1, Math.min(50, Math.round(v))) })}
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

                {/* Auto registration fee toggle */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-700">抵当権設定・抹消（登記費用）</label>
                    <button
                      onClick={() => set({ autoRegistrationFee: !autoRegistrationFee })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${autoRegistrationFee ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'}`}
                    >
                      {autoRegistrationFee ? '自動計算' : '手動設定'}
                    </button>
                  </div>
                  {autoRegistrationFee ? (
                    <div>
                      <div className="input-cell bg-neutral-50 text-neutral-500 text-xs py-1.5">
                        {yenM(effectiveRegistrationFee)}（自動計算）
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        抵当権設定税 {yenM(autoFeeBreakdown.mortgageTax)} + 司法書士 7万 + 印紙税 {autoFeeBreakdown.stampDuty >= 20000 ? '2万' : '1万'} + 抹消 0.2万
                      </p>
                    </div>
                  ) : (
                    <NumberInput label="" value={registrationFee / 10000}
                      onChange={v => set({ registrationFee: v * 10000 })}
                      min={0} max={100} step={1} unit="万円"
                      hint="司法書士費用込み目安：15〜20万円" />
                  )}
                </div>

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

                {/* Rate scenario */}
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">金利上昇シナリオ</label>
                  <div className="flex gap-1">
                    {([
                      { label: '🌤 現状維持', value: 0 },
                      { label: '⚡ +0.3%', value: 0.3 },
                      { label: '🌩 +0.5%', value: 0.5 },
                    ] as const).map(s => (
                      <button key={s.value} onClick={() => setScenarioDelta(s.value)}
                        className={`flex-1 text-[10px] px-1.5 py-1.5 rounded border transition-colors leading-tight ${scenarioDelta === s.value ? 'bg-navy-500 text-white border-navy-500' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showAllBanks} onChange={e => setShowAllBanks(e.target.checked)}
                    className="rounded" />
                  <span className="text-xs text-neutral-600">現在金利以上の銀行も参考表示</span>
                </label>

                {Object.keys(refreshedRates).length > 0 && (
                  <p className="text-[10px] text-success-600">
                    ✅ {Object.keys(refreshedRates).length}行の金利を最新データで表示中
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center + Right: Results */}
          <div className="lg:col-span-2 space-y-4">

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">現在の月返済額</p>
                <p className="text-lg font-bold text-danger-500">{yenM(currentMonthly)}</p>
                <p className="text-xs text-neutral-400">金利 {pct(currentRate)}</p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-3">
                <p className="text-xs text-neutral-500">借換え後月返済</p>
                <p className="text-lg font-bold text-success-500">{bestResult ? yenM(bestResult.newMonthly) : '—'}</p>
                <p className="text-xs text-neutral-400">{bestResult ? `月 ${yenM(bestResult.monthlySavings)} 削減` : ''}</p>
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
                  「現在金利以上の銀行も参考表示」をオンにするか、金利タイプを変更してください。
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
                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">総節約額{scenarioDelta > 0 ? '（ベース）' : ''}</th>
                        <th className="px-3 py-2 text-center font-semibold text-neutral-600">評価</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioResults.map((r, i) => {
                        const bankData = bankDataMap.get(r.bankId);
                        const isSelected = selectedBankId === r.bankId || (!selectedBankId && i === 0);
                        const isExpanded = expandedBankId === r.bankId;
                        const hasMinLoanWarning = bankData && currentBalance < bankData.minLoanAmount;
                        return (
                          <Fragment key={r.bankId}>
                            <tr
                              onClick={() => {
                                set({ selectedBankId: r.bankId });
                                setExpandedBankId(expandedBankId === r.bankId ? null : r.bankId);
                              }}
                              className={`cursor-pointer border-b border-neutral-100 transition-colors relative ${
                                isSelected
                                  ? 'bg-orange-50 ring-1 ring-orange-300'
                                  : i % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 hover:bg-neutral-100'
                              }`}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  {i === 0 && <span className="text-orange-500 font-bold text-[10px]">🏆</span>}
                                  <div>
                                    <div className="font-medium text-navy-500 leading-tight">
                                      {bankData ? dansinIcon(bankData.dansin) : ''}{' '}
                                      {r.bankName.slice(0, 18)}
                                    </div>
                                    <div className="text-neutral-400 text-[10px]">{r.rateType}</div>
                                  </div>
                                  {hasMinLoanWarning && <span title="最低借入額に注意" className="text-orange-400">⚠️</span>}
                                </div>
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
                                {r.scenario && (
                                  <div className={`text-[10px] ${r.scenario.newTotalSavingsAll > 0 ? 'text-orange-500' : 'text-danger-500'}`}>
                                    ({yenM(r.scenario.newTotalSavingsAll)})
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <StarRating score={getScore(r)} />
                              </td>
                            </tr>
                            {isExpanded && bankData && (
                              <tr key={`${r.bankId}-notes`}>
                                <td colSpan={7} className="px-4 pb-3 bg-orange-50">
                                  <p className="text-xs text-neutral-600 mt-2">{bankData.notes}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${bankData.has5YearRule ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-neutral-100 border-neutral-200 text-neutral-400 line-through'}`}>
                                      5年ルール{bankData.has5YearRule ? 'あり' : 'なし'}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${bankData.has125Rule ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-neutral-100 border-neutral-200 text-neutral-400 line-through'}`}>
                                      1.25倍ルール{bankData.has125Rule ? 'あり' : 'なし'}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-purple-50 border-purple-200 text-purple-600 font-medium">
                                      金利見直し：{bankData.rateRevision}
                                    </span>
                                    {bankData.prepaymentFeeFull > 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-orange-50 border-orange-200 text-orange-600 font-medium">
                                        全額繰上：{bankData.prepaymentFeeFull.toLocaleString('ja-JP')}円
                                      </span>
                                    )}
                                    {bankData.prepaymentFeeFull === 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-success-50 border-success-200 text-success-600 font-medium">
                                        全額繰上：無料
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                                    <span>最低借入: {yenM(bankData.minLoanAmount)}</span>
                                    <span>審査目安: 約{bankData.applyDays}日</span>
                                    <span>団信: {bankData.dansin}</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
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
                      {([
                        ['事務手数料', selectedResult.processingFee],
                        ['繰上返済手数料', prepaymentPenalty],
                        ['抵当権設定・抹消費用', effectiveRegistrationFee],
                        ['その他費用', otherFees],
                      ] as [string, number][]).map(([label, val]) => (
                        <div key={label} className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-600">{label}</span>
                          <span className="font-mono">{yenM(val)}</span>
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
                      {([
                        ['現在の残利息', selectedResult.totalInterestCurrent, 'text-danger-500'],
                        ['借り換え後の残利息', selectedResult.totalInterestNew, 'text-success-500'],
                        ['利息節約額', selectedResult.totalInterestCurrent - selectedResult.totalInterestNew, 'text-navy-500 font-bold'],
                        ['費用差引後の純節約', selectedResult.totalSavingsAll, selectedResult.totalSavingsAll > 0 ? 'text-success-500 font-bold' : 'text-danger-500 font-bold'],
                      ] as [string, number, string][]).map(([label, val, cls]) => (
                        <div key={label} className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-600">{label}</span>
                          <span className={`font-mono ${cls}`}>{yenM(val)}</span>
                        </div>
                      ))}
                      {scenarioDelta > 0 && (() => {
                        const s = calcRefinanceScenario(selectedResult, input, scenarioDelta);
                        return (
                          <div className="flex justify-between py-1 border-b border-neutral-100">
                            <span className="text-orange-600">金利+{scenarioDelta}%上昇時の節約額</span>
                            <span className={`font-mono font-bold ${s.newTotalSavingsAll > 0 ? 'text-orange-500' : 'text-danger-500'}`}>
                              {yenM(s.newTotalSavingsAll)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Cumulative savings chart */}
                <h4 className="text-xs font-bold text-neutral-500 mb-2">
                  累計節約額の推移{scenarioDelta > 0 ? `（+${scenarioDelta}%シナリオ比較）` : ''}
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }}
                      tickFormatter={v => `${(Number(v) / 12).toFixed(0)}年`}
                      interval={Math.floor(chartData.length / 6)} />
                    <YAxis tick={{ fontSize: 9 }}
                      tickFormatter={v => `${Math.round(Number(v) / 10000)}万`} />
                    <Tooltip
                      formatter={(v: unknown) => [`${yenM(v as number)}`]}
                      labelFormatter={v => `${(Number(v) / 12).toFixed(1)}年後`}
                    />
                    <ReferenceLine y={0} stroke="#E74C3C" strokeDasharray="4 4" label={{ value: '損益分岐', position: 'right', fontSize: 9 }} />
                    <Area type="monotone" dataKey="累計節約額（ベース）"
                      stroke="#27AE60" fill="#E8F8EF" strokeWidth={2} />
                    {scenarioDelta > 0 && (
                      <Area type="monotone" dataKey="累計節約額（金利上昇シナリオ）"
                        stroke="#F39C12" fill="#FEF9E7" strokeWidth={2} strokeDasharray="4 2" />
                    )}
                    {scenarioDelta > 0 && <Legend wrapperStyle={{ fontSize: 9 }} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge panel */}
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-3">📖 借り換えの基礎知識</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
            {[
              { title: '借り換えが有利になる目安', body: '一般的に「金利差0.3%以上」「残期間10年以上」「残債1,000万円以上」の3条件が揃うと効果が大きいとされます。' },
              { title: '損益分岐点とは', body: '借り換えにかかった費用を、毎月の削減額で回収するまでの期間。この月数が残返済期間より短ければ借り換えにメリットがあります。' },
              { title: '変動金利リスク', body: '変動金利は半年ごとに見直され、金利上昇時は月返済額が増加します。楽天銀行のように2022年0.537%→現在1.511%と約3倍になった事例もあります。' },
              { title: '変動金利 vs 固定金利の選択', body: '変動金利は低金利時代に有利ですが金利上昇リスクがあります。固定金利は将来の返済額が確定するため計画が立てやすい反面、初期金利は高めです。' },
              { title: '住宅ローン控除への影響', body: '借り換え後も条件次第で住宅ローン控除（年末残高×0.7%）は継続できます。借り換え先が住宅ローン控除の要件（返済期間10年以上等）を満たすか確認が必要です。' },
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
