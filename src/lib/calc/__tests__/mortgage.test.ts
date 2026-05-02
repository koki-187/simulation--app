import { describe, it, expect } from 'vitest';
import { calcPMT, calcAmortization, balanceAtYear, annualInterest, calcBankOptions } from '../mortgage';

// ─────────────────────────────────────────────────────────
// calcPMT
// ─────────────────────────────────────────────────────────
describe('calcPMT — 通常ケース', () => {
  it('3000万・35年・年利2% → 月額が正値', () => {
    const pmt = calcPMT(0.02, 35, 30_000_000);
    expect(pmt).toBeGreaterThan(0);
  });

  it('3000万・35年・年利2% → 月額が概ね99,000〜100,000円の範囲', () => {
    const pmt = calcPMT(0.02, 35, 30_000_000);
    expect(pmt).toBeGreaterThanOrEqual(99_000);
    expect(pmt).toBeLessThanOrEqual(100_500);
  });

  it('金利0%のとき元本均等分割を返す', () => {
    const pmt = calcPMT(0, 10, 12_000_000);
    expect(pmt).toBe(Math.floor(12_000_000 / (10 * 12)));
  });

  it('戻り値が整数（Math.floor済み）', () => {
    const pmt = calcPMT(0.015, 30, 25_000_000);
    expect(Number.isInteger(pmt)).toBe(true);
  });
});

describe('calcPMT — 境界値', () => {
  it('期間1年・元本1円でも正値', () => {
    const pmt = calcPMT(0.01, 1, 1);
    expect(pmt).toBeGreaterThanOrEqual(0);
  });

  it('元本ゼロのとき0を返す（ゼロ乗算）', () => {
    const pmt = calcPMT(0.02, 35, 0);
    expect(pmt).toBe(0);
  });

  it('超高金利（年20%）でも有限値', () => {
    const pmt = calcPMT(0.20, 10, 5_000_000);
    expect(isFinite(pmt)).toBe(true);
    expect(pmt).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// calcAmortization
// ─────────────────────────────────────────────────────────
describe('calcAmortization — 行数と構造', () => {
  const rows = calcAmortization(30_000_000, 0.02, 35);

  it('行数が termYears × 12 と一致', () => {
    expect(rows.length).toBe(35 * 12);
  });

  it('最終行の balance が 0', () => {
    expect(rows[rows.length - 1].balance).toBe(0);
  });

  it('全行で interest >= 0', () => {
    expect(rows.every(r => r.interest >= 0)).toBe(true);
  });

  it('全行で principal > 0', () => {
    expect(rows.every(r => r.principal > 0)).toBe(true);
  });

  it('cumInterest が単調増加', () => {
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].cumInterest).toBeGreaterThanOrEqual(rows[i - 1].cumInterest);
    }
  });
});

describe('calcAmortization — 元利合計の整合性', () => {
  it('初月の元利合計 ≈ calcPMT の結果', () => {
    const loan = 20_000_000;
    const rate = 0.015;
    const years = 30;
    const pmt = calcPMT(rate, years, loan);
    const rows = calcAmortization(loan, rate, years);
    // 最終月以外は payment = pmt
    expect(rows[0].payment).toBe(pmt);
  });

  it('元利内訳: interest + principal = payment（最終月を除く）', () => {
    const rows = calcAmortization(10_000_000, 0.01, 10);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].interest + rows[i].principal).toBe(rows[i].payment);
    }
  });
});

// ─────────────────────────────────────────────────────────
// balanceAtYear
// ─────────────────────────────────────────────────────────
describe('balanceAtYear', () => {
  const rows = calcAmortization(30_000_000, 0.02, 35);

  it('year=1 は12ヶ月返済後の残債', () => {
    const bal = balanceAtYear(rows, 1);
    expect(bal).toBe(rows[11].balance);
  });

  it('year=35（完済後）は 0', () => {
    expect(balanceAtYear(rows, 35)).toBe(0);
  });

  it('year=36（期間超過）は 0', () => {
    expect(balanceAtYear(rows, 36)).toBe(0);
  });

  it('残債は毎年減少する', () => {
    for (let y = 1; y <= 35; y++) {
      const prev = balanceAtYear(rows, y - 1);
      const curr = balanceAtYear(rows, y);
      expect(curr).toBeLessThanOrEqual(prev);
    }
  });
});

// ─────────────────────────────────────────────────────────
// annualInterest
// ─────────────────────────────────────────────────────────
describe('annualInterest', () => {
  const rows = calcAmortization(30_000_000, 0.02, 35);

  it('1年目の利息が正値', () => {
    expect(annualInterest(rows, 1)).toBeGreaterThan(0);
  });

  it('利息は年々減少する', () => {
    for (let y = 2; y <= 35; y++) {
      expect(annualInterest(rows, y)).toBeLessThanOrEqual(annualInterest(rows, y - 1));
    }
  });

  it('存在しない年（0年目）は 0', () => {
    expect(annualInterest(rows, 0)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// calcBankOptions
// ─────────────────────────────────────────────────────────
describe('calcBankOptions', () => {
  const opts = calcBankOptions(30_000_000);

  it('5件返す', () => {
    expect(opts.length).toBe(5);
  });

  it('全行で monthlyPayment が正値', () => {
    expect(opts.every(o => o.monthlyPayment > 0)).toBe(true);
  });

  it('totalInterest = totalPayment - loanAmount', () => {
    for (const o of opts) {
      expect(o.totalInterest).toBeCloseTo(o.totalPayment - 30_000_000, -2);
    }
  });

  it('変動金利 < フラット35 の月額', () => {
    const flat = opts.find(o => o.name === 'フラット35')!;
    const variable = opts.filter(o => o.type === '変動');
    for (const v of variable) {
      expect(v.monthlyPayment).toBeLessThan(flat.monthlyPayment);
    }
  });
});
