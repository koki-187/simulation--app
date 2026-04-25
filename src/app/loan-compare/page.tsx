'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import {
  HOME_LOAN_BANKS,
  INVESTMENT_BANKS,
  type HomeLoanBank,
  type InvestmentBank,
} from '@/lib/data/investmentBanks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jspdf-autotable');

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'home' | 'investment';
type RepaymentMethod = '元利均等' | '元金均等';
type SortBy = 'recommended' | 'rate' | 'maxLoan' | 'repaymentRatio';

interface LoanResult {
  bankId: string;
  name: string;
  rate: number;
  prevMonthRate: number;
  rateType: string;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  maxLoan: number;
  features: string;
  isHomeLoan: boolean;
  processingFee: string;
  auditMonthlyPayment: number;
  repaymentRatio: number;
  isRepaymentOk: boolean;
  maxBorrowable: number;
  completionAge: number;
  isAgeOk: boolean;
}

interface PDFParams {
  mode: Mode;
  principal: number;
  years: number;
  method: RepaymentMethod;
  annualIncome: number;
  borrowerAge: number;
  otherLoanPayment: number;
  results: LoanResult[];
}

// ─── Mortgage Calculation ─────────────────────────────────────────────────────

function calcMonthly(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcFirstMonthGenkin(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal / n + principal * r;
}

function calcTotalPaymentGenkin(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const totalInterest = r * principal * (n + 1) / 2;
  return principal + totalInterest;
}

function calcAuditMonthly(principal: number, auditRate: number, years: number): number {
  return calcMonthly(principal, auditRate, years);
}

function calcRepaymentRatio(
  principal: number,
  auditRate: number,
  years: number,
  otherLoanAnnual: number,
  annualIncome: number,
): number {
  const annualPayment = calcMonthly(principal, auditRate, years) * 12;
  return ((annualPayment + otherLoanAnnual * 10000) / (annualIncome * 10000)) * 100;
}

function calcMaxBorrowable(
  annualIncome: number,
  repaymentRatioLimit: number,
  auditRate: number,
  termYears: number,
  bankMaxLoan: number,
  age: number,
  maxCompletionAge: number,
  maxTermYears: number,
): number {
  const actualYears = Math.min(termYears, maxTermYears, maxCompletionAge - age);
  if (actualYears <= 0) return 0;
  const maxMonthlyByRatio = (annualIncome * 10000 * repaymentRatioLimit / 100) / 12;
  const r = auditRate / 100 / 12;
  const n = actualYears * 12;
  let maxByIncome: number;
  if (r === 0) {
    maxByIncome = maxMonthlyByRatio * n;
  } else {
    maxByIncome = (maxMonthlyByRatio * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  }
  return Math.min(maxByIncome / 10000, bankMaxLoan);
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportLoanComparePDF(params: PDFParams): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF('p', 'mm', 'a4') as any;
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const navyRGB: [number, number, number] = [28, 43, 74];

  doc.setFillColor(...navyRGB);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('金融機関比較レポート', 14, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TERASS', 14, 20);
  doc.text(today, 196, 20, { align: 'right' });

  doc.setTextColor(16, 24, 43);

  let y = 36;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('借入条件', 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [['項目', '内容']],
    body: [
      ['借入額', `${params.principal.toLocaleString()}万円`],
      ['返済期間', `${params.years}年`],
      ['返済方式', params.method],
      ['比較モード', params.mode === 'home' ? '住宅ローン' : '収益用不動産'],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: navyRGB, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y + 40) + 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('借入者条件', 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [['項目', '内容']],
    body: [
      ['年収', `${params.annualIncome.toLocaleString()}万円`],
      ['年齢', `${params.borrowerAge}歳`],
      ['他借入年返済額', `${params.otherLoanPayment}万円`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: navyRGB, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y + 40) + 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('月々返済額（概略グラフ）', 14, y);
  y += 6;

  const maxPayment = Math.max(...params.results.map(r => r.monthlyPayment));
  const barMaxWidth = 100;
  params.results.forEach((r, i) => {
    const barW = maxPayment > 0 ? (r.monthlyPayment / maxPayment) * barMaxWidth : 0;
    doc.setFillColor(...navyRGB);
    doc.rect(60, y + i * 10, barW, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 24, 43);
    doc.text(r.name.slice(0, 12), 14, y + i * 10 + 4.5);
    doc.text(`${Math.round(r.monthlyPayment).toLocaleString()}円`, 165, y + i * 10 + 4.5);
  });
  y += params.results.length * 10 + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('金融機関比較表', 14, y);
  y += 4;

  const tableHead = [['金融機関', '金利', '審査金利', '月々返済額', '総利息', '返済比率', '借入上限', '完済年齢', '手数料']];
  const tableBody = params.results.map(r => [
    r.name,
    `${r.rate.toFixed(3)}%`,
    `${(r as LoanResult & { auditRate?: number }).auditRate ?? '-'}%`,
    `${Math.round(r.monthlyPayment).toLocaleString()}円`,
    `${Math.round(r.totalInterest / 10000).toLocaleString()}万円`,
    `${r.repaymentRatio.toFixed(1)}% ${r.isRepaymentOk ? '✓' : '⚠'}`,
    `${Math.round(r.maxBorrowable).toLocaleString()}万円`,
    `${r.completionAge}歳 ${r.isAgeOk ? 'OK' : '超過'}`,
    r.processingFee,
  ]);

  doc.autoTable({
    startY: y,
    head: tableHead,
    body: tableBody,
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: navyRGB, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = 297;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('本資料はTERASS株式会社が作成した参考情報です', 105, pageHeight - 8, { align: 'center' });

  doc.save(`金融機関比較レポート_${today}.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOME_COLORS = ['#1C2B4A', '#E8632A', '#27AE60'];
const INVESTMENT_COLORS = ['#1C2B4A', '#E8632A', '#27AE60'];

function buildResult(
  bank: HomeLoanBank | InvestmentBank,
  isHome: boolean,
  principalMan: number,
  years: number,
  method: RepaymentMethod,
  annualIncome: number,
  borrowerAge: number,
  otherLoanPayment: number,
): LoanResult {
  const principal = principalMan * 10000;
  const rate = isHome ? (bank as HomeLoanBank).rate : (bank as InvestmentBank).rateMin;
  const rateType = isHome ? (bank as HomeLoanBank).rateType : '変動';

  let monthly: number;
  let total: number;

  if (method === '元利均等') {
    monthly = calcMonthly(principal, rate, years);
    total = monthly * years * 12;
  } else {
    monthly = calcFirstMonthGenkin(principal, rate, years);
    total = calcTotalPaymentGenkin(principal, rate, years);
  }

  const totalInterest = total - principal;

  // Home loan specific fields
  let auditRate = rate;
  let repaymentRatioLimit = 35;
  let maxCompletionAge = 80;
  let maxTermYears = years;
  let processingFee = '個別';
  let prevMonthRate = rate;
  let bankMaxLoan = isHome ? (bank as HomeLoanBank).maxLoan : 10000;

  if (isHome) {
    const hb = bank as HomeLoanBank;
    auditRate = hb.auditRate;
    repaymentRatioLimit = hb.repaymentRatioLimit;
    maxCompletionAge = hb.maxCompletionAge;
    maxTermYears = hb.maxTermYears;
    processingFee = hb.processingFee;
    prevMonthRate = hb.prevMonthRate;
    bankMaxLoan = hb.maxLoan;
  }

  const auditMonthlyPayment = calcAuditMonthly(principal, auditRate, years);
  const repaymentRatio = calcRepaymentRatio(principal, auditRate, years, otherLoanPayment, annualIncome);
  const isRepaymentOk = repaymentRatio <= repaymentRatioLimit;
  const completionAge = borrowerAge + years;
  const isAgeOk = completionAge <= maxCompletionAge;
  const maxBorrowable = isHome
    ? calcMaxBorrowable(annualIncome, repaymentRatioLimit, auditRate, years, bankMaxLoan, borrowerAge, maxCompletionAge, maxTermYears)
    : 0;

  return {
    bankId: bank.id,
    name: bank.name,
    rate,
    prevMonthRate,
    rateType,
    monthlyPayment: monthly,
    totalPayment: total,
    totalInterest,
    maxLoan: bankMaxLoan,
    features: bank.features,
    isHomeLoan: isHome,
    processingFee,
    auditMonthlyPayment,
    repaymentRatio,
    isRepaymentOk,
    maxBorrowable,
    completionAge,
    isAgeOk,
  };
}

function RateTrendBadge({ current, prev }: { current: number; prev: number }) {
  const diff = current - prev;
  if (Math.abs(diff) < 0.0001) {
    return <span className="text-neutral-400 text-xs">—</span>;
  }
  const sign = diff > 0 ? '▲' : '▼';
  const color = diff > 0 ? 'text-danger-500' : 'text-success-500';
  return (
    <span className={`text-xs font-semibold tabular-nums ${color}`}>
      {sign}{Math.abs(diff).toFixed(3)}%
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanComparePage() {
  const [mode, setMode] = useState<Mode>('home');
  const [principal, setPrincipal] = useState(4000);
  const [years, setYears] = useState(35);
  const [method, setMethod] = useState<RepaymentMethod>('元利均等');
  const [annualIncome, setAnnualIncome] = useState(600);
  const [borrowerAge, setBorrowerAge] = useState(35);
  const [otherLoanPayment, setOtherLoanPayment] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('recommended');

  const [homeSlots, setHomeSlots] = useState<string[]>([
    HOME_LOAN_BANKS[0]?.id ?? '',
    HOME_LOAN_BANKS[1]?.id ?? '',
    HOME_LOAN_BANKS[2]?.id ?? '',
  ]);
  const [investSlots, setInvestSlots] = useState<string[]>([
    INVESTMENT_BANKS[0]?.id ?? '',
    INVESTMENT_BANKS[1]?.id ?? '',
    INVESTMENT_BANKS[2]?.id ?? '',
  ]);

  const slots = mode === 'home' ? homeSlots : investSlots;
  const setSlots = mode === 'home' ? setHomeSlots : setInvestSlots;
  const bankList = mode === 'home' ? HOME_LOAN_BANKS : INVESTMENT_BANKS;
  const colors = mode === 'home' ? HOME_COLORS : INVESTMENT_COLORS;

  const results = useMemo<LoanResult[]>(() => {
    const raw = slots
      .filter(id => id !== '')
      .map(id => {
        const bank = bankList.find(b => b.id === id);
        if (!bank) return null;
        return buildResult(bank, mode === 'home', principal, years, method, annualIncome, borrowerAge, otherLoanPayment);
      })
      .filter((r): r is LoanResult => r !== null);

    return [...raw].sort((a, b) => {
      if (sortBy === 'rate') return a.rate - b.rate;
      if (sortBy === 'maxLoan') return b.maxBorrowable - a.maxBorrowable;
      if (sortBy === 'repaymentRatio') return a.repaymentRatio - b.repaymentRatio;
      // recommended: repaymentOk first, then lowest totalInterest
      if (a.isRepaymentOk !== b.isRepaymentOk) return a.isRepaymentOk ? -1 : 1;
      return a.totalInterest - b.totalInterest;
    });
  }, [slots, bankList, mode, principal, years, method, annualIncome, borrowerAge, otherLoanPayment, sortBy]);

  const minInterestIdx = useMemo(() => {
    if (results.length === 0) return -1;
    let minIdx = 0;
    results.forEach((r, i) => {
      if (r.totalInterest < results[minIdx].totalInterest) minIdx = i;
    });
    return minIdx;
  }, [results]);

  // For coloring by original slot order, map bankId -> slot index
  const slotColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    slots.filter(id => id !== '').forEach((id, i) => { map[id] = i; });
    return map;
  }, [slots]);

  const chartData = results.map(r => ({
    name: r.name.replace('銀行', '').replace('ネット', '').slice(0, 10),
    月々返済額: Math.round(r.monthlyPayment),
    審査金利月返済: Math.round(r.auditMonthlyPayment),
    bankId: r.bankId,
  }));

  function addSlot() {
    if (slots.length >= 3) return;
    const usedIds = new Set(slots);
    const next = bankList.find(b => !usedIds.has(b.id));
    setSlots([...slots, next?.id ?? '']);
  }

  function removeSlot(idx: number) {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== idx));
  }

  function updateSlot(idx: number, id: string) {
    const updated = [...slots];
    updated[idx] = id;
    setSlots(updated);
  }

  function handleExportPDF() {
    exportLoanComparePDF({ mode, principal, years, method, annualIncome, borrowerAge, otherLoanPayment, results });
  }

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'recommended', label: 'おすすめ順' },
    { value: 'rate', label: '金利順' },
    { value: 'maxLoan', label: '借入上限順' },
    { value: 'repaymentRatio', label: '返済比率順' },
  ];

  return (
    <AppShell>
      {/* Page header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">金融機関比較シミュレーター</h1>
          <p className="text-xs text-navy-100">最大3行を並べて月々返済額・総利息・返済比率を比較</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="btn-primary text-xs px-3 py-1.5"
          disabled={results.length === 0}
        >
          PDFエクスポート
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Mode selector */}
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
          {(['home', 'investment'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === m
                  ? 'bg-navy-500 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {m === 'home' ? '住宅ローン比較' : '収益用不動産比較'}
            </button>
          ))}
        </div>

        {/* Loan inputs */}
        <div className="bg-white rounded-xl border border-neutral-100" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="bg-navy-500 text-white font-bold text-sm px-4 py-3 rounded-t-lg">
            借入条件
          </div>
          <div className="p-4 flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-xs font-medium text-neutral-700">借入希望額</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={principal}
                  min={100}
                  max={100000}
                  step={100}
                  onChange={e => setPrincipal(Number(e.target.value) || 4000)}
                  className="input-cell w-32"
                />
                <span className="text-xs text-neutral-400">万円</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">返済期間</label>
              <select
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="input-cell w-28"
              >
                {[15, 20, 25, 30, 35].map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">返済方式</label>
              <div className="flex gap-3 py-2">
                {(['元利均等', '元金均等'] as RepaymentMethod[]).map(m => (
                  <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="accent-orange-500"
                    />
                    <span className={method === m ? 'text-navy-500 font-semibold' : 'text-neutral-700'}>
                      {m}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Borrower conditions */}
        <div className="bg-white rounded-xl border border-neutral-100" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="bg-navy-500 text-white font-bold text-sm px-4 py-3 rounded-t-lg">
            借入者条件
          </div>
          <div className="p-4 flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">年収</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={annualIncome}
                  min={100}
                  max={10000}
                  step={50}
                  onChange={e => setAnnualIncome(Number(e.target.value) || 600)}
                  className="input-cell w-28"
                />
                <span className="text-xs text-neutral-400">万円</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">年齢</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={borrowerAge}
                  min={18}
                  max={70}
                  step={1}
                  onChange={e => setBorrowerAge(Number(e.target.value) || 35)}
                  className="input-cell w-24"
                />
                <span className="text-xs text-neutral-400">歳</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-700">他借入年返済額</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={otherLoanPayment}
                  min={0}
                  max={5000}
                  step={10}
                  onChange={e => setOtherLoanPayment(Number(e.target.value) || 0)}
                  className="input-cell w-28"
                />
                <span className="text-xs text-neutral-400">万円/年</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank selectors */}
        <div className="bg-white rounded-xl border border-neutral-100" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="bg-navy-500 text-white font-bold text-sm px-4 py-3 rounded-t-lg flex items-center justify-between">
            <span>比較銀行を選択（最大3行）</span>
            {slots.length < 3 && (
              <button
                onClick={addSlot}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
              >
                ＋ 追加
              </button>
            )}
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {slots.map((selectedId, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-bold text-navy-500 shrink-0">
                  銀行{idx === 0 ? '①' : idx === 1 ? '②' : '③'}
                </span>
                <select
                  value={selectedId}
                  onChange={e => updateSlot(idx, e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer min-w-[200px]"
                >
                  <option value="">-- 選択してください --</option>
                  {bankList.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {mode === 'home'
                        ? ` (${(b as HomeLoanBank).rate.toFixed(3)}%)`
                        : ` (${(b as InvestmentBank).rateMin.toFixed(2)}%~)`
                      }
                    </option>
                  ))}
                </select>
                {slots.length > 1 && (
                  <button
                    onClick={() => removeSlot(idx)}
                    className="text-danger-500 hover:bg-danger-50 text-xs px-1.5 py-0.5 rounded transition-colors ml-1"
                    title="削除"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-neutral-500">並び替え:</span>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border ${
                    sortBy === opt.value
                      ? 'bg-navy-500 text-white border-navy-500'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r, i) => {
                const isCheapest = i === minInterestIdx;
                const colorIdx = slotColorMap[r.bankId] ?? i;
                return (
                  <div
                    key={r.bankId}
                    className={`bg-white rounded-xl border p-4 relative ${
                      isCheapest ? 'border-success-500 ring-2 ring-success-500' : 'border-neutral-100'
                    }`}
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    {isCheapest && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                        ⭐ 総利息最安
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colors[colorIdx] ?? '#1C2B4A' }}
                      />
                      <h3 className="text-xs font-bold text-navy-500 leading-tight">{r.name}</h3>
                    </div>

                    {/* Monthly payment */}
                    <div className="text-2xl font-bold text-navy-500 tabular-nums">
                      {Math.round(r.monthlyPayment).toLocaleString()}
                      <span className="text-sm font-normal text-neutral-500">円/月</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      実行金利 {r.rate.toFixed(3)}%ベース
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-neutral-700">
                      <div className="flex justify-between">
                        <span>総支払額</span>
                        <span className="font-semibold tabular-nums">
                          {Math.round(r.totalPayment / 10000).toLocaleString()}万円
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>総利息</span>
                        <span className="font-semibold text-danger-500 tabular-nums">
                          {Math.round(r.totalInterest / 10000).toLocaleString()}万円
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>返済比率</span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold tabular-nums">{r.repaymentRatio.toFixed(1)}%</span>
                          {r.isRepaymentOk ? (
                            <span className="bg-success-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">返比内✓</span>
                          ) : (
                            <span className="bg-danger-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">返比超過⚠</span>
                          )}
                        </span>
                      </div>
                      {r.isHomeLoan && (
                        <>
                          <div className="flex justify-between">
                            <span>借入上限</span>
                            <span className="font-semibold tabular-nums">
                              {Math.round(r.maxBorrowable).toLocaleString()}万円
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>完済年齢</span>
                            <span className="flex items-center gap-1.5">
                              <span className="font-semibold tabular-nums">{r.completionAge}歳</span>
                              {r.isAgeOk ? (
                                <span className="bg-success-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">OK</span>
                              ) : (
                                <span className="bg-danger-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">超過</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>前月比金利</span>
                            <RateTrendBadge current={r.rate} prev={r.prevMonthRate} />
                          </div>
                          <div className="flex justify-between">
                            <span>手数料</span>
                            <span className="font-semibold text-neutral-600">{r.processingFee}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-neutral-100" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="bg-navy-500 text-white font-bold text-sm px-4 py-3 rounded-t-lg">
                月々返済額 比較グラフ
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(Number(v) / 10000)}万`} />
                    <Tooltip
                      formatter={(v: unknown) => [`${Number(v).toLocaleString()}円`]}
                    />
                    <Legend />
                    <Bar dataKey="月々返済額" radius={[4, 4, 0, 0]}>
                      {chartData.map(entry => (
                        <Cell
                          key={`cell-actual-${entry.bankId}`}
                          fill={colors[slotColorMap[entry.bankId] ?? 0] ?? '#1C2B4A'}
                        />
                      ))}
                    </Bar>
                    {mode === 'home' && (
                      <Bar dataKey="審査金利月返済" radius={[4, 4, 0, 0]} opacity={0.45}>
                        {chartData.map(entry => (
                          <Cell
                            key={`cell-audit-${entry.bankId}`}
                            fill={colors[slotColorMap[entry.bankId] ?? 0] ?? '#1C2B4A'}
                          />
                        ))}
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detail comparison table */}
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="bg-navy-500 text-white font-bold text-sm px-4 py-3 rounded-t-lg">
                詳細比較表
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="bg-navy-500 text-white text-xs font-semibold px-3 py-2 text-left min-w-[120px]">
                        項目
                      </th>
                      {results.map((r, i) => (
                        <th
                          key={r.bankId}
                          className={`text-xs font-semibold px-3 py-2 text-center ${
                            i === minInterestIdx
                              ? 'bg-success-500 text-white'
                              : 'bg-navy-500 text-white'
                          }`}
                        >
                          {r.name}
                          {i === minInterestIdx && (
                            <span className="block text-xs font-normal opacity-90">⭐ 総利息最安</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: '金融機関名',
                        render: (r: LoanResult) => r.name,
                      },
                      {
                        label: '金利',
                        render: (r: LoanResult) => (
                          <span className="text-orange-500 font-bold">{r.rate.toFixed(3)}%</span>
                        ),
                      },
                      {
                        label: '金利タイプ',
                        render: (r: LoanResult) => (
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                              r.rateType === '変動'
                                ? 'bg-warn-50 text-warn-500'
                                : 'bg-navy-50 text-navy-500'
                            }`}
                          >
                            {r.rateType}
                          </span>
                        ),
                      },
                      {
                        label: '審査金利',
                        render: (r: LoanResult) =>
                          r.isHomeLoan ? (
                            <span className="tabular-nums text-neutral-600">
                              {(() => {
                                const hb = HOME_LOAN_BANKS.find(b => b.id === r.bankId);
                                return hb ? `${hb.auditRate.toFixed(2)}%` : '—';
                              })()}
                            </span>
                          ) : '—',
                      },
                      {
                        label: '返済期間',
                        render: () => <span>{years}年</span>,
                      },
                      {
                        label: '月々返済額',
                        render: (r: LoanResult) => (
                          <span className="font-semibold tabular-nums">
                            {Math.round(r.monthlyPayment).toLocaleString()}円
                          </span>
                        ),
                      },
                      {
                        label: '総支払額',
                        render: (r: LoanResult) => (
                          <span className="tabular-nums">
                            {Math.round(r.totalPayment / 10000).toLocaleString()}万円
                          </span>
                        ),
                      },
                      {
                        label: '総利息',
                        render: (r: LoanResult) => (
                          <span className="text-danger-500 font-semibold tabular-nums">
                            {Math.round(r.totalInterest / 10000).toLocaleString()}万円
                          </span>
                        ),
                      },
                      {
                        label: '返済比率',
                        render: (r: LoanResult) => (
                          <span className="flex flex-col items-center gap-0.5">
                            <span className="tabular-nums font-semibold">{r.repaymentRatio.toFixed(1)}%</span>
                            {r.isRepaymentOk ? (
                              <span className="bg-success-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">返比内✓</span>
                            ) : (
                              <span className="bg-danger-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">返比超過⚠</span>
                            )}
                          </span>
                        ),
                      },
                      {
                        label: '返済比率上限',
                        render: (r: LoanResult) => {
                          if (!r.isHomeLoan) return '—';
                          const hb = HOME_LOAN_BANKS.find(b => b.id === r.bankId);
                          return hb ? `${hb.repaymentRatioLimit}%` : '—';
                        },
                      },
                      {
                        label: '借入上限額',
                        render: (r: LoanResult) =>
                          r.isHomeLoan
                            ? `${Math.round(r.maxBorrowable).toLocaleString()}万円`
                            : '個別審査',
                      },
                      {
                        label: '完済年齢',
                        render: (r: LoanResult) => (
                          <span className="flex flex-col items-center gap-0.5">
                            <span className="tabular-nums font-semibold">{r.completionAge}歳</span>
                            {r.isAgeOk ? (
                              <span className="bg-success-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">OK</span>
                            ) : (
                              <span className="bg-danger-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">超過</span>
                            )}
                          </span>
                        ),
                      },
                      {
                        label: '前月比金利',
                        render: (r: LoanResult) =>
                          r.isHomeLoan ? (
                            <RateTrendBadge current={r.rate} prev={r.prevMonthRate} />
                          ) : '—',
                      },
                      {
                        label: '手数料',
                        render: (r: LoanResult) =>
                          r.isHomeLoan ? r.processingFee : '個別',
                      },
                      {
                        label: '最大借入額（データ）',
                        render: (r: LoanResult) =>
                          r.isHomeLoan && r.maxLoan > 0
                            ? `${r.maxLoan.toLocaleString()}万円`
                            : '個別審査',
                      },
                      {
                        label: '特徴',
                        render: (r: LoanResult) => (
                          <span className="text-neutral-600 leading-relaxed">{r.features}</span>
                        ),
                      },
                    ].map((row, ri) => (
                      <tr
                        key={row.label}
                        className={ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                      >
                        <td className="px-3 py-2.5 font-semibold text-navy-500 whitespace-nowrap border-r border-neutral-100">
                          {row.label}
                        </td>
                        {results.map(r => (
                          <td
                            key={r.bankId}
                            className="px-3 py-2.5 text-center align-top border-r border-neutral-100 last:border-0"
                          >
                            {row.render(r)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {results.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-100 p-12 text-center text-neutral-400 text-sm" style={{ boxShadow: 'var(--shadow-card)' }}>
            銀行を選択すると比較結果が表示されます
          </div>
        )}
      </div>
    </AppShell>
  );
}
