import { AmortRow } from './types';

/** PMT formula: monthly payment for a fixed-rate loan */
export function calcPMT(annualRate: number, termYears: number, principal: number): number {
  if (annualRate === 0) return Math.floor(principal / (termYears * 12));
  const r = annualRate / 12;
  const n = termYears * 12;
  const pmt = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  return Math.floor(pmt);
}

/** Full amortization schedule */
export function calcAmortization(loan: number, annualRate: number, termYears: number): AmortRow[] {
  const rows: AmortRow[] = [];
  const r = annualRate / 12;
  const n = termYears * 12;
  const payment = calcPMT(annualRate, termYears, loan);
  let balance = loan;
  let cumInterest = 0;
  let cumPrincipal = 0;

  for (let i = 1; i <= n; i++) {
    const interest = Math.floor(balance * r);
    let principal = payment - interest;
    if (i === n) principal = balance; // last payment clears balance
    balance = Math.max(0, balance - principal);
    cumInterest += interest;
    cumPrincipal += principal;

    rows.push({
      no: i,
      year: Math.ceil(i / 12),
      month: ((i - 1) % 12) + 1,
      payment: i === n ? principal + interest : payment,
      interest,
      principal,
      balance,
      cumInterest,
      cumPrincipal,
    });
  }
  return rows;
}

/** Get balance at end of year Y (0-indexed: year 1 = after 12 payments) */
export function balanceAtYear(amort: AmortRow[], year: number): number {
  const idx = year * 12 - 1;
  if (idx < 0) return (amort[0]?.balance ?? 0) + (amort[0]?.principal ?? 0);
  if (idx >= amort.length) return 0;
  return amort[idx].balance;
}

/** Annual interest paid in year Y */
export function annualInterest(amort: AmortRow[], year: number): number {
  return amort
    .filter(r => r.year === year)
    .reduce((sum, r) => sum + r.interest, 0);
}

/** Bank comparison */
export function calcBankOptions(loanAmount: number): import('./types').BankOption[] {
  const banks = [
    { name: '住信SBIネット銀行', rate: 0.0032, type: '変動' as const, termYears: 35 },
    { name: 'auじぶん銀行',      rate: 0.00339, type: '変動' as const, termYears: 35 },
    { name: 'イオン銀行',        rate: 0.0038, type: '変動' as const, termYears: 35 },
    { name: 'みずほ銀行',        rate: 0.00375, type: '変動' as const, termYears: 35 },
    { name: 'フラット35',        rate: 0.0182, type: '固定' as const, termYears: 35 },
  ];
  return banks.map(b => {
    const monthly = calcPMT(b.rate, b.termYears, loanAmount);
    const total = monthly * b.termYears * 12;
    return { ...b, monthlyPayment: monthly, totalPayment: total, totalInterest: total - loanAmount };
  });
}
