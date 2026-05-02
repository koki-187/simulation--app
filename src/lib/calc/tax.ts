import { TaxDetail, SaleScenario } from './types';

/** Progressive income tax rates (2024, 所得税+復興特別所得税（住民税はcalcResidentTaxで別途加算）) */
export const TAX_BRACKETS = [
  { limit: 1_950_000,   rate: 0.05,  deduction: 0 },
  { limit: 3_300_000,   rate: 0.10,  deduction: 97_500 },
  { limit: 6_950_000,   rate: 0.20,  deduction: 427_500 },
  { limit: 9_000_000,   rate: 0.23,  deduction: 636_000 },
  { limit: 18_000_000,  rate: 0.33,  deduction: 1_536_000 },
  { limit: 40_000_000,  rate: 0.40,  deduction: 2_796_000 },
  { limit: Infinity,    rate: 0.45,  deduction: 4_796_000 },
];

export function calcIncomeTaxRate(income: number): number {
  const bracket = TAX_BRACKETS.find(b => income <= b.limit)!;
  return bracket.rate;
}

/** Income tax (所得税) only */
export function calcIncomeTax(income: number): number {
  if (income <= 0) return 0;
  const bracket = TAX_BRACKETS.find(b => income <= b.limit)!;
  return Math.floor((income * bracket.rate - bracket.deduction) * 1.021);
}

/** Resident tax: flat 10% */
export function calcResidentTax(income: number): number {
  if (income <= 0) return 0;
  return Math.floor(income * 0.10);
}

/** Total income-related tax burden */
export function calcTotalTax(income: number): number {
  if (income <= 0) return 0;
  return calcIncomeTax(income) + calcResidentTax(income);
}

/** Capital gains tax
 *  Long-term (>5yr): 20.315% (所得税15.315% + 住民税5%)
 *  Short-term (≤5yr): 39.63% (所得税30.63% + 住民税9%)
 */
export function calcCapitalGainsTax(
  salePrice: number,
  acquisitionCost: number,
  accumulatedDep: number,
  sellingCosts: number,
  holdingYears: number
): { taxableGain: number; taxRate: number; tax: number; isLongTerm: boolean } {
  const isLongTerm = holdingYears > 5;
  const taxRate = isLongTerm ? 0.20315 : 0.3963;
  const adjustedAcq = acquisitionCost - accumulatedDep; // 税務上取得費
  const taxableGain = Math.max(0, salePrice - adjustedAcq - sellingCosts);
  const tax = Math.floor(taxableGain * taxRate);
  return { taxableGain, taxRate, tax, isLongTerm };
}

/** Build 3-scenario sale analysis */
export function calcSaleScenarios(
  propertyPrice: number,
  growthRate: number,
  holdingYears: number,
  loanBalance: number,
  accumulatedDep: number,
  cumulativeCF: number,
  initialInvestment: number,
): SaleScenario[] {
  const baseSale = Math.max(0, Math.floor(propertyPrice * Math.pow(1 + growthRate, holdingYears)));
  const scenarios = [
    { label: '悲観 (−10%)', multiplier: 0.9 },
    { label: '標準',         multiplier: 1.0 },
    { label: '楽観 (+10%)',  multiplier: 1.1 },
  ];

  return scenarios.map(s => {
    const salePrice = Math.floor(baseSale * s.multiplier);
    const sellingCosts = Math.floor(salePrice * 0.03);
    const preTaxProfit = salePrice - loanBalance - sellingCosts;
    const { taxableGain, taxRate, tax } = calcCapitalGainsTax(
      salePrice, propertyPrice, accumulatedDep, sellingCosts, holdingYears
    );
    const afterTaxProfit = preTaxProfit - tax;
    const totalReturn = afterTaxProfit + cumulativeCF;
    const cagr = initialInvestment > 0 && holdingYears > 0
      ? Math.pow(Math.max(0.001, totalReturn + initialInvestment) / initialInvestment, 1 / holdingYears) - 1
      : 0;
    const investmentMultiple = initialInvestment > 0 ? (totalReturn + initialInvestment) / initialInvestment : 0;

    return {
      label: s.label,
      multiplier: s.multiplier,
      salePrice,
      loanBalance,
      sellingCosts,
      preTaxProfit,
      acquisitionCost: propertyPrice,
      accumulatedDep,
      taxableGain,
      capitalGainsTax: tax,
      afterTaxProfit,
      cagr,
      investmentMultiple,
      holdingYears,
    };
  });
}

// Satisfy unused-import linting — TaxDetail is re-exported from types via index
export type { TaxDetail };
