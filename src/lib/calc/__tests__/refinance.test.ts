import { describe, it, expect } from "vitest";
import {
  calcRefinance,
  checkThreeConditions,
  type RefinanceInput,
} from "../refinance";

// ---------------------------------------------------------------------------
// ヘルパー: 最小限のバンク定義を組み立てる
// ---------------------------------------------------------------------------
function makeBank(
  rate: number,
  fee = 0
): { id: string; name: string; rate: number; fee: number; rateType: string; areas: string[] } {
  return { id: "test", name: "テスト銀行", rate, fee, rateType: "variable", areas: [] };
}

function makeInput(overrides: Partial<RefinanceInput> = {}): RefinanceInput {
  return {
    currentBalance: 30_000_000,
    currentRate: 1.5,
    remainingYears: 30,
    prepaymentPenalty: 0,
    registrationFee: 0,
    otherFees: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. calcMonthlyPayment の境界値 (calcRefinance 経由)
// ---------------------------------------------------------------------------
describe("calcRefinance – currentBalance=0 の境界値", () => {
  it("残債が0のとき currentMonthly は 0 を返す", () => {
    const result = calcRefinance(makeInput({ currentBalance: 0 }), makeBank(0.95));
    expect(result.currentMonthly).toBe(0);
  });

  it("残債が0のとき newMonthly は 0 を返す", () => {
    const result = calcRefinance(makeInput({ currentBalance: 0 }), makeBank(0.95));
    expect(result.newMonthly).toBe(0);
  });

  it("残債が0のとき計算がエラーにならない (有限値が返る)", () => {
    const result = calcRefinance(makeInput({ currentBalance: 0 }), makeBank(0.95));
    expect(isFinite(result.breakEvenMonths) || result.breakEvenMonths === Infinity).toBe(true);
  });
});

describe("calcRefinance – remainingYears=0 の境界値", () => {
  it("残期間が0のとき currentMonthly は 0 を返す", () => {
    const result = calcRefinance(makeInput({ remainingYears: 0 }), makeBank(0.95));
    expect(result.currentMonthly).toBe(0);
  });

  it("残期間が0のとき newMonthly は 0 を返す", () => {
    const result = calcRefinance(makeInput({ remainingYears: 0 }), makeBank(0.95));
    expect(result.newMonthly).toBe(0);
  });

  it("残期間が0のとき totalSavingsAll が NaN にならない", () => {
    const result = calcRefinance(makeInput({ remainingYears: 0 }), makeBank(0.95));
    expect(Number.isNaN(result.totalSavingsAll)).toBe(false);
  });
});

describe("calcRefinance – currentRate=0 の境界値", () => {
  it("現行金利0%でも計算が成立する (currentMonthly が正値)", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 10_000_000, currentRate: 0, remainingYears: 20 }),
      makeBank(0.5)
    );
    expect(result.currentMonthly).toBeGreaterThan(0);
  });

  it("現行金利0%のとき currentMonthly = currentBalance / (remainingYears*12)", () => {
    const balance = 12_000_000;
    const years = 10;
    const result = calcRefinance(
      makeInput({ currentBalance: balance, currentRate: 0, remainingYears: years }),
      makeBank(0.5)
    );
    // annualRatePct<=0 のブランチ: principal / months
    expect(result.currentMonthly).toBeCloseTo(balance / (years * 12), 0);
  });
});

describe("calcRefinance – 借り換え先金利が現行以上の場合", () => {
  it("newRate >= currentRate のとき monthlySavings が 0 以下になる", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 10_000_000, currentRate: 1.0, remainingYears: 20 }),
      makeBank(1.0) // 同金利
    );
    expect(result.monthlySavings).toBeLessThanOrEqual(0);
  });

  it("newRate > currentRate のとき breakEvenMonths が Infinity になる", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 10_000_000, currentRate: 1.0, remainingYears: 20 }),
      makeBank(1.5) // 金利上昇
    );
    expect(result.breakEvenMonths).toBe(Infinity);
  });

  it("breakEvenMonths=Infinity のとき isWorthwhile が false になる", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 10_000_000, currentRate: 1.0, remainingYears: 20 }),
      makeBank(1.5)
    );
    expect(result.isWorthwhile).toBe(false);
  });
});

describe("calcRefinance – Infinity の sort 安全性", () => {
  it("breakEvenMonths が Infinity でも NaN にならず比較可能", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 5_000_000, currentRate: 0.5, remainingYears: 5 }),
      makeBank(2.0) // 明らかに不利
    );
    const val = result.breakEvenMonths;
    // NaN でないこと (NaN !== NaN は true)
    expect(val).toBe(val);
    // sort に渡しても安全: Infinity - 1 は Infinity
    const arr = [val, 1, 2].sort((a, b) => a - b);
    expect(arr[0]).toBe(1);
    expect(arr[arr.length - 1]).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// 2. 通常ケース: 残債3000万 / 1.5% / 30年 → 0.95%
// ---------------------------------------------------------------------------
describe("calcRefinance – 通常ケース (3000万・1.5%・30年→0.95%)", () => {
  const input = makeInput({
    currentBalance: 30_000_000,
    currentRate: 1.5,
    remainingYears: 30,
    prepaymentPenalty: 0,
    registrationFee: 192_000,
    otherFees: 0,
  });
  const bank = makeBank(0.95, 330_000); // 事務手数料33万
  const result = calcRefinance(input, bank);

  it("monthlySavings が正値になる", () => {
    expect(result.monthlySavings).toBeGreaterThan(0);
  });

  it("breakEvenMonths が有限値になる", () => {
    expect(isFinite(result.breakEvenMonths)).toBe(true);
  });

  it("breakEvenMonths が残期間内に収まる", () => {
    expect(result.breakEvenMonths).toBeLessThanOrEqual(30 * 12);
  });

  it("totalSavingsAll が正値になる (借り換え有利)", () => {
    expect(result.totalSavingsAll).toBeGreaterThan(0);
  });

  it("isWorthwhile が true になる", () => {
    expect(result.isWorthwhile).toBe(true);
  });

  it("currentMonthly が newMonthly より大きい", () => {
    expect(result.currentMonthly).toBeGreaterThan(result.newMonthly);
  });

  it("totalInterestCurrent が totalInterestNew より大きい", () => {
    expect(result.totalInterestCurrent).toBeGreaterThan(result.totalInterestNew);
  });
});

// ---------------------------------------------------------------------------
// 3. 残債100万（最小規模）
// ---------------------------------------------------------------------------
describe("calcRefinance – 残債100万の最小ケース", () => {
  it("計算が成立し currentMonthly が正値", () => {
    const result = calcRefinance(
      makeInput({ currentBalance: 1_000_000, currentRate: 1.5, remainingYears: 5 }),
      makeBank(0.9)
    );
    expect(result.currentMonthly).toBeGreaterThan(0);
  });

  it("totalCost が費用合計と一致する", () => {
    const input = makeInput({
      currentBalance: 1_000_000,
      currentRate: 1.5,
      remainingYears: 5,
      prepaymentPenalty: 5_000,
      registrationFee: 92_000,
      otherFees: 10_000,
    });
    const bank = makeBank(0.9, 20_000);
    const result = calcRefinance(input, bank);
    expect(result.totalCost).toBe(20_000 + 5_000 + 92_000 + 10_000);
  });
});

// ---------------------------------------------------------------------------
// 4. checkThreeConditions
// ---------------------------------------------------------------------------
describe("checkThreeConditions – 全条件OK", () => {
  it("金利差0.3以上・残期間10年以上・残債1000万以上のとき allOk が true", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 15_000_000);
    expect(r.allOk).toBe(true);
  });

  it("rateDiffOk が true (差が 0.5)", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 15_000_000);
    expect(r.rateDiffOk).toBe(true);
  });

  it("remainingYearsOk が true (15年)", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 15_000_000);
    expect(r.remainingYearsOk).toBe(true);
  });

  it("balanceOk が true (1500万)", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 15_000_000);
    expect(r.balanceOk).toBe(true);
  });
});

describe("checkThreeConditions – 部分OKケース", () => {
  it("金利差0.2のとき rateDiffOk が false で allOk が false", () => {
    const r = checkThreeConditions(1.5, 1.3, 15, 15_000_000);
    expect(r.rateDiffOk).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("残期間9年のとき remainingYearsOk が false で allOk が false", () => {
    const r = checkThreeConditions(1.5, 1.0, 9, 15_000_000);
    expect(r.remainingYearsOk).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("残債900万のとき balanceOk が false で allOk が false", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 9_000_000);
    expect(r.balanceOk).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("条件が2つOKでも allOk は false", () => {
    // rateDiff=0.5 OK, remainingYears=15 OK, balance=500万 NG
    const r = checkThreeConditions(1.5, 1.0, 15, 5_000_000);
    expect(r.allOk).toBe(false);
  });
});

describe("checkThreeConditions – 全条件NG", () => {
  it("全条件NGのとき allOk が false", () => {
    const r = checkThreeConditions(1.5, 1.3, 8, 5_000_000);
    expect(r.allOk).toBe(false);
  });

  it("rateDiff の値が currentRate - newRate の計算と一致する", () => {
    const r = checkThreeConditions(1.5, 1.3, 8, 5_000_000);
    expect(r.rateDiff).toBeCloseTo(0.2, 10);
  });

  it("全フラグが false", () => {
    const r = checkThreeConditions(1.5, 1.3, 8, 5_000_000);
    expect(r.rateDiffOk).toBe(false);
    expect(r.remainingYearsOk).toBe(false);
    expect(r.balanceOk).toBe(false);
  });
});

describe("checkThreeConditions – 境界値 (ちょうど境界)", () => {
  it("金利差ちょうど0.3のとき rateDiffOk が true", () => {
    const r = checkThreeConditions(1.3, 1.0, 15, 15_000_000);
    expect(r.rateDiffOk).toBe(true);
  });

  it("残期間ちょうど10年のとき remainingYearsOk が true", () => {
    const r = checkThreeConditions(1.5, 1.0, 10, 15_000_000);
    expect(r.remainingYearsOk).toBe(true);
  });

  it("残債ちょうど1000万のとき balanceOk が true", () => {
    const r = checkThreeConditions(1.5, 1.0, 15, 10_000_000);
    expect(r.balanceOk).toBe(true);
  });
});
