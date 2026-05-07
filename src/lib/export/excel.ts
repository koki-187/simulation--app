'use client';

import type { SimResult } from '@/lib/calc/types';
import { pct, cagr } from '@/lib/format';

type RowData = (string | number)[];

/** ExcelJSを使ってブラウザからExcelファイルをダウンロード */
export async function exportExcel(resultA: SimResult, resultB: SimResult | null) {
  const ExcelJS = (await import('exceljs')).default;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MAS - My Agent Simuration';
  wb.created = new Date();

  const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '');
  const hasB = resultB !== null;

  /** シートを追加してデータを書き込む */
  function addSheet(name: string, data: RowData[]) {
    const ws = wb.addWorksheet(name);

    // 列幅を自動計算
    const colWidths: number[] = [];
    for (const row of data) {
      row.forEach((cell, ci) => {
        const len = String(cell ?? '').length + 2;
        colWidths[ci] = Math.max(colWidths[ci] ?? 10, len);
      });
    }
    ws.columns = colWidths.map(w => ({ width: w }));

    // 行を追加
    for (const row of data) {
      ws.addRow(row);
    }

    // ヘッダー行（1行目）をボールドに
    const header = ws.getRow(1);
    header.font = { bold: true };
    header.commit();
  }

  // ── Sheet 1: サマリー ──────────────────────────────────────────────────────
  const summaryData: RowData[] = [
    ['MAS - My Agent Simuration — サマリー'],
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
  addSheet('サマリー', summaryData);

  // ── Sheet 2: 収支_A ──────────────────────────────────────────────────────────
  const cfHeader: RowData = [
    '年', '家賃収入', '管理費等', '固都税', '運営CF', '年間返済', '利息', '税前CF',
    '減価償却', '課税所得', '所得税', '税引後CF', '累計CF', 'ローン残債',
  ];
  const cfRowsA: RowData[] = resultA.cashFlows.map(r => [
    r.year, r.rentalIncome, r.managementCosts, r.fixedAssetTax,
    r.operatingCF, r.annualLoanPayment, r.loanInterest, r.preTaxCF,
    r.depreciation, r.taxableIncome, r.incomeTax, r.afterTaxCF, r.cumulativeCF, r.loanBalance,
  ]);
  addSheet('収支_A', [cfHeader, ...cfRowsA]);

  if (hasB) {
    const cfRowsB: RowData[] = resultB!.cashFlows.map(r => [
      r.year, r.rentalIncome, r.managementCosts, r.fixedAssetTax,
      r.operatingCF, r.annualLoanPayment, r.loanInterest, r.preTaxCF,
      r.depreciation, r.taxableIncome, r.incomeTax, r.afterTaxCF, r.cumulativeCF, r.loanBalance,
    ]);
    addSheet('収支_B', [cfHeader, ...cfRowsB]);
  }

  // ── Sheet 3: 返済表_A ────────────────────────────────────────────────────────
  const amoHeader: RowData = ['月', '返済額', '利息', '元金', '残高'];
  const amoRowsA: RowData[] = resultA.amortization.slice(0, 420).map(r => [
    r.month, r.payment, r.interest, r.principal, r.balance,
  ]);
  addSheet('返済表_A', [amoHeader, ...amoRowsA]);

  if (hasB) {
    const amoRowsB: RowData[] = resultB!.amortization.slice(0, 420).map(r => [
      r.month, r.payment, r.interest, r.principal, r.balance,
    ]);
    addSheet('返済表_B', [amoHeader, ...amoRowsB]);
  }

  // ── Sheet 4: 売却シナリオ ────────────────────────────────────────────────────
  const saleHeader: RowData = [
    'シナリオ', '保有年数', '想定売却価格', 'ローン残債', '売却費用', '税引前手残り',
    '譲渡所得', '譲渡税', '税引後手残り', 'CAGR', '投資倍率',
  ];
  const makeSaleRows = (res: SimResult): RowData[] =>
    res.saleScenarios.map(s => [
      s.label, s.holdingYears, s.salePrice, s.loanBalance, s.sellingCosts,
      s.preTaxProfit, s.taxableGain, s.capitalGainsTax, s.afterTaxProfit,
      cagr(s.cagr), `${s.investmentMultiple.toFixed(2)}x`,
    ]);

  const saleData: RowData[] = [saleHeader, ['── Pattern A ──'], ...makeSaleRows(resultA)];
  if (hasB) saleData.push(['── Pattern B ──'], ...makeSaleRows(resultB!));
  addSheet('売却シナリオ', saleData);

  // ── Sheet 5: 税金 ────────────────────────────────────────────────────────────
  const tdA = resultA.taxDetail;
  const tdB = hasB ? resultB!.taxDetail : null;
  const taxData: RowData[] = [
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
    ['所得税（+復興特別所得税）', tdA.incomeTax, ...(hasB ? [tdB!.incomeTax] : [])],
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
  addSheet('税金', taxData);

  // ── ダウンロード ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAS_投資シミュレーション_${dateStr}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
