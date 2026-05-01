'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import {
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
const yen = (n: number) => Math.round(n).toLocaleString('ja-JP') + '円';
const man = (n: number) => (n / 10000).toFixed(1) + '万円';

// ── Types ─────────────────────────────────────────────────────────────────────
type PrepaymentType = '期間短縮型' | '返済額軽減型';

interface PrepaymentEvent {
  id: number;
  yearAfter: number;       // N年後
  amount: number;          // 万円
  type: PrepaymentType;
}

interface MonthlyRow {
  month: number;           // absolute month index (1-based)
  balance: number;
  payment: number;
  interest: number;
  principal: number;
  prepayment: number;      // prepayment amount applied this month (0 if none)
}

interface SimResult {
  rows: MonthlyRow[];
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  finalMonth: number;      // last payment month (1-based)
}

// ── Calculation ───────────────────────────────────────────────────────────────
function calcMonthlyPayment(balance: number, monthlyRate: number, remainingMonths: number): number {
  if (monthlyRate === 0) return balance / remainingMonths;
  const r = monthlyRate;
  const n = remainingMonths;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function buildSchedule(
  loanAmountMan: number,
  annualRatePct: number,
  termYears: number,
  events: PrepaymentEvent[],
): SimResult {
  const loanAmount = loanAmountMan * 10000;
  const r = annualRatePct / 100 / 12;
  const totalMonths = termYears * 12;

  // Sort events by yearAfter
  const sortedEvents = [...events].sort((a, b) => a.yearAfter - b.yearAfter);

  let balance = loanAmount;
  let payment = calcMonthlyPayment(balance, r, totalMonths);

  // effectiveEndMonth tracks the expected final payment month (changes for 期間短縮型)
  let effectiveEndMonth = totalMonths;

  const rows: MonthlyRow[] = [];
  let totalPayment = 0;
  let totalInterest = 0;

  for (let m = 1; m <= effectiveEndMonth; m++) {
    if (balance <= 0) break;

    const interest = balance * r;
    const principal = Math.min(payment - interest, balance);
    const actualPayment = interest + principal;

    balance -= principal;

    // Check for ALL prepayment events at this month (Bug 1: use filter, not find)
    let prepaymentAmount = 0;
    const eventsAtMonth = sortedEvents.filter(e => e.yearAfter * 12 === m);
    if (eventsAtMonth.length > 0 && balance > 0) {
      // Apply each event sequentially (Bug 1)
      for (const ev of eventsAtMonth) {
        if (balance <= 0) break;
        const prepAmt = Math.min(ev.amount * 10000, balance);
        prepaymentAmount += prepAmt;
        balance -= prepAmt;

        if (balance > 0) {
          if (ev.type === '期間短縮型') {
            // Bug 2: recalculate remaining months, then update effectiveEndMonth
            let newRemainingMonths: number;
            if (r === 0) {
              newRemainingMonths = Math.ceil(balance / payment);
            } else {
              const ratio = (r * balance) / payment;
              if (ratio >= 1) {
                newRemainingMonths = effectiveEndMonth - m;
              } else {
                newRemainingMonths = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
              }
            }
            effectiveEndMonth = m + newRemainingMonths;
          } else {
            // Bug 2: 返済額軽減型 — keep effectiveEndMonth, recalculate payment using remaining months
            const remaining = Math.max(1, effectiveEndMonth - m);
            payment = calcMonthlyPayment(balance, r, remaining);
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
    totalPrincipal: loanAmount, // principal is always the original loan
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

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
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
    </div>
  );
}

// ── PDF Export ────────────────────────────────────────────────────────────────
async function exportPrepaymentPDF(params: {
  loanAmount: number;
  annualRate: number;
  termYears: number;
  baseInterest: number;
  prepInterest: number;
  interestSaved: number;
  savedYears: number;
  savedRemMonths: number;
  savedMonths: number;
  baseEndDate: string;
  prepEndDate: string;
  events: PrepaymentEvent[];
}) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');
  const fmt = (n: number) => Math.round(n).toLocaleString('ja-JP') + '円';
  const fmtMan = (n: number) => (n / 10000).toFixed(1) + '万円';
  const today = new Date().toLocaleDateString('ja-JP');

  const eventRows = params.events.map((ev, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:center;">イベント${i + 1}</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:center;">${ev.yearAfter}年後</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;">${ev.amount}万円</td>
      <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:center;">${ev.type}</td>
    </tr>`).join('');

  const html = `
    <div style="padding:20px;font-family:sans-serif;">
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">繰上げ返済シミュレーション</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">作成日: ${today}</div>
      </div>

      <h3 style="font-size:13px;color:#1C2B4A;margin:16px 0 8px;">基本ローン情報</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">借入金額</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${params.loanAmount}万円</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">年利</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${params.annualRate}%</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">借入期間</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${params.termYears}年</td></tr>
        </tbody>
      </table>

      ${params.events.length > 0 ? `
      <h3 style="font-size:13px;color:#1C2B4A;margin:16px 0 8px;">繰上げ返済イベント</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="background:#1C2B4A;color:white;">
          <th style="padding:5px 8px;border:1px solid #374151;">イベント</th>
          <th style="padding:5px 8px;border:1px solid #374151;">実施時期</th>
          <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">金額</th>
          <th style="padding:5px 8px;border:1px solid #374151;">方式</th>
        </tr></thead>
        <tbody>${eventRows}</tbody>
      </table>` : ''}

      <h3 style="font-size:13px;color:#1C2B4A;margin:16px 0 8px;">シミュレーション結果</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">当初返済終了</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${params.baseEndDate}</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">繰上げ後終了</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;color:#E8632A;">${params.prepEndDate}</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">短縮期間</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;color:#16A34A;">${params.savedMonths > 0 ? `${params.savedYears > 0 ? params.savedYears + '年' : ''}${params.savedRemMonths > 0 ? params.savedRemMonths + 'ヶ月' : ''}` : '変化なし'}</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">繰上げなし 総利息</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:600;">${fmtMan(params.baseInterest)}</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">繰上げあり 総利息</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:600;">${fmtMan(params.prepInterest)}</td></tr>
          <tr style="background:#F0FDF4;"><td style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:bold;">総利息削減額</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#16A34A;font-weight:bold;">${fmtMan(params.interestSaved)}</td></tr>
        </tbody>
      </table>

      <div style="margin-top:16px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | TERASS株式会社
      </div>
    </div>
  `;

  await elementToPdf({
    html,
    filename: `TERASS_繰上げ返済シミュレーション_${today.replace(/\//g, '')}.pdf`,
    orientation: 'portrait',
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PrepaymentPage() {
  // Basic loan inputs
  const [loanAmount, setLoanAmount] = useState(4000);     // 万円
  const [annualRate, setAnnualRate] = useState(0.5);       // %
  const [termYears, setTermYears] = useState(35);          // 年

  const [pdfLoading, setPdfLoading] = useState(false);

  // Prepayment events
  const [events, setEvents] = useState<PrepaymentEvent[]>([
    { id: 1, yearAfter: 5, amount: 100, type: '期間短縮型' },
  ]);
  const [nextId, setNextId] = useState(2);

  const addEvent = () => {
    if (events.length >= 5) return;
    const lastEvent = events.length > 0 ? events[events.length - 1] : null;
    const defaultYear = lastEvent
      ? Math.min(termYears - 1, lastEvent.yearAfter + 5)
      : Math.min(termYears - 1, 5);
    setEvents(prev => [
      ...prev,
      { id: nextId, yearAfter: defaultYear, amount: 100, type: '期間短縮型' },
    ]);
    setNextId(n => n + 1);
  };

  const removeEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const updateEvent = (id: number, patch: Partial<PrepaymentEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  // Simulations
  const baseResult = useMemo(
    () => buildSchedule(loanAmount, annualRate, termYears, []),
    [loanAmount, annualRate, termYears],
  );

  const prepResult = useMemo(
    () => buildSchedule(loanAmount, annualRate, termYears, events),
    [loanAmount, annualRate, termYears, events],
  );

  // Summary calculations
  const baseInterest = baseResult.totalPayment - loanAmount * 10000;
  const prepInterest = prepResult.totalPayment - loanAmount * 10000;
  const interestSaved = baseInterest - prepInterest;

  const baseMonths = baseResult.finalMonth;
  const prepMonths = prepResult.finalMonth;
  const savedMonths = baseMonths - prepMonths;
  const savedYears = Math.floor(Math.abs(savedMonths) / 12);
  const savedRemMonths = Math.abs(savedMonths) % 12;

  // Bug 5: detect if all active events are 返済額軽減型 (term doesn't shorten)
  const allPaymentReductionType =
    events.length > 0 && events.every(e => e.type === '返済額軽減型');

  // Dates
  const startDate = new Date();
  startDate.setDate(1);
  const addMonths = (d: Date, m: number) => {
    const nd = new Date(d);
    nd.setMonth(nd.getMonth() + m);
    return nd;
  };
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月`;

  const baseEndDate = fmtDate(addMonths(startDate, baseMonths));
  const prepEndDate = fmtDate(addMonths(startDate, prepMonths));

  // Yearly comparison table data (every 12 months)
  const maxYear = Math.ceil(baseMonths / 12);
  const yearlyRows = useMemo(() => {
    return Array.from({ length: maxYear }, (_, i) => {
      const yearIdx = i + 1;
      const month = yearIdx * 12;

      const baseRow = baseResult.rows[month - 1] ?? baseResult.rows[baseResult.rows.length - 1];
      const prepRow = prepResult.rows[month - 1] ?? null;

      // Find prepayment event in this year
      const prepEventThisYear = events.find(e => e.yearAfter === yearIdx);

      return {
        year: yearIdx,
        baseBalance: baseRow?.balance ?? 0,
        prepBalance: prepRow ? prepRow.balance : 0,
        basePayment: baseRow?.payment ?? 0,
        prepPayment: prepRow?.payment ?? 0,
        prepaymentAmt: prepEventThisYear ? prepEventThisYear.amount * 10000 : 0,
        prepDone: prepRow === null,
      };
    });
  }, [baseResult, prepResult, events, maxYear]);

  // Chart data
  const chartData = useMemo(() => {
    return Array.from({ length: maxYear + 1 }, (_, i) => {
      const year = i;
      if (year === 0) {
        return {
          year: 0,
          base: loanAmount,
          prep: loanAmount,
        };
      }
      const month = year * 12;
      const baseRow = baseResult.rows[month - 1] ?? baseResult.rows[baseResult.rows.length - 1];
      const prepRow = prepResult.rows[month - 1] ?? null;
      return {
        year,
        base: Math.round((baseRow?.balance ?? 0) / 10000),
        prep: prepRow !== null ? Math.round(prepRow.balance / 10000) : null,
      };
    });
  }, [baseResult, prepResult, loanAmount, maxYear]);

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 text-white px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">繰上げ返済シミュレーター</h1>
          <p className="text-xs text-navy-100 mt-0.5">元金・利息・期間の変化をリアルタイム確認</p>
        </div>
        <button
          onClick={async () => {
            setPdfLoading(true);
            try {
              await exportPrepaymentPDF({
                loanAmount,
                annualRate,
                termYears,
                baseInterest,
                prepInterest,
                interestSaved,
                savedYears,
                savedRemMonths,
                savedMonths,
                baseEndDate,
                prepEndDate,
                events,
              });
            } catch(e) {
              console.error(e);
              alert('PDF出力でエラーが発生しました。');
            } finally {
              setPdfLoading(false);
            }
          }}
          disabled={pdfLoading}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col lg:flex-row gap-5 max-w-screen-xl mx-auto">

        {/* ── Left: Input Panel ────────────────────────────────────────────── */}
        <div className="lg:w-1/3 shrink-0 space-y-4">

          {/* Basic loan info */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-4">
            <SectionLabel>基本ローン情報</SectionLabel>

            <NumberInput
              label="借入金額"
              value={loanAmount}
              onChange={setLoanAmount}
              min={500}
              max={20000}
              step={100}
              unit="万円"
            />
            <NumberInput
              label="年利"
              value={annualRate}
              onChange={setAnnualRate}
              min={0.1}
              max={5.0}
              step={0.05}
              unit="%"
            />
            <NumberInput
              label="借入期間"
              value={termYears}
              onChange={setTermYears}
              min={5}
              max={50}
              step={1}
              unit="年"
            />

            <div className="pt-1 border-t border-neutral-100">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">返済開始</span>
                <span className="font-semibold text-navy-500">{fmtDate(startDate)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-neutral-500">月々返済額（当初）</span>
                <span className="font-semibold text-navy-500">
                  {yen(baseResult.rows[0]?.payment ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Prepayment events */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
            <SectionLabel>繰上げ返済イベント</SectionLabel>

            {events.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-2">
                繰上げ返済イベントがありません
              </p>
            )}

            {events.map((ev, idx) => (
              <div key={ev.id} className="border border-neutral-100 rounded-lg p-3 space-y-2 bg-neutral-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-navy-500">
                    イベント {idx + 1}
                  </span>
                  <button
                    onClick={() => removeEvent(ev.id)}
                    className="text-neutral-400 hover:text-danger-500 transition-colors text-sm leading-none"
                    title="削除"
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
                      className="input-cell"
                    />
                    <span className="text-xs text-neutral-500 shrink-0">年後</span>
                  </div>
                  {ev.yearAfter >= termYears && (
                    <span className="text-xs text-amber-500 font-medium">借入期間外のため無効</span>
                  )}
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
                      className="input-cell"
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

            {events.length < 5 && (
              <button
                onClick={addEvent}
                className="w-full text-xs py-2.5 rounded-lg border-2 border-dashed border-orange-300 text-orange-500 hover:bg-orange-50 font-semibold transition-colors"
              >
                + 繰上げ返済を追加
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Results Panel ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-xs text-neutral-500 mb-1">当初返済終了</p>
              <p className="text-lg font-bold text-navy-500">{baseEndDate}</p>
              <p className="text-xs text-neutral-400 mt-1">{baseMonths}ヶ月</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-xs text-neutral-500 mb-1">繰上げ後終了</p>
              <p className="text-lg font-bold text-orange-500">{prepEndDate}</p>
              <p className="text-xs text-neutral-400 mt-1">{prepMonths}ヶ月</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-xs text-neutral-500 mb-1">短縮期間</p>
              {allPaymentReductionType ? (
                <p className="text-lg font-bold text-neutral-400">0ヶ月</p>
              ) : savedMonths > 0 ? (
                <p className="text-lg font-bold text-success-500">
                  {savedYears > 0 ? `${savedYears}年` : ''}{savedRemMonths > 0 ? `${savedRemMonths}ヶ月` : ''}
                </p>
              ) : (
                <p className="text-lg font-bold text-neutral-400">変化なし</p>
              )}
              {allPaymentReductionType ? (
                <p className="text-xs text-neutral-400 mt-1">返済額軽減型</p>
              ) : (
                <p className="text-xs text-neutral-400 mt-1">{Math.abs(savedMonths)}ヶ月短縮</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
              <p className="text-xs text-neutral-500 mb-1">総利息削減額</p>
              <p className="text-lg font-bold text-success-500">
                {interestSaved >= 0 ? man(interestSaved) : '増加'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">{yen(interestSaved)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <p className="text-sm font-bold text-navy-500 mb-3">元金残高推移</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
                    value != null ? `${Number(value).toLocaleString('ja-JP')}万円` : '完済',
                    name === 'base' ? '繰上げなし' : '繰上げあり',
                  ]}
                  labelFormatter={(label) => `${label}年経過`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  formatter={v => v === 'base' ? '繰上げなし' : '繰上げあり'}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="base"
                  stroke="#98A2B3"
                  strokeWidth={2}
                  dot={false}
                  name="base"
                />
                <Line
                  type="monotone"
                  dataKey="prep"
                  stroke="#E8632A"
                  strokeWidth={2.5}
                  dot={false}
                  name="prep"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
            <p className="text-sm font-bold text-navy-500 mb-3">月別返済比較（年次サマリー）</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr>
                    {[
                      '経過年',
                      '元金残高（繰上げなし）',
                      '元金残高（繰上げあり）',
                      '月返済（繰上げなし）',
                      '月返済（繰上げあり）',
                      '繰上げ返済',
                    ].map(h => (
                      <th key={h} className="table-header whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearlyRows.map((row, i) => (
                    <tr key={row.year} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="px-3 py-2 text-center font-bold text-navy-500">
                        {row.year}年
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700">
                        {row.baseBalance > 0 ? man(row.baseBalance) : '完済'}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold ${row.prepDone ? 'text-success-500' : 'text-orange-500'}`}>
                        {row.prepDone ? '完済' : man(row.prepBalance)}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700">
                        {yen(row.basePayment)}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700">
                        {row.prepDone ? '−' : yen(row.prepPayment)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.prepaymentAmt > 0 ? (
                          <span className="text-orange-500 font-bold">
                            {man(row.prepaymentAmt)}
                          </span>
                        ) : '−'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total cost comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-50 border border-navy-100 rounded-xl p-4">
              <p className="text-xs font-bold text-navy-500 mb-3">繰上げなし 総支払額</p>
              <p className="text-xl font-extrabold text-navy-500 mb-3">
                {man(baseResult.totalPayment)}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">元金</span>
                  <span className="font-semibold">{man(loanAmount * 10000)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">利息</span>
                  <span className="font-semibold text-danger-500">{man(baseInterest)}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-600 mb-3">繰上げあり 総支払額</p>
              <p className="text-xl font-extrabold text-orange-500 mb-3">
                {man(prepResult.totalPayment)}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">元金</span>
                  <span className="font-semibold">{man(loanAmount * 10000)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">利息</span>
                  <span className="font-semibold text-danger-500">{man(prepInterest)}</span>
                </div>
                {interestSaved > 0 && (
                  <div className="flex justify-between text-xs pt-1.5 border-t border-orange-200 mt-1">
                    <span className="text-success-500 font-bold">削減額</span>
                    <span className="font-extrabold text-success-500 text-sm">
                      {man(interestSaved)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
