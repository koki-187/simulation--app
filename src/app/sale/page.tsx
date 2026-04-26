'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen, cagr, mult } from '@/lib/format';
import { calcSaleScenarios } from '@/lib/calc/tax';
import { balanceAtYear } from '@/lib/calc/mortgage';
import { SimResult, SimInput, SaleScenario } from '@/lib/calc/types';
import { useState } from 'react';

const HOLDING_YEARS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

interface YearRow {
  year: number;
  pessimistic: SaleScenario;
  standard:    SaleScenario;
  optimistic:  SaleScenario;
  loanBalance: number;
  cumDep:      number;
  cumCF:       number;
}

function buildYearRows(result: SimResult): YearRow[] {
  const { input, amortization, depreciation: depRows, cashFlows, initialInvestment } = result;
  const { propertyPrice, growthRate } = input;

  return HOLDING_YEARS.map(year => {
    const loanBalance = balanceAtYear(amortization, year);
    const cumDep = depRows[year - 1]?.cumDepreciation ?? 0;
    const cumCF = cashFlows[year - 1]?.cumulativeCF ?? 0;
    const scenarios = calcSaleScenarios(
      propertyPrice, growthRate, year, loanBalance, cumDep, cumCF, initialInvestment
    );
    return {
      year,
      pessimistic: scenarios[0],
      standard: scenarios[1],
      optimistic: scenarios[2],
      loanBalance,
      cumDep,
      cumCF,
    };
  });
}

type MetricKey = 'afterTaxProfit' | 'cagr' | 'investmentMultiple' | 'preTaxProfit' | 'salePrice';

const METRIC_OPTIONS: { key: MetricKey; label: string; fmt: (v: number) => string }[] = [
  { key: 'afterTaxProfit',    label: '税引後手残り',  fmt: yen  },
  { key: 'cagr',              label: 'CAGR',          fmt: cagr },
  { key: 'investmentMultiple',label: '投資倍率',      fmt: mult },
  { key: 'preTaxProfit',      label: '税引前手残り',  fmt: yen  },
  { key: 'salePrice',         label: '売却価格',      fmt: yen  },
];

function colorFor(key: MetricKey, val: number): string {
  if (key === 'investmentMultiple') return val >= 1 ? 'text-success-500' : 'text-danger-500';
  if (key === 'cagr') return val >= 0 ? 'text-success-500' : 'text-danger-500';
  return val >= 0 ? 'text-success-500' : 'text-danger-500';
}

export default function SalePage() {
  const { resultA, resultB, activePattern, inputA, inputB } = useSimStore();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('afterTaxProfit');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [showPattern, setShowPattern] = useState<'A' | 'B' | 'both'>('A');

  const rowsA = buildYearRows(resultA);
  const rowsB = buildYearRows(resultB);

  const metricFmt = METRIC_OPTIONS.find(m => m.key === selectedMetric)!.fmt;

  const highlightYear = (activePattern === 'B' ? inputB : inputA).holdingYears;

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">売却シミュレーション</h1>
          <p className="text-xs text-navy-100">5〜50年・全保有期間 × 3シナリオ一覧</p>
        </div>
        <PatternToggle />
      </div>

      <div className="p-6 space-y-6">

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Metric selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500 font-medium">表示指標:</span>
            <div className="flex rounded-lg overflow-hidden border border-neutral-200">
              {METRIC_OPTIONS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedMetric === m.key
                      ? 'bg-navy-500 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500 font-medium">物件:</span>
            <div className="flex rounded-lg overflow-hidden border border-neutral-200">
              {(['A', 'B', 'both'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setShowPattern(p)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    showPattern === p
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {p === 'both' ? 'A/B比較' : `物件${p}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main matrix table */}
        {(showPattern === 'A' || showPattern === 'B') && (
          <MatrixTable
            rows={showPattern === 'A' ? rowsA : rowsB}
            label={`物件${showPattern}`}
            input={showPattern === 'A' ? inputA : inputB}
            selectedMetric={selectedMetric}
            metricFmt={metricFmt}
            highlightYear={highlightYear}
            expandedYear={expandedYear}
            onExpandYear={setExpandedYear}
          />
        )}

        {/* Side-by-side comparison */}
        {showPattern === 'both' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MatrixTable
              rows={rowsA}
              label="物件A"
              input={inputA}
              selectedMetric={selectedMetric}
              metricFmt={metricFmt}
              highlightYear={inputA.holdingYears}
              expandedYear={expandedYear}
              onExpandYear={setExpandedYear}
              compact
            />
            <MatrixTable
              rows={rowsB}
              label="物件B"
              input={inputB}
              selectedMetric={selectedMetric}
              metricFmt={metricFmt}
              highlightYear={inputB.holdingYears}
              expandedYear={expandedYear}
              onExpandYear={setExpandedYear}
              compact
            />
          </div>
        )}

        {/* Assumptions note */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-neutral-700 space-y-1">
          <div className="font-bold text-orange-600 mb-2">前提条件</div>
          <div>• 標準売却価格 ＝ 物件価格 × (1＋成長率)^保有年数</div>
          <div>• 悲観 ＝ 標準×0.9 ／ 楽観 ＝ 標準×1.1</div>
          <div>• 売却費用 ＝ 売却価格 × 3%（仲介手数料等）</div>
          <div>• 譲渡所得税：5年超 → 長期20.315%／5年以下 → 短期39.63%</div>
          <div>• CAGR ＝ 税引後手残り＋累計CF を含む総合利回り</div>
          <div>• ★マーク行 = 入力フォームで設定した保有年数</div>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Matrix Table Component ─────────────────────────────────────────── */
interface MatrixTableProps {
  rows: YearRow[];
  label: string;
  input: SimInput;
  selectedMetric: MetricKey;
  metricFmt: (v: number) => string;
  highlightYear: number;
  expandedYear: number | null;
  onExpandYear: (y: number | null) => void;
  compact?: boolean;
}

function MatrixTable({
  rows, label, input, selectedMetric, metricFmt, highlightYear,
  expandedYear, onExpandYear, compact = false,
}: MatrixTableProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
      {/* Table header */}
      <div className="bg-navy-500 text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold text-sm">{label}（{input.propertyName}） — 全保有期間シナリオ</span>
        <span className="text-xs text-navy-100">成長率 {(input.growthRate * 100).toFixed(1)}%／年</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left font-semibold text-neutral-600 w-20">保有年数</th>
              <th className="px-3 py-2 text-right font-semibold text-red-500">
                悲観 (−10%)
              </th>
              <th className="px-3 py-2 text-right font-semibold text-navy-500">
                標準
              </th>
              <th className="px-3 py-2 text-right font-semibold text-success-500">
                楽観 (+10%)
              </th>
              {!compact && <th className="px-3 py-2 text-right font-semibold text-neutral-500">ローン残債</th>}
              {!compact && <th className="px-3 py-2 text-right font-semibold text-neutral-500">累計CF</th>}
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isHighlight = row.year === highlightYear;
              const isExpanded = expandedYear === row.year;
              return (
                <>
                  <tr
                    key={row.year}
                    onClick={() => onExpandYear(isExpanded ? null : row.year)}
                    className={`border-b border-neutral-100 cursor-pointer transition-colors ${
                      isHighlight
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : i % 2 === 0
                          ? 'bg-white hover:bg-neutral-50'
                          : 'bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <td className="px-3 py-2 font-bold text-neutral-700">
                      {isHighlight && <span className="text-orange-500 mr-1">★</span>}
                      {row.year}年
                      {row.year <= 5 && <span className="ml-1 text-[9px] text-red-400 font-normal">短期税</span>}
                    </td>
                    {(['pessimistic', 'standard', 'optimistic'] as const).map(s => {
                      const val = row[s][selectedMetric] as number;
                      return (
                        <td key={s} className={`px-3 py-2 text-right font-semibold ${colorFor(selectedMetric, val)}`}>
                          {metricFmt(val)}
                        </td>
                      );
                    })}
                    {!compact && (
                      <td className="px-3 py-2 text-right text-neutral-500">
                        {row.loanBalance > 0 ? yen(row.loanBalance) : '完済'}
                      </td>
                    )}
                    {!compact && (
                      <td className={`px-3 py-2 text-right font-medium ${row.cumCF >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                        {yen(row.cumCF)}
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-neutral-400">
                      {isExpanded ? '▲' : '▼'}
                    </td>
                  </tr>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <tr key={`detail-${row.year}`} className="bg-blue-50 border-b border-blue-100">
                      <td colSpan={compact ? 5 : 7} className="px-4 py-3">
                        <div className="grid grid-cols-3 gap-3">
                          {(['pessimistic', 'standard', 'optimistic'] as const).map((s, si) => {
                            const scenario = row[s];
                            const colors = ['bg-red-50 border-red-200', 'bg-white border-neutral-200', 'bg-green-50 border-green-200'];
                            const headerColors = ['bg-red-500', 'bg-navy-500', 'bg-success-500'];
                            return (
                              <div key={s} className={`rounded-lg border ${colors[si]} overflow-hidden`}>
                                <div className={`${headerColors[si]} text-white px-3 py-1.5 text-xs font-bold`}>
                                  {scenario.label} — {row.year}年後
                                </div>
                                <div className="p-2 space-y-1 text-xs">
                                  <DetailLine label="売却価格" value={yen(scenario.salePrice)} />
                                  <DetailLine label="ローン残債" value={yen(row.loanBalance)} negative />
                                  <DetailLine label="売却費用(3%)" value={yen(scenario.sellingCosts)} negative />
                                  <div className="border-t border-neutral-200 pt-1 mt-1">
                                    <DetailLine label="税引前手残り" value={yen(scenario.preTaxProfit)} colored val={scenario.preTaxProfit} />
                                  </div>
                                  <DetailLine label="譲渡所得税" value={yen(scenario.capitalGainsTax)} negative />
                                  <div className="border-t border-neutral-200 pt-1 mt-1">
                                    <DetailLine label="税引後手残り" value={yen(scenario.afterTaxProfit)} colored val={scenario.afterTaxProfit} bold />
                                  </div>
                                  <div className="border-t border-neutral-200 pt-1 mt-1">
                                    <DetailLine label="CAGR" value={cagr(scenario.cagr)} colored val={scenario.cagr} />
                                    <DetailLine label="投資倍率" value={mult(scenario.investmentMultiple)} colored val={scenario.investmentMultiple - 1} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailLine({
  label, value, negative, colored, val, bold,
}: {
  label: string; value: string; negative?: boolean; colored?: boolean; val?: number; bold?: boolean;
}) {
  const color = colored && val !== undefined
    ? val >= 0 ? 'text-success-500' : 'text-danger-500'
    : negative
      ? 'text-danger-500'
      : 'text-neutral-700';
  return (
    <div className="flex justify-between items-center">
      <span className="text-neutral-500">{label}</span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
