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
  let remainingMonths = totalMonths;

  const rows: MonthlyRow[] = [];
  let totalPayment = 0;
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let m = 1; m <= totalMonths; m++) {
    if (balance <= 0) break;

    const interest = balance * r;
    const principal = Math.min(payment - interest, balance);
    const actualPayment = interest + principal;

    balance -= principal;

    // Check for prepayment event at this month
    let prepaymentAmount = 0;
    const eventAtMonth = sortedEvents.find(e => e.yearAfter * 12 === m);
    if (eventAtMonth && balance > 0) {
      const prepAmt = Math.min(eventAtMonth.amount * 10000, balance);
      prepaymentAmount = prepAmt;
      balance -= prepAmt;

      if (balance > 0) {
        const monthsElapsed = m;
        const originalRemaining = totalMonths - monthsElapsed;

        if (eventAtMonth.type === '期間短縮型') {
          // Recalculate remaining months keeping same payment
          // remaining months = -ln(1 - r*balance/payment) / ln(1+r)
          if (r === 0) {
            remainingMonths = Math.ceil(balance / payment);
          } else {
            const ratio = (r * balance) / payment;
            if (ratio >= 1) {
              remainingMonths = originalRemaining;
            } else {
              remainingMonths = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
            }
          }
        } else {
          // 返済額軽減型: keep same remaining months, recalculate payment
          remainingMonths = Math.max(1, originalRemaining);
          payment = calcMonthlyPayment(balance, r, remainingMonths);
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
    totalPrincipal += principal + prepaymentAmount;

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PrepaymentPage() {
  // Basic loan inputs
  const [loanAmount, setLoanAmount] = useState(4000);     // 万円
  const [annualRate, setAnnualRate] = useState(0.5);       // %
  const [termYears, setTermYears] = useState(35);          // 年

  // Prepayment events
  const [events, setEvents] = useState<PrepaymentEvent[]>([
    { id: 1, yearAfter: 5, amount: 100, type: '期間短縮型' },
  ]);
  const [nextId, setNextId] = useState(2);

  const addEvent = () => {
    if (events.length >= 5) return;
    const defaultYear = events.length > 0
      ? Math.min(49, events[events.length - 1].yearAfter + 5)
      : 5;
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
      <div className="bg-navy-500 text-white px-6 py-5">
        <h1 className="text-lg font-bold leading-tight">繰上げ返済シミュレーター</h1>
        <p className="text-xs text-navy-100 mt-0.5">元金・利息・期間の変化をリアルタイム確認</p>
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
                      max={49}
                      step={1}
                      onChange={e => updateEvent(ev.id, { yearAfter: Number(e.target.value) })}
                      className="input-cell"
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
              {savedMonths > 0 ? (
                <p className="text-lg font-bold text-success-500">
                  {savedYears > 0 ? `${savedYears}年` : ''}{savedRemMonths > 0 ? `${savedRemMonths}ヶ月` : ''}
                  {savedMonths === 0 && '変化なし'}
                </p>
              ) : (
                <p className="text-lg font-bold text-neutral-400">変化なし</p>
              )}
              <p className="text-xs text-neutral-400 mt-1">{Math.abs(savedMonths)}ヶ月短縮</p>
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
