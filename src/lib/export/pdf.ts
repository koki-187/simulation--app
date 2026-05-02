import type { SimResult } from '@/lib/calc/types';
import { yen, pct, cagr } from '@/lib/format';

export async function exportPDF(resultA: SimResult, resultB: SimResult | null) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const NAVY: [number, number, number] = [28, 43, 74];
  const ORANGE: [number, number, number] = [232, 99, 42];
  const LIGHT: [number, number, number] = [238, 241, 246];

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MAS Real Estate Investment Simulation Report', 14, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  doc.text(`Generated: ${dateStr}`, 14, 17);

  let curY = 28;

  function sectionTitle(title: string) {
    doc.setFillColor(...ORANGE);
    doc.rect(14, curY, 4, 6, 'F');
    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, curY + 4.5);
    curY += 10;
  }

  function addTable(head: string[][], body: string[][], colWidths?: number[]) {
    autoTable(doc, {
      startY: curY,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: 14, right: 14 },
      columnStyles: colWidths ? Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }])) : {},
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── 1. Property Overview ─────────────────────────────────────────────────────
  sectionTitle('1. Property Overview / Funding Plan');
  const patterns = resultB ? ['Pattern A', 'Pattern B'] : ['Pattern A'];
  const results = resultB ? [resultA, resultB] : [resultA];

  const overviewHead = [['Item', ...patterns]];
  const fields: [string, (r: SimResult) => string][] = [
    ['Property Price', r => yen(r.input.propertyPrice)],
    ['Equity', r => yen(r.input.equity)],
    ['Misc. Costs', r => yen(r.input.expenses)],
    ['Loan Amount', r => yen(r.loanAmount)],
    ['Interest Rate', r => pct(r.input.rate)],
    ['Loan Term (yr)', r => `${r.input.termYears}yr`],
    ['Monthly Payment', r => yen(r.monthlyPayment)],
    ['Initial Investment', r => yen(r.initialInvestment)],
    ['Monthly Rent', r => yen(r.input.monthlyRent)],
    ['Vacancy Rate', r => pct(r.input.vacancyRate)],
    ['Holding Period', r => `${r.input.holdingYears}yr`],
  ];
  const overviewBody = fields.map(([label, fn]) => [label, ...results.map(fn)]);
  addTable(overviewHead, overviewBody);

  // ── 2. Cash Flow Summary ─────────────────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('2. Annual Cash Flow Summary (first 10 years)');
  const cfHead = resultB
    ? [['Year', 'A: Pre-tax CF', 'A: Tax', 'A: After-tax CF', 'B: Pre-tax CF', 'B: Tax', 'B: After-tax CF']]
    : [['Year', 'Pre-tax CF', 'Income Tax', 'After-tax CF', 'Cumulative CF']];

  const cfBody: string[][] = [];
  for (let y = 1; y <= 10; y++) {
    const cfA = resultA.cashFlows.find(r => r.year === y);
    if (!cfA) continue;
    if (resultB) {
      const cfB = resultB.cashFlows.find(r => r.year === y);
      cfBody.push([
        String(y),
        yen(cfA.preTaxCF), yen(cfA.incomeTax), yen(cfA.afterTaxCF),
        yen(cfB?.preTaxCF ?? 0), yen(cfB?.incomeTax ?? 0), yen(cfB?.afterTaxCF ?? 0),
      ]);
    } else {
      cfBody.push([String(y), yen(cfA.preTaxCF), yen(cfA.incomeTax), yen(cfA.afterTaxCF), yen(cfA.cumulativeCF)]);
    }
  }
  addTable(cfHead, cfBody);

  // ── 3. Sale Scenarios ────────────────────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('3. Sale Scenarios');
  const saleHead = [['Scenario', 'Sale Price', 'Loan Balance', 'Pre-tax Proceeds', 'CGT', 'Net Proceeds', 'CAGR']];
  for (const res of results) {
    if (results.length > 1) {
      doc.setTextColor(...ORANGE);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(res === resultA ? 'Pattern A' : 'Pattern B', 14, curY);
      curY += 5;
    }
    const saleBody = res.saleScenarios.map(s => [
      `${s.label} (${s.holdingYears}yr)`,
      yen(s.salePrice),
      yen(s.loanBalance),
      yen(s.preTaxProfit),
      yen(s.capitalGainsTax),
      yen(s.afterTaxProfit),
      cagr(s.cagr),
    ]);
    addTable(saleHead, saleBody);
  }

  // ── 4. Financial Ratios ───────────────────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('4. Financial Ratios & Health Check');
  const ratioHead = [['Indicator', 'Pattern A', resultB ? 'Pattern B' : '', 'Benchmark']];
  const ratioRows: [string, (r: SimResult) => string, string][] = [
    ['Income Mult. (tax-based)', r => r.ratios.incomeMultipleTax.toFixed(2) + 'x', '≤ 7.0x'],
    ['Repayment Ratio (tax)', r => pct(r.ratios.repaymentRatioTax), '≤ 25%'],
    ['Gross Yield', r => pct(r.ratios.grossYield), '≥ 4%'],
    ['Net Yield', r => pct(r.ratios.netYield), '≥ 2.5%'],
    ['DSCR (yr1)', r => r.ratios.dscr.toFixed(2) + 'x', '≥ 1.2x'],
    ['Breakeven Rent', r => yen(r.ratios.breakevenRent) + '/mo', '-'],
  ];
  const ratioBody = ratioRows.map(([label, fn, bench]) => [
    label,
    fn(resultA),
    resultB ? fn(resultB) : '',
    bench,
  ]);
  addTable(ratioHead, ratioBody);

  // ── Footer on each page ───────────────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, 287, pageW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('MAS - My Agent Simulation — 本資料は試算値であり、投資助言ではありません。', 14, 293);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 25, 293);
  }

  doc.save(`MAS_投資シミュレーション_${dateStr.replace(/\//g, '')}.pdf`);
}
