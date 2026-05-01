'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, cagr, mult } from '@/lib/format';
import { balanceAtYear } from '@/lib/calc/mortgage';
import { SimResult, SimInput, SaleScenario } from '@/lib/calc/types';
import { Fragment, useState } from 'react';

const HOLDING_YEARS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// ── 売却シナリオ計算（取得費5%ルール対応） ────────────────────────────────
interface CalcOptions {
  use5pctRule: boolean; // 取得費不明→売却価格の5%を取得費とする
}

function calcSaleRow(
  propertyPrice: number,
  growthRate: number,
  year: number,
  loanBalance: number,
  accumulatedDep: number,
  cumulativeCF: number,
  initialInvestment: number,
  opts: CalcOptions,
): { pessimistic: SaleScenario; standard: SaleScenario; optimistic: SaleScenario } {
  const baseSale = Math.max(0, Math.floor(propertyPrice * Math.pow(1 + growthRate, year)));
  const defs = [
    { label: '悲観 (−10%)', multiplier: 0.9 },
    { label: '標準',         multiplier: 1.0 },
    { label: '楽観 (+10%)',  multiplier: 1.1 },
  ] as const;

  const [pessimistic, standard, optimistic] = defs.map(s => {
    const salePrice = Math.floor(baseSale * s.multiplier);
    const sellingCosts = Math.floor(salePrice * 0.03);
    const preTaxProfit = salePrice - loanBalance - sellingCosts;

    // 取得費 — 5%ルール or 実額
    let acqCostForTax: number;
    if (opts.use5pctRule) {
      // 5%ルール: salePrice × 5% (減価償却の調整なし)
      acqCostForTax = Math.floor(salePrice * 0.05);
    } else {
      acqCostForTax = propertyPrice - accumulatedDep; // 実額 - 累計減価償却
    }

    const isLongTerm = year >= 5;
    const taxRate = isLongTerm ? 0.20315 : 0.3963;
    const taxableGain = Math.max(0, salePrice - acqCostForTax - sellingCosts);
    const capitalGainsTax = Math.floor(taxableGain * taxRate);

    const afterTaxProfit = preTaxProfit - capitalGainsTax;
    const totalReturn = afterTaxProfit + cumulativeCF;
    const cagrVal = initialInvestment > 0 && year > 0
      ? Math.pow(Math.max(0.001, totalReturn + initialInvestment) / initialInvestment, 1 / year) - 1
      : 0;
    const investmentMultiple = initialInvestment > 0
      ? (totalReturn + initialInvestment) / initialInvestment
      : 0;

    return {
      label: s.label,
      multiplier: s.multiplier,
      salePrice,
      loanBalance,
      sellingCosts,
      preTaxProfit,
      acquisitionCost: acqCostForTax,
      accumulatedDep,
      taxableGain,
      capitalGainsTax,
      afterTaxProfit,
      cagr: cagrVal,
      investmentMultiple,
      holdingYears: year,
    } satisfies SaleScenario;
  });

  return { pessimistic, standard, optimistic };
}

interface YearRow {
  year: number;
  pessimistic: SaleScenario;
  standard:    SaleScenario;
  optimistic:  SaleScenario;
  loanBalance: number;
  cumDep:      number;
  cumCF:       number;
}

function buildYearRows(result: SimResult, opts: CalcOptions): YearRow[] {
  const { input, amortization, depreciation: depRows, cashFlows, initialInvestment } = result;
  const { propertyPrice, growthRate } = input;

  return HOLDING_YEARS.map(year => {
    const loanBalance = balanceAtYear(amortization, year);
    const cumDep = depRows[year - 1]?.cumDepreciation ?? 0;
    const cumCF = cashFlows[year - 1]?.cumulativeCF ?? 0;
    const { pessimistic, standard, optimistic } = calcSaleRow(
      propertyPrice, growthRate, year, loanBalance, cumDep, cumCF, initialInvestment, opts
    );
    return { year, pessimistic, standard, optimistic, loanBalance, cumDep, cumCF };
  });
}

// ── 表示指標 ─────────────────────────────────────────────────────────────
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
  return val >= 0 ? 'text-success-500' : 'text-danger-500';
}

// ── PDF エクスポート ──────────────────────────────────────────────────────
async function exportSalePDF(
  rowsA: YearRow[],
  rowsB: YearRow[],
  inputA: SimInput,
  inputB: SimInput,
  showPattern: 'A' | 'B' | 'both',
  use5pctRule: boolean,
) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const NAVY: [number, number, number] = [28, 43, 74];
  const ORANGE: [number, number, number] = [232, 99, 42];
  const RED: [number, number, number]   = [220, 38, 38];
  const GREEN: [number, number, number] = [34, 197, 94];

  // Header
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TERASS Sale Simulation Report — All Holding Periods', 14, 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('ja-JP');
  const ruleNote = use5pctRule ? '  [Acquisition cost: 5% rule applied]' : '  [Acquisition cost: actual]';
  doc.text(`Generated: ${dateStr}${ruleNote}`, 14, 15);

  let curY = 24;

  const targets = showPattern === 'both'
    ? [{ rows: rowsA, input: inputA, label: 'A' }, { rows: rowsB, input: inputB, label: 'B' }]
    : showPattern === 'A'
      ? [{ rows: rowsA, input: inputA, label: 'A' }]
      : [{ rows: rowsB, input: inputB, label: 'B' }];

  for (const { rows, input, label } of targets) {
    // Section header
    doc.setFillColor(...ORANGE);
    doc.rect(14, curY, 4, 6, 'F');
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Property ${label}: ${input.propertyName}  (Growth rate: ${(input.growthRate * 100).toFixed(1)}%/yr)`,
      20, curY + 4.5
    );
    curY += 10;

    const head = [['Hold', 'Pessimistic −10%', '', '', 'Standard', '', '', 'Optimistic +10%', '', '']];
    const subHead = [['Years', 'After-Tax', 'CAGR', 'Multiple', 'After-Tax', 'CAGR', 'Multiple', 'After-Tax', 'CAGR', 'Multiple']];

    const body = rows.map(row => {
      const star = row.year === input.holdingYears ? '★' : '';
      const shortTax = row.year <= 5 ? '*' : '';
      return [
        `${star}${row.year}yr${shortTax}`,
        yen(row.pessimistic.afterTaxProfit),
        cagr(row.pessimistic.cagr),
        mult(row.pessimistic.investmentMultiple),
        yen(row.standard.afterTaxProfit),
        cagr(row.standard.cagr),
        mult(row.standard.investmentMultiple),
        yen(row.optimistic.afterTaxProfit),
        cagr(row.optimistic.cagr),
        mult(row.optimistic.investmentMultiple),
      ];
    });

    autoTable(doc, {
      startY: curY,
      head: [...head, ...subHead],
      body,
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 7, halign: 'right' },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        1: { textColor: RED },
        2: { textColor: RED },
        3: { textColor: RED },
        7: { textColor: GREEN },
        8: { textColor: GREEN },
        9: { textColor: GREEN },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didDrawCell: (data: any) => {
        // Bold star rows
        if (data.section === 'body' && data.column.index === 0) {
          const raw = data.cell.raw as string;
          if (raw.startsWith('★')) {
            doc.setFont('helvetica', 'bold');
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curY = (doc as any).lastAutoTable.finalY + 8;

    if (curY > 170) {
      doc.addPage();
      curY = 14;
    }
  }

  // Notes
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const notes = [
    '* Short-term (≤5yr) tax rate: 39.63% / Long-term (>5yr): 20.315%',
    '★ = Input form holding period  |  Standard sale price = property price × (1+growth)^years',
    use5pctRule
      ? 'Acquisition cost: 5% rule applied (for cases where original purchase cost is unknown)'
      : 'Acquisition cost: Actual purchase price minus accumulated depreciation',
    'TERASS 売却シミュレーター — 本資料は試算値です。税務・法律事項は専門家にご相談ください。',
  ];
  const noteY = doc.internal.pageSize.getHeight() - 14;
  notes.forEach((n, i) => doc.text(n, 14, noteY + i * 4));

  doc.save(`TERASS_売却シミュレーション_${dateStr.replace(/\//g, '')}.pdf`);
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SalePage() {
  const { resultA, resultB, inputA, inputB } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, inputA: s.inputA, inputB: s.inputB }))
  );
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('afterTaxProfit');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [showPattern, setShowPattern] = useState<'A' | 'B' | 'both'>('A');
  const [use5pctRule, setUse5pctRule] = useState(false);
  const [exporting, setExporting] = useState(false);

  const opts: CalcOptions = { use5pctRule };
  const rowsA = buildYearRows(resultA, opts);
  const rowsB = buildYearRows(resultB, opts);

  const metricFmt = METRIC_OPTIONS.find(m => m.key === selectedMetric)!.fmt;
  const highlightYearA = inputA.holdingYears;
  const highlightYearB = inputB.holdingYears;

  async function handleExport() {
    setExporting(true);
    try {
      await exportSalePDF(rowsA, rowsB, inputA, inputB, showPattern, use5pctRule);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">売却シミュレーション</h1>
          <p className="text-xs text-navy-100">5〜50年・全保有期間 × 3シナリオ一覧</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {exporting ? '⏳' : '📄'} PDF出力
          </button>
          <PatternToggle />
        </div>
      </div>

      <div className="p-6 space-y-4">

        {/* ── 中古物件 注意事項 ──────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-neutral-700 space-y-2">
          <div className="font-bold text-blue-700 mb-1">📋 中古物件・取得費に関するご注意</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-semibold text-neutral-700 mb-1">収益用不動産（投資物件）の場合</div>
              <ul className="space-y-0.5 text-neutral-600">
                <li>• 住宅取得控除（ローン控除）は<b>適用不可</b>（居住用のみ）</li>
                <li>• 3,000万円特別控除も<b>適用不可</b>（居住用のみ）</li>
                <li>• 取得費は「購入価格 − 累計減価償却」で計算</li>
                <li>• 中古の場合：減価償却年数を入力フォームで設定（構造・設備）</li>
                <li>• 取得費の証明ができない場合は「5%ルール」が選択可</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-neutral-700 mb-1">取得費 5%ルールとは？</div>
              <ul className="space-y-0.5 text-neutral-600">
                <li>• 購入当時の契約書等が紛失した場合に選択可能</li>
                <li>• 取得費 ＝ 売却価格 × 5%（概算取得費）</li>
                <li>• 実際の取得費が売却価格の5%未満の場合にも有効</li>
                <li>• 5%ルール適用時は減価償却の調整不要</li>
                <li className="text-orange-600 font-medium">• ※税務・法律の詳細は税理士にご相談ください</li>
              </ul>
            </div>
          </div>
          {/* 5%ルール toggle */}
          <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setUse5pctRule(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${use5pctRule ? 'bg-orange-500' : 'bg-neutral-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${use5pctRule ? 'translate-x-5' : ''}`} />
              </div>
              <span className={`font-semibold ${use5pctRule ? 'text-orange-600' : 'text-neutral-500'}`}>
                取得費 5%ルールを適用 {use5pctRule ? '（ON — 売却価格×5%を取得費として計算）' : '（OFF — 実際の取得費で計算）'}
              </span>
            </label>
          </div>
        </div>

        {/* ── Controls ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Metric selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500 font-medium text-xs">表示指標:</span>
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
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium text-xs">物件:</span>
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

        {/* ── Matrix Tables ──────────────────────────────────────────── */}
        {(showPattern === 'A' || showPattern === 'B') && (
          <MatrixTable
            rows={showPattern === 'A' ? rowsA : rowsB}
            label={`物件${showPattern}`}
            input={showPattern === 'A' ? inputA : inputB}
            selectedMetric={selectedMetric}
            metricFmt={metricFmt}
            highlightYear={showPattern === 'A' ? highlightYearA : highlightYearB}
            expandedYear={expandedYear}
            onExpandYear={setExpandedYear}
            use5pctRule={use5pctRule}
          />
        )}

        {showPattern === 'both' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MatrixTable
              rows={rowsA}
              label="物件A"
              input={inputA}
              selectedMetric={selectedMetric}
              metricFmt={metricFmt}
              highlightYear={highlightYearA}
              expandedYear={expandedYear}
              onExpandYear={setExpandedYear}
              use5pctRule={use5pctRule}
              compact
            />
            <MatrixTable
              rows={rowsB}
              label="物件B"
              input={inputB}
              selectedMetric={selectedMetric}
              metricFmt={metricFmt}
              highlightYear={highlightYearB}
              expandedYear={expandedYear}
              onExpandYear={setExpandedYear}
              use5pctRule={use5pctRule}
              compact
            />
          </div>
        )}

        {/* ── Assumptions ───────────────────────────────────────────── */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-neutral-700 space-y-1">
          <div className="font-bold text-orange-600 mb-2">前提条件</div>
          <div>• 標準売却価格 ＝ 物件価格 × (1＋成長率)^保有年数 ／ 悲観×0.9 ／ 楽観×1.1</div>
          <div>• 売却費用 ＝ 売却価格 × 3%（仲介手数料等）</div>
          <div>• 譲渡所得税：5年超 → 長期20.315% ／ 5年以下 → 短期39.63%（「短期税」バッジ表示）</div>
          <div>• 取得費：{use5pctRule ? '売却価格×5%（概算取得費）' : '購入価格 − 累計減価償却（実額）'}</div>
          <div>• CAGR ＝（税引後手残り＋累計CF＋初期投資）^(1/n) / 初期投資 − 1</div>
          <div>• ★マーク行 ＝ 入力フォームで設定した保有年数</div>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Matrix Table Component ──────────────────────────────────────────────── */
interface MatrixTableProps {
  rows: YearRow[];
  label: string;
  input: SimInput;
  selectedMetric: MetricKey;
  metricFmt: (v: number) => string;
  highlightYear: number;
  expandedYear: number | null;
  onExpandYear: (y: number | null) => void;
  use5pctRule: boolean;
  compact?: boolean;
}

function MatrixTable({
  rows, label, input, selectedMetric, metricFmt, highlightYear,
  expandedYear, onExpandYear, use5pctRule, compact = false,
}: MatrixTableProps) {
  const colSpanTotal = compact ? 5 : 7;
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
      <div className="bg-navy-500 text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold text-sm">{label}（{input.propertyName}） — 全保有期間シナリオ</span>
        <span className="text-xs text-navy-100">成長率 {(input.growthRate * 100).toFixed(1)}%／年</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left font-semibold text-neutral-600 w-20">保有年数</th>
              <th className="px-3 py-2 text-right font-semibold text-red-500">悲観 (−10%)</th>
              <th className="px-3 py-2 text-right font-semibold text-navy-500">標準</th>
              <th className="px-3 py-2 text-right font-semibold text-success-500">楽観 (+10%)</th>
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
                <Fragment key={row.year}>
                  <tr
                    onClick={() => onExpandYear(isExpanded ? null : row.year)}
                    className={`border-b border-neutral-100 cursor-pointer transition-colors ${
                      isHighlight
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : i % 2 === 0
                          ? 'bg-white hover:bg-neutral-50'
                          : 'bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <td className="px-3 py-2 font-bold text-neutral-700 whitespace-nowrap">
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
                    <tr>
                      <td colSpan={colSpanTotal} className="bg-blue-50 border-b border-blue-100 px-4 py-3">
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
                                  <DetailLine
                                    label={use5pctRule ? `取得費(5%=売価×5%)` : `取得費(実額-減価償却)`}
                                    value={yen(scenario.acquisitionCost)}
                                  />
                                  <DetailLine label="譲渡所得" value={yen(scenario.taxableGain)} />
                                  <DetailLine label={`譲渡所得税(${row.year >= 5 ? '長期20.3%' : '短期39.6%'})`} value={yen(scenario.capitalGainsTax)} negative />
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
                </Fragment>
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
    <div className="flex justify-between items-center gap-2">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-medium'} text-right`}>{value}</span>
    </div>
  );
}
