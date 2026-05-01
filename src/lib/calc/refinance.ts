// 住宅ローン借り換えシミュレーション計算

// Auto-calculate registration fee based on balance
export function estimateRegistrationFee(balance: number): number {
  const mortgageTax = Math.floor(balance * 0.004);      // 抵当権設定登録免許税
  const cancellationTax = 2_000;                         // 抵当権抹消登録免許税 (土地+建物)
  const judicialScrivener = 70_000;                      // 司法書士報酬
  const stampDuty = balance >= 10_000_000 ? 20_000 : 10_000; // 印紙税
  return mortgageTax + cancellationTax + judicialScrivener + stampDuty;
}

// Check the "3 conditions" rule for worthwhile refinancing
export interface ThreeConditionCheck {
  rateDiff: number;        // currentRate - newRate
  rateDiffOk: boolean;     // >= 0.3
  remainingYearsOk: boolean; // >= 10
  balanceOk: boolean;      // >= 10,000,000
  allOk: boolean;
}

export function checkThreeConditions(
  currentRate: number,
  newRate: number,
  remainingYears: number,
  balance: number
): ThreeConditionCheck {
  const rateDiff = currentRate - newRate;
  return {
    rateDiff,
    rateDiffOk: rateDiff >= 0.3,
    remainingYearsOk: remainingYears >= 10,
    balanceOk: balance >= 10_000_000,
    allOk: rateDiff >= 0.3 && remainingYears >= 10 && balance >= 10_000_000,
  };
}

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
  if (principal <= 0 || months <= 0) return 0;
  if (annualRatePct <= 0) return principal / months;
  const r = annualRatePct / 100 / 12;
  const powered = Math.pow(1 + r, months);
  if (!isFinite(powered) || powered === 1) return principal / months;
  return (principal * r * powered) / (powered - 1);
}

function calcTotalInterest(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthly = calcMonthlyPayment(principal, annualRatePct, months);
  return Math.max(0, monthly * months - principal);
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
  const breakEvenMonths = monthlySavings > 0
    ? Math.min(Math.ceil(totalCost / monthlySavings), 999)
    : Infinity;

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

// Rate-rise scenario: what if new bank raises rates by scenarioDelta?
export function calcRefinanceScenario(
  baseResult: RefinanceResult,
  input: RefinanceInput,
  scenarioDelta: number  // e.g. 0.5 = +0.5% rise at new bank
): { newMonthlySavings: number; newTotalSavingsAll: number; newBreakEvenMonths: number } {
  const adjustedNewRate = baseResult.newRate + scenarioDelta;
  const months = input.remainingYears * 12;
  const r = adjustedNewRate / 100 / 12;
  const newMonthly = (input.currentBalance * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const monthlySavings = baseResult.currentMonthly - newMonthly;
  const totalSavingsAll = monthlySavings * months - baseResult.totalCost;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(baseResult.totalCost / monthlySavings) : Infinity;
  return { newMonthlySavings: monthlySavings, newTotalSavingsAll: totalSavingsAll, newBreakEvenMonths: breakEvenMonths };
}
