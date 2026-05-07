'use client';

import { memo, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { useHomeLoanStore, type PrepayEvent } from '@/store/homeLoanStore';
import { useShallow } from 'zustand/react/shallow';
import { yen } from '@/lib/format';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Formatting helpers ────────────────────────────────────────────────────────
// yen → @/lib/format からimport済み
const man = (n: number) => Math.round(n / 10000).toLocaleString('ja-JP') + '万円';
const pct = (n: number) => n.toFixed(1) + '%'; // 既にパーセント値の数値を受け取る（例: 25.3 → "25.3%"）

// ── Types ─────────────────────────────────────────────────────────────────────
type RateType = '変動' | '固定';

// ── Calculation helpers ───────────────────────────────────────────────────────
function calcPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function suggestTaxRate(income: number): number {
  if (income <= 195) return 5;
  if (income <= 330) return 10;
  if (income <= 695) return 20;
  if (income <= 900) return 23;
  if (income <= 1800) return 33;
  if (income <= 4000) return 40;
  return 45;
}

function calcDeduction(yearEndBalance: number, isNew: boolean): number {
  const raw = yearEndBalance * 0.007;
  const cap = isNew ? 210000 : 140000;
  return Math.min(raw, cap);
}

interface AmortRow {
  month: number;
  balance: number;
  payment: number;
  interest: number;
  principal: number;
  prepayment: number;
}

interface AmortResult {
  rows: AmortRow[];
  totalPayment: number;
  totalInterest: number;
  finalMonth: number;
}

function buildSchedule(
  loanAmountMan: number,
  annualRatePct: number,
  termYears: number,
  events: PrepayEvent[],
): AmortResult {
  const loan = loanAmountMan * 10000;
  const r = annualRatePct / 100 / 12;
  const totalMonths = termYears * 12;
  const sorted = [...events].sort((a, b) => a.yearAfter - b.yearAfter);

  // Pre-compute Map for O(1) event lookup per month
  const eventsByMonth = new Map<number, PrepayEvent[]>();
  for (const ev of sorted) {
    const key = ev.yearAfter * 12;
    if (!eventsByMonth.has(key)) eventsByMonth.set(key, []);
    eventsByMonth.get(key)!.push(ev);
  }

  let balance = loan;
  let payment = calcPayment(loan, annualRatePct, totalMonths);
  let effectiveEnd = totalMonths;

  const rows: AmortRow[] = [];
  let totalPayment = 0;
  let totalInterest = 0;

  for (let m = 1; m <= effectiveEnd; m++) {
    if (balance <= 0) break;

    const interest = balance * r;
    const principal = Math.min(payment - interest, balance);
    const actualPayment = interest + principal;
    balance -= principal;

    let prepaymentAmount = 0;
    const eventsAtMonth = eventsByMonth.get(m) ?? [];
    if (eventsAtMonth.length > 0 && balance > 0) {
      for (const ev of eventsAtMonth) {
        if (balance <= 0) break;
        const prepAmt = Math.min(ev.amount * 10000, balance);
        prepaymentAmount += prepAmt;
        balance -= prepAmt;

        if (balance > 0) {
          if (ev.type === '期間短縮型') {
            let newRemaining: number;
            if (r === 0) {
              newRemaining = Math.ceil(balance / payment);
            } else {
              const ratio = (r * balance) / payment;
              if (ratio >= 1) {
                newRemaining = effectiveEnd - m;
              } else {
                newRemaining = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
              }
            }
            effectiveEnd = m + newRemaining;
          } else {
            const remaining = Math.max(1, effectiveEnd - m);
            payment = calcPayment(balance, annualRatePct, remaining);
          }
        }
      }
    }

    rows.push({
      month: m,
      balance: Math.max(0, balance),
      payment: actualPayment,
      interest,
      principal,
      prepayment: prepaymentAmount,
    });

    totalPayment += actualPayment + prepaymentAmount;
    totalInterest += interest;

    if (balance <= 0.5) break;
  }

  return {
    rows,
    totalPayment,
    totalInterest,
    finalMonth: rows.length > 0 ? rows[rows.length - 1].month : totalMonths,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

const NumberInput = memo(function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-700">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="input-cell flex-1"
        />
        {unit && <span className="text-xs text-neutral-500 shrink-0">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
});

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-xl font-extrabold leading-tight ${valueColor ?? 'text-navy-500'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomeSimPage() {
  // Store state
  const {
    propertyName,
    propertyPrice,
    equity,
    expenses,
    rateType,
    annualRate,
    termYears,
    annualIncome,
    taxRate,
    deductionEnabled,
    isNew,
    entryYear,
    mgmtFee,
    showExtras,
    events,
    setStore,
    reset,
  } = useHomeLoanStore(
    useShallow(s => ({
      propertyName: s.propertyName,
      propertyPrice: s.propertyPrice,
      equity: s.equity,
      expenses: s.expenses,
      rateType: s.rateType,
      annualRate: s.annualRate,
      termYears: s.termYears,
      annualIncome: s.annualIncome,
      taxRate: s.taxRate,
      deductionEnabled: s.deductionEnabled,
      isNew: s.isNew,
      entryYear: s.entryYear,
      mgmtFee: s.mgmtFee,
      showExtras: s.showExtras,
      events: s.events,
      setStore: s.set,
      reset: s.reset,
    }))
  );

  // showExtras from store drives the misc costs toggle
  const showMiscCosts = showExtras;
  const setShowMiscCosts = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(showExtras) : v;
    setStore({ showExtras: next });
  };

  // Derived
  const loanAmount = propertyPrice + expenses - equity; // 万円 (can be negative)
  const isLoanNegative = loanAmount <= 0;

  // Handle rate type switch
  const handleRateTypeSwitch = (t: RateType) => {
    setStore({ rateType: t, annualRate: t === '変動' ? 0.5 : 1.5 });
  };

  // Auto-suggest tax rate
  const suggestedTaxRate = suggestTaxRate(annualIncome);

  // Main simulation
  const result = useMemo(() => {
    if (loanAmount <= 0) return { rows: [], totalPayment: 0, totalInterest: 0, finalMonth: 0 };
    return buildSchedule(loanAmount, annualRate, termYears, events);
  }, [loanAmount, annualRate, termYears, events]);

  const baseResult = useMemo(() => {
    if (loanAmount <= 0) return { rows: [], totalPayment: 0, totalInterest: 0, finalMonth: 0 };
    return buildSchedule(loanAmount, annualRate, termYears, []);
  }, [loanAmount, annualRate, termYears]);

  const monthlyPayment = result.rows[0]?.payment ?? 0;
  const totalPayment = result.totalPayment;
  const totalInterest = result.totalInterest;
  const annualPayment = monthlyPayment * 12;
  const repaymentRatio = annualIncome > 0 ? (annualPayment / (annualIncome * 10000)) * 100 : 0;

  const repaymentRatioColor =
    repaymentRatio <= 25
      ? 'text-success-500'
      : repaymentRatio <= 35
        ? 'text-warn-500'
        : 'text-danger-500';

  // 住宅ローン控除シミュレーション
  const deductionRows = useMemo(() => {
    if (!deductionEnabled) return [];
    const loanPrincipal = loanAmount * 10000;
    const r = annualRate / 100 / 12;
    const totalMonths = termYears * 12;

    const rows = [];
    let totalDeduction = 0;

    for (let year = 1; year <= 13; year++) {
      const monthIdx = year * 12 - 1;
      if (monthIdx >= totalMonths) break;

      // year-end balance from base schedule (no prepayment)
      const row = baseResult.rows[monthIdx];
      const yearEndBalance = row ? row.balance : 0;

      const deduction = yearEndBalance > 0 ? calcDeduction(yearEndBalance, isNew) : 0;
      const annualRepayment = monthlyPayment * 12;
      const effectiveRepayment = annualRepayment - deduction;

      totalDeduction += deduction;

      rows.push({
        year,
        yearEndBalance: Math.round(yearEndBalance / 10000),
        deductionRate: 0.7,
        deduction: Math.round(deduction),
        effectiveRepayment: Math.round(effectiveRepayment),
        effectiveAnnual: Math.round(effectiveRepayment),
      });
    }

    return { rows, totalDeduction: Math.round(totalDeduction), loanPrincipal };
  }, [
    deductionEnabled,
    loanAmount,
    annualRate,
    termYears,
    baseResult,
    isNew,
    monthlyPayment,
  ]);

  // deductionTable alias for PDF export
  const deductionTable = typeof deductionRows !== 'undefined' && 'rows' in deductionRows
    ? deductionRows.rows
    : [];

  // 金利上昇リスク
  const rateScenarios = useMemo(() => {
    const baseRate = annualRate;
    const scenarios = [0, 0.5, 1.0, 1.5, 2.0];
    return scenarios.map(delta => {
      const rate = baseRate + delta;
      const mp = calcPayment(loanAmount * 10000, rate, termYears * 12);
      const tp = mp * termYears * 12;
      const ti = tp - loanAmount * 10000;
      const ratio = annualIncome > 0 ? ((mp * 12) / (annualIncome * 10000)) * 100 : 0;
      return { rate, delta, mp, tp, ti, ratio };
    });
  }, [loanAmount, annualRate, termYears, annualIncome]);

  // Area chart data
  const chartData = useMemo(() => {
    const points = [1, 5, 10, 15, 20, 25, 30, 35].filter(y => y <= termYears);
    if (!points.includes(termYears)) points.push(termYears);

    // Pre-compute cumulative interest once — O(n) instead of O(n*p)
    const cumInterest: number[] = [];
    let running = 0;
    for (const r of baseResult.rows) {
      running += r.interest;
      cumInterest.push(running);
    }

    return points.map(year => {
      const monthIdx = year * 12 - 1;
      const row = baseResult.rows[Math.min(monthIdx, baseResult.rows.length - 1)];
      const cumulativeInterest = cumInterest[monthIdx] ?? 0;
      return {
        year,
        残高: Math.round((row?.balance ?? 0) / 10000),
        累計利息: Math.round(cumulativeInterest / 10000),
      };
    });
  }, [baseResult, termYears]);

  // 繰上げ返済効果
  const prepayEffect = useMemo(() => {
    if (events.length === 0) return null;
    const baseMonths = baseResult.finalMonth;
    const prepMonths = result.finalMonth;
    const savedMonths = baseMonths - prepMonths;
    const interestSaved = baseResult.totalInterest - result.totalInterest;

    const maxYear = Math.ceil(baseMonths / 12);
    const prepChartData = Array.from({ length: maxYear + 1 }, (_, i) => {
      const year = i;
      if (year === 0) return { year, 繰上げなし: loanAmount, 繰上げあり: loanAmount };
      const monthIdx = year * 12 - 1;
      const baseRow = baseResult.rows[Math.min(monthIdx, baseResult.rows.length - 1)];
      const prepRow = result.rows[monthIdx] ?? null;
      return {
        year,
        繰上げなし: Math.round((baseRow?.balance ?? 0) / 10000),
        繰上げあり: prepRow !== null ? Math.round(prepRow.balance / 10000) : null,
      };
    });

    return {
      savedYears: Math.floor(Math.abs(savedMonths) / 12),
      savedMonths: Math.abs(savedMonths) % 12,
      interestSaved,
      chartData: prepChartData,
    };
  }, [events, baseResult, result, loanAmount]);

  // 月次支出
  const mgmtFeeMonthly = mgmtFee * 10000;
  const insuranceMonthly = showMiscCosts ? Math.round((propertyPrice * 10000 * 0.0003) / 12) : 0;
  const propertyTaxMonthly = showMiscCosts
    ? Math.round((propertyPrice * 10000 * 0.014 * 0.7) / 12)
    : 0;
  const totalHousingCost =
    monthlyPayment + mgmtFeeMonthly + insuranceMonthly + propertyTaxMonthly;

  // Prepayment event helpers
  const addEvent = () => {
    if (events.length >= 3) return;
    const newEvent: PrepayEvent = {
      id: String(Date.now()),
      yearAfter: 5,
      amount: 100,
      type: '期間短縮型',
    };
    setStore({ events: [...events, newEvent] });
  };
  const removeEvent = (id: string) =>
    setStore({ events: events.filter(e => e.id !== id) });
  const updateEvent = (id: string, patch: Partial<PrepayEvent>) =>
    setStore({ events: events.map(e => (e.id === id ? { ...e, ...patch } : e)) });

  // Next month label
  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  })();

  // PDF export
  async function exportHomeLoanPDF() {
    const { elementToPdf } = await import('@/lib/pdf/jpdf');

    const today = new Date().toLocaleDateString('ja-JP');
    const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');

    const overviewRows = [
      ['物件価格', fmt(propertyPrice * 10000)],
      ['自己資金', fmt(equity * 10000)],
      ['諸費用', fmt(expenses * 10000)],
      ['借入金額', fmt(loanAmount * 10000)],
      ['金利タイプ', rateType + '金利'],
      ['適用金利', `${annualRate}%`],
      ['借入期間', `${termYears}年`],
      ['月々返済額', fmt(result.rows[0]?.payment ?? 0)],
      ['総返済額', fmt(result.totalPayment)],
      ['総利息', fmt(result.totalInterest)],
      ['返済比率', `${repaymentRatio.toFixed(1)}%`],
    ].map(([label, value], i) => `
      <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
        <td style="padding:4px 10px;border:1px solid #E5E7EB;font-weight:500;color:#374151;">${label}</td>
        <td style="padding:4px 10px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${value}</td>
      </tr>
    `).join('');

    const deductionSection = deductionEnabled && deductionTable.length > 0 ? `
      <div style="margin-top:20px;">
        <div style="background:#E8632A;color:white;padding:6px 12px;border-radius:4px;margin-bottom:8px;font-size:12px;font-weight:bold;">
          住宅ローン控除（13年間）
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead>
            <tr style="background:#1C2B4A;color:white;">
              <th style="padding:4px 8px;border:1px solid #374151;text-align:center;">年目</th>
              <th style="padding:4px 8px;border:1px solid #374151;text-align:right;">年末残高</th>
              <th style="padding:4px 8px;border:1px solid #374151;text-align:center;">控除率</th>
              <th style="padding:4px 8px;border:1px solid #374151;text-align:right;">控除額</th>
              <th style="padding:4px 8px;border:1px solid #374151;text-align:right;">実質年間返済</th>
            </tr>
          </thead>
          <tbody>
            ${deductionTable.map((r, i) => `
              <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
                <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:center;font-weight:bold;">${r.year}年目</td>
                <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.yearEndBalance * 10000)}</td>
                <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:center;">0.7%</td>
                <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#16A34A;font-weight:600;">${fmt(r.deduction)}</td>
                <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.effectiveAnnual)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const html = `
      <div style="padding:20px;">
        <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
          <div style="font-size:16px;font-weight:bold;">住宅ローンシミュレーションレポート</div>
          <div style="font-size:11px;margin-top:4px;opacity:0.8;">
            ${propertyName ? `物件: ${propertyName} ／ ` : ''}作成日: ${today}
          </div>
        </div>
        <div style="margin-bottom:12px;font-size:13px;font-weight:bold;color:#1C2B4A;border-left:4px solid #E8632A;padding-left:8px;">
          物件・ローン概要
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <tbody>${overviewRows}</tbody>
        </table>
        ${deductionSection}
        <div style="margin-top:16px;font-size:9px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:8px;">
          ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
        </div>
      </div>
    `;

    const nameSlug = propertyName ? `_${propertyName}` : '';
    await elementToPdf({
      html,
      filename: `MAS_住宅ローン${nameSlug}_${today.replace(/\//g, '')}.pdf`,
      orientation: 'portrait',
    });
  }

  return (
    <AppShell>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-navy-500 text-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">
              🏠 住宅ローンシミュレーター
            </h1>
            <p className="text-xs text-navy-100 mt-0.5">
              {propertyName ? propertyName : 'マイホーム購入の月々返済・控除・金利リスクを総合分析'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <button
              onClick={exportHomeLoanPDF}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              📄 PDF出力
            </button>
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
              住宅ローン専用
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="p-5 max-w-screen-xl mx-auto lg:grid lg:grid-cols-[380px_1fr] gap-5">

        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — Input Form
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Reset button */}
          <div className="flex justify-end">
            <button
              onClick={() => reset()}
              className="text-xs text-neutral-400 hover:text-danger-500 border border-neutral-200 hover:border-danger-300 px-3 py-1 rounded-lg transition-colors"
            >
              リセット
            </button>
          </div>

          {/* Section 1: 物件情報 */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-4">
            <SectionLabel>物件情報</SectionLabel>

            {/* 物件名 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">物件名</label>
              <input
                type="text"
                value={propertyName}
                onChange={e => setStore({ propertyName: e.target.value })}
                placeholder="例：パークホームズ新宿"
                className="input-cell text-left"
              />
            </div>

            <NumberInput
              label="物件価格"
              value={propertyPrice}
              onChange={v => setStore({ propertyPrice: v })}
              min={500}
              max={30000}
              step={100}
              unit="万円"
            />
            <NumberInput
              label="自己資金"
              value={equity}
              onChange={v => setStore({ equity: v })}
              min={0}
              max={10000}
              step={50}
              unit="万円"
            />
            <NumberInput
              label="諸費用"
              value={expenses}
              onChange={v => setStore({ expenses: v })}
              min={0}
              max={1000}
              step={10}
              unit="万円"
              hint={`物件価格の概算: ${Math.round(propertyPrice * 0.03)}万円 (3%)`}
            />

            {isLoanNegative ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span className="text-xs font-semibold text-red-600">
                    自己資金が借入必要額を超えています
                  </span>
                </div>
                <p className="text-xs text-red-400 mt-0.5">
                  物件価格 + 諸費用 − 自己資金
                </p>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-neutral-500">借入金額（自動計算）</span>
                  <span className="text-base font-extrabold text-navy-500">
                    {loanAmount.toLocaleString('ja-JP')}万円
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  物件価格 + 諸費用 − 自己資金
                </p>
              </div>
            )}
          </div>

          {/* Section 2: ローン条件 */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-4">
            <SectionLabel>ローン条件</SectionLabel>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">金利タイプ</label>
              <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                {(['変動', '固定'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleRateTypeSwitch(t)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-colors ${
                      rateType === t
                        ? 'bg-white text-navy-500 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {t}金利
                  </button>
                ))}
              </div>
            </div>

            <NumberInput
              label={`適用金利 (${rateType})`}
              value={annualRate}
              onChange={v => setStore({ annualRate: v })}
              min={0.1}
              max={8.0}
              step={0.05}
              unit="%"
            />
            <NumberInput
              label="借入期間"
              value={termYears}
              onChange={v => setStore({ termYears: v })}
              min={5}
              max={50}
              step={1}
              unit="年"
            />

            <div className="flex justify-between text-xs pt-1 border-t border-neutral-100">
              <span className="text-neutral-500">返済開始</span>
              <span className="font-semibold text-navy-500">{nextMonth}〜</span>
            </div>
          </div>

          {/* Section 3: 年収・税情報 */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-4">
            <SectionLabel>年収・税情報（控除計算用）</SectionLabel>

            <NumberInput
              label="年収"
              value={annualIncome}
              onChange={v => {
                setStore({ annualIncome: v, taxRate: suggestTaxRate(v) });
              }}
              min={100}
              max={5000}
              step={50}
              unit="万円"
            />
            <NumberInput
              label="所得税率"
              value={taxRate}
              onChange={v => setStore({ taxRate: v })}
              min={5}
              max={45}
              step={1}
              unit="%"
              hint={`年収${annualIncome}万円の場合 概算税率: ${suggestedTaxRate}%`}
            />

            <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700">住宅ローン控除適用</label>
                <button
                  onClick={() => setStore({ deductionEnabled: !deductionEnabled })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    deductionEnabled ? 'bg-orange-500' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      deductionEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {deductionEnabled && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-neutral-700">物件種別</label>
                    <div className="flex gap-1">
                      {([true, false] as const).map(v => (
                        <button
                          key={v ? 'new' : 'old'}
                          onClick={() => setStore({ isNew: v })}
                          className={`flex-1 text-xs py-1.5 rounded-md border font-medium transition-colors ${
                            isNew === v
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-400'
                          }`}
                        >
                          {v ? '新築' : '中古'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400">
                      {isNew ? '上限 21万円/年 (3,000万円×0.7%)' : '上限 14万円/年 (2,000万円×0.7%)'}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">入居予定年</span>
                    <span className="font-semibold text-navy-500">{entryYear}年</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: 繰上げ返済 */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
            <SectionLabel>繰上げ返済プラン（任意・最大3件）</SectionLabel>

            {events.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-1">
                繰上げ返済イベントなし
              </p>
            )}

            {events.map((ev, idx) => (
              <div
                key={ev.id}
                className="border border-neutral-100 rounded-lg p-3 space-y-2 bg-neutral-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-navy-500">イベント {idx + 1}</span>
                  <button
                    onClick={() => removeEvent(ev.id)}
                    className="text-neutral-400 hover:text-danger-500 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">実施時期</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={ev.yearAfter}
                      min={1}
                      max={termYears - 1}
                      step={1}
                      onChange={e => updateEvent(ev.id, { yearAfter: Number(e.target.value) })}
                      className="input-cell flex-1"
                    />
                    <span className="text-xs text-neutral-500 shrink-0">年後</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">繰上げ金額</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={ev.amount}
                      min={10}
                      max={loanAmount}
                      step={10}
                      onChange={e => updateEvent(ev.id, { amount: Number(e.target.value) })}
                      className="input-cell flex-1"
                    />
                    <span className="text-xs text-neutral-500 shrink-0">万円</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">方式</label>
                  <div className="flex gap-1">
                    {(['期間短縮型', '返済額軽減型'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateEvent(ev.id, { type: t })}
                        className={`flex-1 text-xs py-1.5 rounded-md border font-medium transition-colors ${
                          ev.type === t
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {events.length < 3 && (
              <button
                onClick={addEvent}
                className="w-full text-xs py-2.5 rounded-lg border-2 border-dashed border-orange-300 text-orange-500 hover:bg-orange-50 font-semibold transition-colors"
              >
                + 繰上げ返済を追加
              </button>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">
                入力値が変わると自動的に再計算されます
              </p>
              <p className="text-lg font-extrabold text-orange-500">
                月々返済: {yen(monthlyPayment)}
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL — Results
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 mt-4 lg:mt-0">

          {/* Row 1: KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="月々返済額"
              value={yen(monthlyPayment) + '/月'}
              valueColor="text-orange-500"
            />
            <KpiCard
              label="総返済額"
              value={man(totalPayment)}
              sub={yen(totalPayment)}
            />
            <KpiCard
              label="総利息"
              value={man(totalInterest)}
              valueColor="text-danger-500"
            />
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-xs text-neutral-500 mb-1">返済比率</p>
              <p className={`text-xl font-extrabold leading-tight ${repaymentRatioColor}`}>
                {pct(repaymentRatio)}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {repaymentRatio <= 25 ? '安全圏' : repaymentRatio <= 35 ? '注意' : '要注意'}
              </p>
            </div>
          </div>

          {/* Row 2: 住宅ローン控除 */}
          {deductionEnabled && typeof deductionRows !== 'undefined' && 'rows' in deductionRows && (
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-sm font-bold text-navy-500 mb-3">
                🏦 住宅ローン控除（13年間）
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs min-w-[560px]">
                  <thead>
                    <tr>
                      {['年目', '年末残高（万円）', '控除率', '控除額', '実質返済額'].map(h => (
                        <th key={h} className="table-header whitespace-nowrap text-right first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deductionRows.rows.map((row, i) => (
                      <tr key={row.year} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                        <td className="px-3 py-2 font-bold text-navy-500">{row.year}年目</td>
                        <td className="px-3 py-2 text-right text-neutral-700">
                          {row.yearEndBalance.toLocaleString('ja-JP')}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-700">0.7%</td>
                        <td className="px-3 py-2 text-right text-success-500 font-semibold">
                          {yen(row.deduction)}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-700">
                          {yen(row.effectiveRepayment)}/年
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-navy-50 border-t-2 border-navy-100">
                      <td className="px-3 py-2 font-bold text-navy-500" colSpan={3}>
                        合計
                      </td>
                      <td className="px-3 py-2 text-right text-success-500 font-extrabold">
                        {yen(deductionRows.totalDeduction)}
                      </td>
                      <td className="px-3 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-success-50 border border-success-500 rounded-lg p-3 text-center">
                  <p className="text-xs text-success-500 font-semibold mb-1">13年間 控除総額</p>
                  <p className="text-base font-extrabold text-success-500">
                    {man(deductionRows.totalDeduction)}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-orange-600 font-semibold mb-1">控除後 実質月々返済</p>
                  <p className="text-base font-extrabold text-orange-500">
                    {yen(monthlyPayment - deductionRows.totalDeduction / (13 * 12))}/月
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Row 3: 金利上昇リスク (変動のみ) */}
          {rateType === '変動' && (
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-sm font-bold text-navy-500 mb-2">
                📈 金利上昇リスク（変動金利シナリオ）
              </p>

              <div className="bg-warn-50 border border-warn-500 rounded-lg p-3 mb-3">
                <p className="text-xs text-warn-500">
                  変動金利は将来の金利変動リスクがあります。返済比率が35%を超えると資金計画に影響が出る可能性があります。
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr>
                      {['金利', '月々返済額', '総返済額', '総利息', '返済比率'].map(h => (
                        <th key={h} className="table-header whitespace-nowrap text-right first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rateScenarios.map((s, i) => {
                      const isBase = i === 0;
                      const ratioDanger = s.ratio > 35;
                      const ratioWarn = !ratioDanger && s.ratio > 25;
                      return (
                        <tr
                          key={s.rate}
                          className={
                            isBase
                              ? 'bg-white'
                              : ratioDanger
                                ? 'bg-danger-50'
                                : ratioWarn
                                  ? 'bg-warn-50'
                                  : 'bg-neutral-50'
                          }
                        >
                          <td className={`px-3 py-2 font-bold ${isBase ? 'text-navy-500' : 'text-orange-500'}`}>
                            {isBase ? `現在 ${s.rate}%` : `+${s.delta}% → ${s.rate}%`}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${isBase ? 'text-navy-500' : 'text-orange-500'}`}>
                            {yen(s.mp)}/月
                          </td>
                          <td className="px-3 py-2 text-right text-neutral-700">
                            {man(s.tp)}
                          </td>
                          <td className="px-3 py-2 text-right text-neutral-700">
                            {man(s.ti)}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${ratioDanger ? 'text-danger-500' : ratioWarn ? 'text-warn-500' : 'text-success-500'}`}>
                            {pct(s.ratio)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Row 4: 返済内訳グラフ */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 overflow-hidden">
            <p className="text-sm font-bold text-navy-500 mb-3">返済内訳グラフ（元金残高 vs 累計利息）</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                <XAxis
                  dataKey="year"
                  tickFormatter={v => `${v}年`}
                  tick={{ fontSize: 11, fill: '#667085' }}
                />
                <YAxis
                  tickFormatter={v => `${v}万`}
                  tick={{ fontSize: 11, fill: '#667085' }}
                  width={52}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString('ja-JP')}万円`,
                    name,
                  ]}
                  labelFormatter={label => `${label}年経過`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="残高"
                  stackId="1"
                  stroke="#1C2B4A"
                  fill="#D3DAE8"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="累計利息"
                  stackId="1"
                  stroke="#E8632A"
                  fill="#FDE0D1"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Row 5: 繰上げ返済効果 */}
          {prepayEffect && (
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 overflow-hidden">
              <p className="text-sm font-bold text-navy-500 mb-3">⏩ 繰上げ返済効果</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-success-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-neutral-500 mb-1">短縮期間</p>
                  <p className="text-base font-extrabold text-success-500">
                    {prepayEffect.savedYears > 0 ? `${prepayEffect.savedYears}年` : ''}
                    {prepayEffect.savedMonths > 0 ? `${prepayEffect.savedMonths}ヶ月` : ''}
                    {prepayEffect.savedYears === 0 && prepayEffect.savedMonths === 0 ? '変化なし' : ''}
                  </p>
                </div>
                <div className="bg-success-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-neutral-500 mb-1">利息削減額</p>
                  <p className="text-base font-extrabold text-success-500">
                    {man(prepayEffect.interestSaved)}
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={prepayEffect.chartData}
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="year"
                    tickFormatter={v => `${v}年`}
                    tick={{ fontSize: 10, fill: '#667085' }}
                  />
                  <YAxis
                    tickFormatter={v => `${v}万`}
                    tick={{ fontSize: 10, fill: '#667085' }}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      value != null ? `${Number(value).toLocaleString('ja-JP')}万円` : '完済',
                      name,
                    ]}
                    labelFormatter={label => `${label}年経過`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="繰上げなし"
                    stroke="#98A2B3"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="繰上げあり"
                    stroke="#E8632A"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Row 6: 月次支出シミュレーション */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-navy-500">💰 月々の住居費シミュレーション</p>
              <button
                onClick={() => setShowMiscCosts(v => !v)}
                className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
                  showMiscCosts
                    ? 'bg-navy-500 text-white border-navy-500'
                    : 'bg-white text-neutral-500 border-neutral-200'
                }`}
              >
                保険/税の概算 {showMiscCosts ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="mb-3">
              <NumberInput
                label="管理費・修繕積立（月額）"
                value={mgmtFee}
                onChange={v => setStore({ mgmtFee: v })}
                min={0}
                max={20}
                step={0.5}
                unit="万円"
              />
            </div>

            <table className="w-full text-xs">
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-2 text-neutral-600">ローン返済</td>
                  <td className="py-2 text-right font-semibold text-navy-500">
                    {yen(monthlyPayment)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-neutral-600">管理費・修繕積立</td>
                  <td className="py-2 text-right font-semibold text-navy-500">
                    {yen(mgmtFeeMonthly)}
                  </td>
                </tr>
                {showMiscCosts && (
                  <>
                    <tr>
                      <td className="py-2 text-neutral-500">火災・地震保険（概算）</td>
                      <td className="py-2 text-right text-neutral-600">
                        {yen(insuranceMonthly)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-neutral-500">固定資産税（月割・概算）</td>
                      <td className="py-2 text-right text-neutral-600">
                        {yen(propertyTaxMonthly)}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-navy-50">
                  <td className="py-2 px-2 font-bold text-navy-500 rounded-l-lg">合計住居費</td>
                  <td className="py-2 px-2 text-right font-extrabold text-navy-500 rounded-r-lg">
                    {yen(totalHousingCost)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">賃貸相当額（概算）</span>
                <span className="text-sm font-bold text-neutral-700">
                  {yen(monthlyPayment * 1.2)}/月
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                月々返済額 × 1.2（管理費・税・保険含む概算）
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
