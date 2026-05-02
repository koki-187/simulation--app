import { describe, it, expect } from 'vitest';
import { simulate, DEFAULT_INPUT_A, DEFAULT_INPUT_B } from '../simulate';
import type { SimInput } from '../types';

// ─────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────
function makeInput(overrides: Partial<SimInput> = {}): SimInput {
  return { ...DEFAULT_INPUT_A, ...overrides };
}

// ─────────────────────────────────────────────────────────
// 1. 基本構造と戻り値の整合性
// ─────────────────────────────────────────────────────────
describe('simulate — 基本構造', () => {
  const res = simulate(DEFAULT_INPUT_A);

  it('loanAmount = propertyPrice - equity', () => {
    expect(res.loanAmount).toBe(DEFAULT_INPUT_A.propertyPrice - DEFAULT_INPUT_A.equity);
  });

  it('initialInvestment = equity + expenses', () => {
    expect(res.initialInvestment).toBe(DEFAULT_INPUT_A.equity + DEFAULT_INPUT_A.expenses);
  });

  it('amortization の行数は termYears × 12', () => {
    expect(res.amortization.length).toBe(DEFAULT_INPUT_A.termYears * 12);
  });

  it('saleScenarios は 3 件（悲観・標準・楽観）', () => {
    expect(res.saleScenarios.length).toBe(3);
  });

  it('saleScenarios[0].multiplier = 0.9（悲観）', () => {
    expect(res.saleScenarios[0].multiplier).toBe(0.9);
  });

  it('saleScenarios[1].multiplier = 1.0（標準）', () => {
    expect(res.saleScenarios[1].multiplier).toBe(1.0);
  });

  it('saleScenarios[2].multiplier = 1.1（楽観）', () => {
    expect(res.saleScenarios[2].multiplier).toBe(1.1);
  });

  it('banks は 5 件', () => {
    expect(res.banks.length).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────
// 2. taxDetail.repairExp の修正確認（Bug #2）
// ─────────────────────────────────────────────────────────
describe('simulate — taxDetail.repairExp 修正確認', () => {
  it('repairExp = repairFund × 12（0でない）', () => {
    const res = simulate(makeInput({ repairFund: 5_000 }));
    expect(res.taxDetail.repairExp).toBe(5_000 * 12);
  });

  it('repairFund = 0 のとき repairExp = 0', () => {
    const res = simulate(makeInput({ repairFund: 0 }));
    expect(res.taxDetail.repairExp).toBe(0);
  });

  it('managementExp = (managementFee + otherExpenses) × 12（修繕を除く）', () => {
    const input = makeInput({ managementFee: 8_000, repairFund: 3_000, otherExpenses: 2_000 });
    const res = simulate(input);
    expect(res.taxDetail.managementExp).toBe((8_000 + 2_000) * 12);
  });

  it('totalExpenses の合計が正しい', () => {
    const input = makeInput({ managementFee: 5_000, repairFund: 3_000, otherExpenses: 2_000 });
    const res = simulate(input);
    const { managementExp, repairExp, insuranceEst, fixedAssetTax, depreciation, loanInterest } = res.taxDetail;
    expect(res.taxDetail.totalExpenses).toBe(
      managementExp + repairExp + insuranceEst + fixedAssetTax + depreciation + loanInterest
    );
  });
});

// ─────────────────────────────────────────────────────────
// 3. キャッシュフロー
// ─────────────────────────────────────────────────────────
describe('simulate — cashFlows', () => {
  const res = simulate(DEFAULT_INPUT_A);

  it('返済期間中は annualLoanPayment > 0', () => {
    const term = DEFAULT_INPUT_A.termYears;
    for (let y = 1; y <= term; y++) {
      const cf = res.cashFlows.find(r => r.year === y)!;
      expect(cf.annualLoanPayment).toBeGreaterThan(0);
    }
  });

  it('返済完了後（termYears + 1年目）は annualLoanPayment = 0', () => {
    const term = DEFAULT_INPUT_A.termYears;
    const cf = res.cashFlows.find(r => r.year === term + 1);
    if (cf) expect(cf.annualLoanPayment).toBe(0);
  });

  it('rentalIncome = effectiveMonthlyRent × 12', () => {
    const cf1 = res.cashFlows[0];
    expect(cf1.rentalIncome).toBe(res.effectiveMonthlyRent * 12);
  });

  it('cumulativeCF は前年より増加（正CF時）または前年に加算', () => {
    // 累計CFは afterTaxCFの累積
    let cum = 0;
    for (const cf of res.cashFlows) {
      cum += cf.afterTaxCF;
      expect(cf.cumulativeCF).toBeCloseTo(cum, 0);
    }
  });
});

// ─────────────────────────────────────────────────────────
// 4. 利回り計算
// ─────────────────────────────────────────────────────────
describe('simulate — ratios', () => {
  const res = simulate(DEFAULT_INPUT_A);

  it('grossYield = monthlyRent × 12 / propertyPrice', () => {
    const expected = (DEFAULT_INPUT_A.monthlyRent * 12) / DEFAULT_INPUT_A.propertyPrice;
    expect(res.ratios.grossYield).toBeCloseTo(expected, 10);
  });

  it('grossYield > netYield（費用控除後は下がる）', () => {
    expect(res.ratios.grossYield).toBeGreaterThan(res.ratios.netYield);
  });

  it('DSCR = operatingCF / annualDebtService', () => {
    const opCF = res.cashFlows[0].operatingCF;
    const debt = res.monthlyPayment * 12;
    expect(res.ratios.dscr).toBeCloseTo(opCF / debt, 5);
  });

  it('breakevenRent が monthlyRent 前後に収まる', () => {
    // デフォルト入力では損益分岐賃料は家賃収入に近い
    expect(res.ratios.breakevenRent).toBeGreaterThan(0);
    expect(res.ratios.breakevenRent).toBeLessThan(DEFAULT_INPUT_A.monthlyRent * 3);
  });
});

// ─────────────────────────────────────────────────────────
// 5. 売却シナリオ
// ─────────────────────────────────────────────────────────
describe('simulate — saleScenarios', () => {
  const res = simulate(DEFAULT_INPUT_A);

  it('楽観シナリオ売価 > 標準 > 悲観', () => {
    const [pessimistic, standard, optimistic] = res.saleScenarios;
    expect(optimistic.salePrice).toBeGreaterThan(standard.salePrice);
    expect(standard.salePrice).toBeGreaterThan(pessimistic.salePrice);
  });

  it('sellingCosts ≈ salePrice × 3%', () => {
    for (const s of res.saleScenarios) {
      expect(s.sellingCosts).toBe(Math.floor(s.salePrice * 0.03));
    }
  });

  it('afterTaxProfit = preTaxProfit - capitalGainsTax', () => {
    for (const s of res.saleScenarios) {
      expect(s.afterTaxProfit).toBe(s.preTaxProfit - s.capitalGainsTax);
    }
  });

  it('holdingYears > 5 → 長期税率 20.315%', () => {
    const res20yr = simulate(makeInput({ holdingYears: 20 }));
    expect(res20yr.taxDetail.taxRate).toBe(0.20315);
    expect(res20yr.taxDetail.isLongTerm).toBe(true);
  });

  it('holdingYears = 5 → 短期税率 39.63%', () => {
    const res5yr = simulate(makeInput({ holdingYears: 5 }));
    expect(res5yr.taxDetail.taxRate).toBe(0.3963);
    expect(res5yr.taxDetail.isLongTerm).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// 6. 減価償却
// ─────────────────────────────────────────────────────────
describe('simulate — 減価償却', () => {
  const res = simulate(DEFAULT_INPUT_A);

  it('annualDepreciation = annualStructureDep + annualEquipmentDep', () => {
    expect(res.annualDepreciation).toBe(res.annualStructureDep + res.annualEquipmentDep);
  });

  it('減価償却費が正値', () => {
    expect(res.annualDepreciation).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// 7. 損益通算（Bug #2 関連: repairExpが正しくなった後の税計算）
// ─────────────────────────────────────────────────────────
describe('simulate — 損益通算', () => {
  it('不動産所得が赤字のとき hasLoss = true', () => {
    // 高い金利・低い家賃で赤字にする
    const res = simulate(makeInput({
      monthlyRent: 30_000,
      rate: 0.04,
      managementFee: 15_000,
      repairFund: 5_000,
    }));
    if (res.taxDetail.realEstateIncome < 0) {
      expect(res.taxDetail.hasLoss).toBe(true);
    }
  });

  it('annualIncomeTaxBase = 0 のとき estimatedTaxRefund = 0', () => {
    const res = simulate(makeInput({ annualIncomeTaxBase: 0 }));
    expect(res.taxDetail.estimatedTaxRefund).toBe(0);
  });

  it('estimatedTaxRefund は常に 0 以上', () => {
    const res = simulate(DEFAULT_INPUT_A);
    expect(res.taxDetail.estimatedTaxRefund).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────
// 8. Pattern A / B デフォルト値の基本健全性
// ─────────────────────────────────────────────────────────
describe('DEFAULT_INPUT_A / B — 基本健全性', () => {
  it('Pattern A: シミュレーション結果が有限値', () => {
    const res = simulate(DEFAULT_INPUT_A);
    expect(isFinite(res.monthlyPayment)).toBe(true);
    expect(isFinite(res.totalInterest)).toBe(true);
    expect(isFinite(res.ratios.grossYield)).toBe(true);
  });

  it('Pattern B: シミュレーション結果が有限値', () => {
    const res = simulate(DEFAULT_INPUT_B);
    expect(isFinite(res.monthlyPayment)).toBe(true);
    expect(isFinite(res.totalInterest)).toBe(true);
    expect(isFinite(res.ratios.grossYield)).toBe(true);
  });

  it('Pattern A の grossYield が 4% 以上（デフォルト東京物件）', () => {
    const res = simulate(DEFAULT_INPUT_A);
    expect(res.ratios.grossYield).toBeGreaterThanOrEqual(0.04);
  });
});

// ─────────────────────────────────────────────────────────
// 9. 境界値・エッジケース
// ─────────────────────────────────────────────────────────
describe('simulate — 境界値・エッジケース', () => {
  it('vacancyRate = 0 のとき effectiveMonthlyRent = monthlyRent', () => {
    const input = makeInput({ vacancyRate: 0, monthlyRent: 100_000 });
    const res = simulate(input);
    expect(res.effectiveMonthlyRent).toBe(100_000);
  });

  it('vacancyRate = 0.99 のとき effectiveMonthlyRent がほぼ 0', () => {
    const input = makeInput({ vacancyRate: 0.99, monthlyRent: 100_000 });
    const res = simulate(input);
    expect(res.effectiveMonthlyRent).toBe(Math.floor(100_000 * 0.01));
  });

  it('growthRate = 0 のとき標準売価 = propertyPrice（成長なし）', () => {
    const input = makeInput({ growthRate: 0, holdingYears: 20 });
    const res = simulate(input);
    // growthRate=0: baseSale = propertyPrice × (1+0)^20 = propertyPrice
    expect(res.saleScenarios[1].salePrice).toBe(input.propertyPrice);
  });

  it('growthRate 負値（資産価値下落）でも計算クラッシュなし', () => {
    const input = makeInput({ growthRate: -0.03, holdingYears: 20 });
    const res = simulate(input);
    expect(isFinite(res.saleScenarios[1].salePrice)).toBe(true);
    expect(res.saleScenarios[1].salePrice).toBeGreaterThanOrEqual(0);
  });
});
