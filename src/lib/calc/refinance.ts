// 住宅ローン借り換えシミュレーション計算

export interface RefinanceInput {
  currentBalance: number;   // 現在の残債 (円)
  currentRate: number;      // 現在の金利 (% e.g. 1.511)
  remainingYears: number;   // 残返済期間 (年)
  prepaymentPenalty: number; // 繰上返済手数料 (円)
  registrationFee: number;  // 抵当権設定・抹消費用 (円)
  otherFees: number;        // その他費用 (円)
}

export interface RefinanceResult {
  bankId: string;
  bankName: string;
  newRate: number;           // %
  processingFee: number;     // 事務手数料 (円)
  totalCost: number;         // 借り換え総費用 (円)
  currentMonthly: number;    // 現在の月返済額 (円)
  newMonthly: number;        // 新しい月返済額 (円)
  monthlySavings: number;    // 月々の削減額 (円)
  breakEvenMonths: number;   // 損益分岐点 (月)
  totalSavings10yr: number;  // 10年間の節約総額 (円)
  totalSavingsAll: number;   // 残期間全体の節約総額 (円)
  totalInterestCurrent: number;  // 現在のローンの残利息
  totalInterestNew: number;      // 借り換え後の残利息
  isWorthwhile: boolean;     // 借り換えが有利か
  rateType: string;
  areas: string[];
}

function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct <= 0) return principal / Math.max(months, 1);
  const r = annualRatePct / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calcTotalInterest(principal: number, annualRatePct: number, months: number): number {
  const monthly = calcMonthlyPayment(principal, annualRatePct, months);
  return monthly * months - principal;
}

export function calcRefinance(
  input: RefinanceInput,
  bank: { id: string; name: string; rate: number; fee: number; rateType: string; areas: string[] }
): RefinanceResult {
  const months = input.remainingYears * 12;

  const currentMonthly = calcMonthlyPayment(input.currentBalance, input.currentRate, months);
  const newMonthly = calcMonthlyPayment(input.currentBalance, bank.rate, months);
  const monthlySavings = currentMonthly - newMonthly;

  // 総費用: 事務手数料 + 繰上返済手数料 + 登記費用 + その他
  const totalCost = bank.fee + input.prepaymentPenalty + input.registrationFee + input.otherFees;

  // 損益分岐点
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(totalCost / monthlySavings) : Infinity;

  // 節約総額
  const grossSavings = monthlySavings * months;
  const totalSavingsAll = grossSavings - totalCost;

  const months10yr = Math.min(120, months);
  const totalSavings10yr = monthlySavings * months10yr - totalCost;

  // 残利息
  const totalInterestCurrent = calcTotalInterest(input.currentBalance, input.currentRate, months);
  const totalInterestNew = calcTotalInterest(input.currentBalance, bank.rate, months);

  const isWorthwhile = totalSavingsAll > 0 && breakEvenMonths <= months;

  return {
    bankId: bank.id,
    bankName: bank.name,
    newRate: bank.rate,
    processingFee: bank.fee,
    totalCost,
    currentMonthly,
    newMonthly,
    monthlySavings,
    breakEvenMonths,
    totalSavings10yr,
    totalSavingsAll,
    totalInterestCurrent,
    totalInterestNew,
    isWorthwhile,
    rateType: bank.rateType,
    areas: bank.areas,
  };
}
