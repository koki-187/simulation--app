'use client';

import type { SimResult } from '@/lib/calc/types';
import { pct, cagr } from '@/lib/format';

type WsData = (string | number)[][];

// Workaround: attach XLSX to the workbook object to pass it into addSheet
type XLSXModule = typeof import('xlsx');
type AugmentedWB = import('xlsx').WorkBook & { __XLSX__: XLSXModule };

function addSheet(wb: AugmentedWB, name: string, data: WsData) {
  const XLSX = wb.__XLSX__;
  const ws = XLSX.utils.aoa_to_sheet(data);
  const colW = data[0]?.map((_, ci) => ({
    wch: Math.max(10, ...data.map(r => String(r[ci] ?? '').length + 2)),
  }));
  if (colW) ws['!cols'] = colW;
  XLSX.utils.book_append_sheet(wb, ws, name);
}

export async function exportExcel(resultA: SimResult, resultB: SimResult | null) {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new() as AugmentedWB;
  wb.__XLSX__ = XLSX;

  const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '');
  const hasB = resultB !== null;

  // ── Sheet 1: サマリー ─────────────────────────────────────────────────────────
  const summaryData: WsData = [
    ['TERASS 不動産投資シミュレーター — サマリー'],
    ['作成日', new Date().toLocaleDateString('ja-JP')],
    [],
    ['項目', 'パターンA', ...(hasB ? ['パターンB'] : [])],
    ['物件価格', resultA.input.propertyPrice, ...(hasB ? [resultB!.input.propertyPrice] : [])],
    ['自己資金', resultA.input.equity, ...(hasB ? [resultB!.input.equity] : [])],
    ['諸費用', resultA.input.expenses, ...(hasB ? [resultB!.input.expenses] : [])],
    ['借入額', resultA.loanAmount, ...(hasB ? [resultB!.loanAmount] : [])],
    ['金利', pct(resultA.input.rate), ...(hasB ? [pct(resultB!.input.rate)] : [])],
    ['返済年数', `${resultA.input.termYears}年`, ...(hasB ? [`${resultB!.input.termYears}年`] : [])],
    ['月々返済額', resultA.monthlyPayment, ...(hasB ? [resultB!.monthlyPayment] : [])],
    ['初期投資合計', resultA.initialInvestment, ...(hasB ? [resultB!.initialInvestment] : [])],
    ['月額家賃', resultA.input.monthlyRent, ...(hasB ? [resultB!.input.monthlyRent] : [])],
    ['空室率', pct(resultA.input.vacancyRate), ...(hasB ? [pct(resultB!.input.vacancyRate)] : [])],
    ['保有年数', `${resultA.input.holdingYears}年`, ...(hasB ? [`${resultB!.input.holdingYears}年`] : [])],
    [],
    ['── 財務指標 ──'],
    ['表面利回り', pct(resultA.ratios.grossYield), ...(hasB ? [pct(resultB!.ratios.grossYield)] : [])],
    ['実質利回り', pct(resultA.ratios.netYield), ...(hasB ? [pct(resultB!.ratios.netYield)] : [])],
    ['年収倍率（源泉）', `${resultA.ratios.incomeMultipleTax.toFixed(2)}x`, ...(hasB ? [`${resultB!.ratios.incomeMultipleTax.toFixed(2)}x`] : [])],
    ['返済比率（源泉）', pct(resultA.ratios.repaymentRatioTax), ...(hasB ? [pct(resultB!.ratios.repaymentRatioTax)] : [])],
    ['DSCR (1年目)', `${resultA.ratios.dscr.toFixed(2)}x`, ...(hasB ? [`${resultB!.ratios.dscr.toFixed(2)}x`] : [])],
    ['損益分岐点賃料', resultA.ratios.breakevenRent, ...(hasB ? [resultB!.ratios.breakevenRent] : [])],
  ];
  addSheet(wb, 'サマリー', summaryData);

  // ── Sheet 2: 収支_A ───────────────────────────────────────────────────────────
  const cfHeader: WsData = [
    ['年', '家賃収入', '管理費等', '固都税', '運営CF', '年間返済', '利息', '税前CF', '減価償却', '課税所得', '所得税', '税引後CF', '累計CF', 'ローン残債'],
  ];
  const cfRowsA: WsData = resultA.cashFlows.map(r => [
    r.year, r.rentalIncome, r.managementCosts, r.fixedAssetTax,
    r.operatingCF, r.annualLoanPayment, r.loanInterest, r.preTaxCF,
    r.depreciation, r.taxableIncome, r.incomeTax, r.afterTaxCF, r.cumulativeCF, r.loanBalance,
  ]);
  addSheet(wb, '収支_A', [...cfHeader, ...cfRowsA]);

  if (hasB) {
    const cfRowsB: WsData = resultB!.cashFlows.map(r => [
      r.year, r.rentalIncome, r.managementCosts, r.fixedAssetTax,
      r.operatingCF, r.annualLoanPayment, r.loanInterest, r.preTaxCF,
      r.depreciation, r.taxableIncome, r.incomeTax, r.afterTaxCF, r.cumulativeCF, r.loanBalance,
    ]);
    addSheet(wb, '収支_B', [...cfHeader, ...cfRowsB]);
  }

  // ── Sheet 3: 返済表_A ─────────────────────────────────────────────────────────
  const amoHeader: WsData = [['月', '返済額', '利息', '元金', '残高']];
  const amoRowsA: WsData = resultA.amortization.slice(0, 420).map(r => [
    r.month, r.payment, r.interest, r.principal, r.balance,
  ]);
  addSheet(wb, '返済表_A', [...amoHeader, ...amoRowsA]);

  if (hasB) {
    const amoRowsB: WsData = resultB!.amortization.slice(0, 420).map(r => [
      r.month, r.payment, r.interest, r.principal, r.balance,
    ]);
    addSheet(wb, '返済表_B', [...amoHeader, ...amoRowsB]);
  }

  // ── Sheet 4: 売却シナリオ ─────────────────────────────────────────────────────
  const saleHeader: WsData = [[
    'シナリオ', '保有年数', '想定売却価格', 'ローン残債', '売却費用', '税引前手残り',
    '譲渡所得', '譲渡税', '税引後手残り', 'CAGR', '投資倍率',
  ]];
  const makeSaleRows = (res: SimResult): WsData =>
    res.saleScenarios.map(s => [
      s.label, s.holdingYears, s.salePrice, s.loanBalance, s.sellingCosts,
      s.preTaxProfit, s.taxableGain, s.capitalGainsTax, s.afterTaxProfit,
      cagr(s.cagr), `${s.investmentMultiple.toFixed(2)}x`,
    ]);

  const saleData: WsData = [...saleHeader, ['── Pattern A ──'], ...makeSaleRows(resultA)];
  if (hasB) saleData.push(['── Pattern B ──'], ...makeSaleRows(resultB!));
  addSheet(wb, '売却シナリオ', saleData);

  // ── Sheet 5: 税金 ─────────────────────────────────────────────────────────────
  const tdA = resultA.taxDetail;
  const tdB = hasB ? resultB!.taxDetail : null;
  const taxData: WsData = [
    ['所得税・譲渡税詳細', 'パターンA', ...(hasB ? ['パターンB'] : [])],
    ['── 不動産所得（1年目概算）──'],
    ['家賃収入', tdA.rentalRevenue, ...(hasB ? [tdB!.rentalRevenue] : [])],
    ['管理費等', tdA.managementExp, ...(hasB ? [tdB!.managementExp] : [])],
    ['修繕積立金', tdA.repairExp, ...(hasB ? [tdB!.repairExp] : [])],
    ['固都税概算', tdA.fixedAssetTax, ...(hasB ? [tdB!.fixedAssetTax] : [])],
    ['減価償却費', tdA.depreciation, ...(hasB ? [tdB!.depreciation] : [])],
    ['ローン利息', tdA.loanInterest, ...(hasB ? [tdB!.loanInterest] : [])],
    ['不動産所得', tdA.realEstateIncome, ...(hasB ? [tdB!.realEstateIncome] : [])],
    ['所得税率', pct(tdA.incomeTaxRate), ...(hasB ? [pct(tdB!.incomeTaxRate)] : [])],
    ['所得税', tdA.incomeTax, ...(hasB ? [tdB!.incomeTax] : [])],
    ['住民税', tdA.residentTax, ...(hasB ? [tdB!.residentTax] : [])],
    ['税負担合計', tdA.totalTaxBurden, ...(hasB ? [tdB!.totalTaxBurden] : [])],
    [],
    ['── 売却時譲渡税 ──'],
    ['保有年数', tdA.holdingYears, ...(hasB ? [tdB!.holdingYears] : [])],
    ['長期/短期', tdA.isLongTerm ? '長期(5年超)' : '短期(5年以内)', ...(hasB ? [tdB!.isLongTerm ? '長期(5年超)' : '短期(5年以内)'] : [])],
    ['税率', pct(tdA.taxRate), ...(hasB ? [pct(tdB!.taxRate)] : [])],
    ['売却価格', tdA.salePrice, ...(hasB ? [tdB!.salePrice] : [])],
    ['取得費', tdA.acquisitionCost, ...(hasB ? [tdB!.acquisitionCost] : [])],
    ['累計減価償却', tdA.accumulatedDep, ...(hasB ? [tdB!.accumulatedDep] : [])],
    ['売却費用', tdA.sellingCosts, ...(hasB ? [tdB!.sellingCosts] : [])],
    ['課税譲渡所得', tdA.taxableGain, ...(hasB ? [tdB!.taxableGain] : [])],
    ['譲渡所得税', tdA.capitalGainsTax, ...(hasB ? [tdB!.capitalGainsTax] : [])],
  ];
  addSheet(wb, '税金', taxData);

  XLSX.writeFile(wb, `TERASS_投資シミュレーション_${dateStr}.xlsx`);
}
