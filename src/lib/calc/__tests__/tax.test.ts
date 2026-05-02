import { describe, it, expect } from 'vitest';
import {
  calcIncomeTax,
  calcResidentTax,
  calcTotalTax,
  calcCapitalGainsTax,
  calcIncomeTaxRate,
  TAX_BRACKETS,
} from '../tax';

// ─────────────────────────────────────────────────────────
// calcIncomeTaxRate
// ─────────────────────────────────────────────────────────
describe('calcIncomeTaxRate — 税率テーブル', () => {
  it('195万以下 → 5%', () => {
    expect(calcIncomeTaxRate(1_950_000)).toBe(0.05);
    expect(calcIncomeTaxRate(1_000_000)).toBe(0.05);
  });

  it('330万以下 → 10%', () => {
    expect(calcIncomeTaxRate(2_000_000)).toBe(0.10);
    expect(calcIncomeTaxRate(3_300_000)).toBe(0.10);
  });

  it('695万以下 → 20%', () => {
    expect(calcIncomeTaxRate(5_000_000)).toBe(0.20);
  });

  it('900万以下 → 23%', () => {
    expect(calcIncomeTaxRate(8_000_000)).toBe(0.23);
  });

  it('1800万以下 → 33%', () => {
    expect(calcIncomeTaxRate(15_000_000)).toBe(0.33);
  });

  it('4000万以下 → 40%', () => {
    expect(calcIncomeTaxRate(30_000_000)).toBe(0.40);
  });

  it('4000万超 → 45%', () => {
    expect(calcIncomeTaxRate(50_000_000)).toBe(0.45);
  });
});

// ─────────────────────────────────────────────────────────
// calcIncomeTax
// ─────────────────────────────────────────────────────────
describe('calcIncomeTax — 所得税計算', () => {
  it('所得0以下のとき0を返す', () => {
    expect(calcIncomeTax(0)).toBe(0);
    expect(calcIncomeTax(-100_000)).toBe(0);
  });

  it('所得 195万 → 区分5%・復興税込み', () => {
    const tax = calcIncomeTax(1_950_000);
    // 1,950,000 × 5% × 1.021 = 99,547.5 → floor = 99,547
    expect(tax).toBe(Math.floor(1_950_000 * 0.05 * 1.021));
  });

  it('所得 200万（10%区分）の計算', () => {
    const tax = calcIncomeTax(2_000_000);
    // (200万 × 10% - 97,500) × 1.021 = 102,500 × 1.021 = 104,652.5 → 104,652
    expect(tax).toBe(Math.floor((2_000_000 * 0.10 - 97_500) * 1.021));
  });

  it('所得 800万（23%区分）の計算', () => {
    const tax = calcIncomeTax(8_000_000);
    const expected = Math.floor((8_000_000 * 0.23 - 636_000) * 1.021);
    expect(tax).toBe(expected);
  });

  it('戻り値が整数', () => {
    expect(Number.isInteger(calcIncomeTax(5_000_000))).toBe(true);
  });

  it('所得が増えると税額も増える（単調増加）', () => {
    const incomes = [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
    for (let i = 1; i < incomes.length; i++) {
      expect(calcIncomeTax(incomes[i])).toBeGreaterThan(calcIncomeTax(incomes[i - 1]));
    }
  });
});

// ─────────────────────────────────────────────────────────
// calcResidentTax
// ─────────────────────────────────────────────────────────
describe('calcResidentTax — 住民税計算', () => {
  it('所得0以下のとき0', () => {
    expect(calcResidentTax(0)).toBe(0);
    expect(calcResidentTax(-1)).toBe(0);
  });

  it('一律10%（フロア）', () => {
    expect(calcResidentTax(3_000_000)).toBe(Math.floor(3_000_000 * 0.10));
    expect(calcResidentTax(10_000_000)).toBe(Math.floor(10_000_000 * 0.10));
  });

  it('戻り値が整数', () => {
    expect(Number.isInteger(calcResidentTax(7_777_777))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// calcTotalTax
// ─────────────────────────────────────────────────────────
describe('calcTotalTax — 合計税額', () => {
  it('所得0以下のとき0', () => {
    expect(calcTotalTax(0)).toBe(0);
  });

  it('calcIncomeTax + calcResidentTax の合計と一致', () => {
    const income = 6_000_000;
    expect(calcTotalTax(income)).toBe(calcIncomeTax(income) + calcResidentTax(income));
  });

  it('100万・500万・1000万すべてで成立', () => {
    for (const inc of [1_000_000, 5_000_000, 10_000_000]) {
      expect(calcTotalTax(inc)).toBe(calcIncomeTax(inc) + calcResidentTax(inc));
    }
  });
});

// ─────────────────────────────────────────────────────────
// calcCapitalGainsTax
// ─────────────────────────────────────────────────────────
describe('calcCapitalGainsTax — 長期/短期', () => {
  it('保有5年超 → 長期税率 20.315%', () => {
    const { taxRate, isLongTerm } = calcCapitalGainsTax(50_000_000, 30_000_000, 5_000_000, 1_500_000, 10);
    expect(isLongTerm).toBe(true);
    expect(taxRate).toBe(0.20315);
  });

  it('保有5年以下 → 短期税率 39.63%', () => {
    const { taxRate, isLongTerm } = calcCapitalGainsTax(50_000_000, 30_000_000, 5_000_000, 1_500_000, 5);
    expect(isLongTerm).toBe(false);
    expect(taxRate).toBe(0.3963);
  });

  it('譲渡所得 = 売価 − (取得費−累計償却) − 売却費用', () => {
    const salePrice = 40_000_000;
    const acqCost = 30_000_000;
    const dep = 3_000_000;
    const sellCost = Math.floor(salePrice * 0.03);
    const { taxableGain } = calcCapitalGainsTax(salePrice, acqCost, dep, sellCost, 10);
    const expected = salePrice - (acqCost - dep) - sellCost;
    expect(taxableGain).toBe(Math.max(0, expected));
  });

  it('売価 < 取得費のとき譲渡所得は 0（マイナス不可）', () => {
    const { taxableGain, tax } = calcCapitalGainsTax(10_000_000, 30_000_000, 0, 300_000, 10);
    expect(taxableGain).toBe(0);
    expect(tax).toBe(0);
  });

  it('戻り税額 = floor(taxableGain × taxRate)', () => {
    const salePrice = 50_000_000;
    const acqCost = 30_000_000;
    const dep = 4_000_000;
    const sellCost = Math.floor(salePrice * 0.03);
    const { taxableGain, taxRate, tax } = calcCapitalGainsTax(salePrice, acqCost, dep, sellCost, 8);
    expect(tax).toBe(Math.floor(taxableGain * taxRate));
  });
});

// ─────────────────────────────────────────────────────────
// TAX_BRACKETS 構造確認
// ─────────────────────────────────────────────────────────
describe('TAX_BRACKETS — 定数構造', () => {
  it('7ブラケット存在', () => {
    expect(TAX_BRACKETS.length).toBe(7);
  });

  it('最後のブラケットの limit は Infinity', () => {
    expect(TAX_BRACKETS[TAX_BRACKETS.length - 1].limit).toBe(Infinity);
  });

  it('limit が昇順', () => {
    for (let i = 1; i < TAX_BRACKETS.length; i++) {
      expect(TAX_BRACKETS[i].limit).toBeGreaterThan(TAX_BRACKETS[i - 1].limit);
    }
  });
});
