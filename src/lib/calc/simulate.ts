import { SimInput, SimResult, CFRow, Ratios } from './types';
import { calcPMT, calcAmortization, balanceAtYear, annualInterest, calcBankOptions } from './mortgage';
import { calcDepreciation } from './depreciation';
import { calcTotalTax, calcIncomeTaxRate, calcIncomeTax, calcResidentTax, calcSaleScenarios } from './tax';

export function simulate(input: SimInput): SimResult {
  const {
    propertyPrice, equity, expenses, rate, termYears,
    monthlyRent, managementFee, repairFund, otherExpenses, vacancyRate,
    fixedAssetTax, buildingRatio, structureDepYears, equipmentDepYears,
    holdingYears, growthRate, annualIncomeTaxBase, annualIncomeDeclared,
  } = input;

  // ── Core values ─────────────────────────────────────────────────────────────
  const loanAmount = propertyPrice - equity;
  const initialInvestment = equity + expenses;
  const monthlyPayment = calcPMT(rate, termYears, loanAmount);
  const totalPayment = monthlyPayment * termYears * 12;
  const totalInterest = totalPayment - loanAmount;
  const effectiveMonthlyRent = Math.round(monthlyRent * (1 - vacancyRate));

  // ── Depreciation ─────────────────────────────────────────────────────────────
  const buildingPrice = Math.floor(propertyPrice * buildingRatio);
  const strPrice = input.structurePrice || Math.floor(buildingPrice * 0.7);
  const eqPrice = input.equipmentPrice || Math.floor(buildingPrice * 0.3);
  const depRows = calcDepreciation(strPrice, eqPrice, structureDepYears, equipmentDepYears, Math.max(holdingYears, termYears));
  const annualStructureDep = depRows[0]?.structureAnnual ?? 0;
  const annualEquipmentDep = depRows[0]?.equipmentAnnual ?? 0;
  const annualDepreciation = annualStructureDep + annualEquipmentDep;

  // ── Amortization ─────────────────────────────────────────────────────────────
  const amortization = calcAmortization(loanAmount, rate, termYears);

  // ── Annual Cash Flows ─────────────────────────────────────────────────────────
  let cumCF = 0;
  const cashFlows: CFRow[] = [];
  const totalYears = Math.max(holdingYears, termYears, 45);

  for (let y = 1; y <= totalYears; y++) {
    const rental = effectiveMonthlyRent * 12;
    const mgmtCosts = (managementFee + repairFund + otherExpenses) * 12;
    const fat = fixedAssetTax;
    const opCF = rental - mgmtCosts - fat;
    const annLoan = y <= termYears ? monthlyPayment * 12 : 0;
    const loanInt = annualInterest(amortization, y);
    const preTaxCF = opCF - annLoan;
    const dep = depRows[y - 1]?.totalAnnual ?? 0;
    const taxableInc = rental - mgmtCosts - fat - loanInt - dep;
    const tax = calcTotalTax(taxableInc);
    const afterTaxCF = preTaxCF - tax;
    cumCF += afterTaxCF;
    const loanBal = y <= termYears ? balanceAtYear(amortization, y) : 0;

    cashFlows.push({
      year: y,
      rentalIncome: rental,
      managementCosts: mgmtCosts,
      fixedAssetTax: fat,
      operatingCF: opCF,
      annualLoanPayment: annLoan,
      loanInterest: loanInt,
      preTaxCF,
      depreciation: dep,
      taxableIncome: taxableInc,
      incomeTax: tax,
      afterTaxCF,
      cumulativeCF: cumCF,
      loanBalance: loanBal,
    });
  }

  // ── Sale Scenarios ──────────────────────────────────────────────────────────
  const balAtSale = balanceAtYear(amortization, holdingYears);
  const cumDepAtSale = depRows[holdingYears - 1]?.cumDepreciation ?? 0;
  const cumCFAtSale = cashFlows[holdingYears - 1]?.cumulativeCF ?? 0;
  const saleScenarios = calcSaleScenarios(
    propertyPrice, growthRate, holdingYears, balAtSale, cumDepAtSale, cumCFAtSale, initialInvestment
  );

  // ── Tax Detail ───────────────────────────────────────────────────────────────
  const y1 = cashFlows[0];
  const insuranceEst = Math.floor(propertyPrice * 0.001);

  // 損益通算計算（給与所得がある場合のみ有効）
  // 注: annualIncomeTaxBase は円単位（input UI では 円/年）。salaryIncome は表示用に万円換算。
  const salaryIncomeYen = annualIncomeTaxBase; // 円単位
  const salaryIncome = Math.floor(salaryIncomeYen / 10000); // 万円単位（表示用）
  const hasLoss = y1.taxableIncome < 0;
  const deductibleLoss = Math.min(0, y1.taxableIncome);
  const combinedTaxableIncome = Math.max(0, salaryIncomeYen + y1.taxableIncome);
  const taxOnSalaryAlone = salaryIncomeYen > 0
    ? calcIncomeTax(salaryIncomeYen) + calcResidentTax(salaryIncomeYen)
    : 0;
  const taxOnCombined = hasLoss && salaryIncomeYen > 0
    ? calcIncomeTax(combinedTaxableIncome) + calcResidentTax(combinedTaxableIncome)
    : taxOnSalaryAlone;
  const estimatedTaxRefund = Math.max(0, taxOnSalaryAlone - taxOnCombined);

  const taxDetail = {
    rentalRevenue: y1.rentalIncome,
    managementExp: (managementFee + otherExpenses) * 12,   // 管理費＋その他（修繕除く）
    repairExp: repairFund * 12,                             // 修繕積立金（修正: 0→実値）
    insuranceEst,
    fixedAssetTax: y1.fixedAssetTax,
    depreciation: y1.depreciation,
    loanInterest: y1.loanInterest,
    totalExpenses: y1.managementCosts + y1.fixedAssetTax + y1.depreciation + y1.loanInterest + insuranceEst,
    realEstateIncome: y1.taxableIncome,
    incomeTaxRate: calcIncomeTaxRate(y1.taxableIncome),
    incomeTax: calcIncomeTax(y1.taxableIncome),
    residentTax: calcResidentTax(y1.taxableIncome),
    totalTaxBurden: y1.incomeTax,
    holdingYears,
    isLongTerm: holdingYears > 5,
    taxRate: holdingYears > 5 ? 0.20315 : 0.3963,
    salePrice: saleScenarios[1].salePrice,
    acquisitionCost: propertyPrice,
    accumulatedDep: cumDepAtSale,
    sellingCosts: saleScenarios[1].sellingCosts,
    taxableGain: saleScenarios[1].taxableGain,
    capitalGainsTax: saleScenarios[1].capitalGainsTax,
    salaryIncome,
    hasLoss,
    deductibleLoss,
    combinedTaxableIncome,
    taxOnSalaryAlone,
    taxOnCombined,
    estimatedTaxRefund,
  };

  // ── Ratios ─────────────────────────────────────────────────────────────────
  const grossYield = effectiveMonthlyRent > 0 ? (monthlyRent * 12) / propertyPrice : 0;
  const netYield = propertyPrice > 0
    ? ((effectiveMonthlyRent * 12) - (managementFee + repairFund + otherExpenses) * 12 - fixedAssetTax) / propertyPrice
    : 0;
  const monthlyLoanPayment = monthlyPayment;
  const breakevenRent = monthlyLoanPayment + managementFee + repairFund + otherExpenses + fixedAssetTax / 12;
  const annualDebtService = monthlyPayment * 12;
  const dscr = annualDebtService > 0 ? y1.operatingCF / annualDebtService : 0;

  const totalMonthlyDebt = monthlyPayment; // for ratios (could add multiple loans)
  const ratios: Ratios = {
    grossYield,
    netYield,
    repaymentRatio: effectiveMonthlyRent > 0 ? monthlyPayment / effectiveMonthlyRent : 0,
    incomeMultipleTax: annualIncomeTaxBase > 0 ? loanAmount / annualIncomeTaxBase : 0,
    incomeMultipleDeclared: annualIncomeDeclared > 0 ? loanAmount / annualIncomeDeclared : 0,
    repaymentRatioTax: annualIncomeTaxBase > 0 ? (totalMonthlyDebt * 12) / annualIncomeTaxBase : 0,
    repaymentRatioDeclared: annualIncomeDeclared > 0 ? (totalMonthlyDebt * 12) / annualIncomeDeclared : 0,
    breakevenRent,
    dscr,
  };

  return {
    input,
    loanAmount,
    initialInvestment,
    monthlyPayment,
    totalPayment,
    totalInterest,
    effectiveMonthlyRent,
    structurePrice: strPrice,
    equipmentPrice: eqPrice,
    annualStructureDep,
    annualEquipmentDep,
    annualDepreciation,
    amortization,
    depreciation: depRows,
    cashFlows,
    saleScenarios,
    taxDetail,
    ratios,
    banks: calcBankOptions(loanAmount),
  };
}

/** Default input for Pattern A */
export const DEFAULT_INPUT_A: SimInput = {
  propertyName: '物件A',
  propertyPrice: 25_000_000,
  propertyType: '区分マンション',
  location: '東京都',
  equity: 2_000_000,
  expenses: 800_000,
  rate: 0.02,
  termYears: 35,
  lender: '',
  monthlyRent: 90_000,
  managementFee: 5_000,
  repairFund: 3_000,
  otherExpenses: 2_000,
  vacancyRate: 0.05,
  managementType: 'shukkin',
  fixedAssetTax: 60_000,
  buildingRatio: 0.70,
  structurePrice: 0,
  equipmentPrice: 0,
  structureDepYears: 47,
  equipmentDepYears: 15,
  holdingYears: 20,
  growthRate: 0.005,
  annualIncomeTaxBase: 8_000_000,
  annualIncomeDeclared: 6_000_000,
};

export const DEFAULT_INPUT_B: SimInput = {
  propertyName: '物件B',
  propertyPrice: 35_000_000,
  propertyType: '区分マンション',
  location: '大阪市',
  equity: 5_000_000,
  expenses: 1_200_000,
  rate: 0.015,
  termYears: 35,
  lender: '',
  monthlyRent: 130_000,
  managementFee: 7_000,
  repairFund: 5_000,
  otherExpenses: 3_000,
  vacancyRate: 0.03,
  managementType: 'shukkin',
  fixedAssetTax: 90_000,
  buildingRatio: 0.75,
  structurePrice: 0,
  equipmentPrice: 0,
  structureDepYears: 47,
  equipmentDepYears: 15,
  holdingYears: 20,
  growthRate: 0.010,
  annualIncomeTaxBase: 8_000_000,
  annualIncomeDeclared: 6_000_000,
};
