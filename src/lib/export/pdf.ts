import type { SimResult } from '@/lib/calc/types';
import { yen, pct, cagr } from '@/lib/format';

export async function exportPDF(resultA: SimResult, resultB: SimResult | null) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const NAVY: [number, number, number]   = [28,  43,  74];
  const ORANGE: [number, number, number] = [232, 99,  42];
  const LIGHT: [number, number, number]  = [238, 241, 246];

  // ── ヘッダーバー ───────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('MAS  不動産投資シミュレーション報告書', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  doc.text(`作成日: ${dateStr}`, 14, 19);
  // 注意書き（右寄せ）
  doc.setFontSize(6.5);
  doc.text('本資料は試算値であり、投資助言ではありません。', pageW - 14, 19, { align: 'right' });

  let curY = 30;

  // ── セクションタイトル描画ヘルパー ─────────────────────────────────────────
  function sectionTitle(title: string) {
    doc.setFillColor(...ORANGE);
    doc.rect(14, curY, 4, 6, 'F');
    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, curY + 4.5);
    curY += 10;
  }

  // ── テーブル描画ヘルパー ───────────────────────────────────────────────────
  function addTable(head: string[][], body: string[][], colWidths?: number[]) {
    autoTable(doc, {
      startY: curY,
      head,
      body,
      theme: 'grid',
      headStyles:         { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles:         { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: LIGHT },
      margin:             { left: 14, right: 14 },
      columnStyles: colWidths
        ? Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }]))
        : {},
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curY = (doc as any).lastAutoTable.finalY + 6;
  }

  const patterns = resultB ? ['パターンA', 'パターンB'] : ['パターンA'];
  const results  = resultB ? [resultA, resultB] : [resultA];

  // ── 1. 物件概要・資金計画 ─────────────────────────────────────────────────
  sectionTitle('1. 物件概要・資金計画');
  const overviewHead = [['項目', ...patterns]];
  const fields: [string, (r: SimResult) => string][] = [
    ['物件価格',         r => yen(r.input.propertyPrice)],
    ['自己資金（頭金）', r => yen(r.input.equity)],
    ['諸費用',           r => yen(r.input.expenses)],
    ['借入額',           r => yen(r.loanAmount)],
    ['金利（年）',       r => pct(r.input.rate)],
    ['返済期間',         r => `${r.input.termYears}年`],
    ['月額返済',         r => yen(r.monthlyPayment)],
    ['初期投資合計',     r => yen(r.initialInvestment)],
    ['家賃収入（月）',   r => yen(r.input.monthlyRent)],
    ['空室率',           r => pct(r.input.vacancyRate)],
    ['保有期間',         r => `${r.input.holdingYears}年`],
  ];
  const overviewBody = fields.map(([label, fn]) => [label, ...results.map(fn)]);
  addTable(overviewHead, overviewBody);

  // ── 2. 年次キャッシュフロー（前10年） ─────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('2. 年次キャッシュフロー（前10年）');
  const cfHead = resultB
    ? [['年', 'A: 税前CF', 'A: 税額', 'A: 税引後CF', 'B: 税前CF', 'B: 税額', 'B: 税引後CF']]
    : [['年', '税前CF', '所得税', '税引後CF', '累計CF']];

  const cfBody: string[][] = [];
  for (let y = 1; y <= 10; y++) {
    const cfA = resultA.cashFlows.find(r => r.year === y);
    if (!cfA) continue;
    if (resultB) {
      const cfB = resultB.cashFlows.find(r => r.year === y);
      cfBody.push([
        `${y}年`,
        yen(cfA.preTaxCF), yen(cfA.incomeTax), yen(cfA.afterTaxCF),
        yen(cfB?.preTaxCF ?? 0), yen(cfB?.incomeTax ?? 0), yen(cfB?.afterTaxCF ?? 0),
      ]);
    } else {
      cfBody.push([
        `${y}年`,
        yen(cfA.preTaxCF), yen(cfA.incomeTax), yen(cfA.afterTaxCF), yen(cfA.cumulativeCF),
      ]);
    }
  }
  addTable(cfHead, cfBody);

  // ── 3. 売却シナリオ分析 ────────────────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('3. 売却シナリオ分析');
  const saleHead = [['シナリオ', '売却価格', 'ローン残債', '税前手残り', '譲渡税', '税引後手残り', 'CAGR']];
  for (const res of results) {
    if (results.length > 1) {
      doc.setTextColor(...ORANGE);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(res === resultA ? 'パターンA' : 'パターンB', 14, curY);
      curY += 5;
    }
    const saleBody = res.saleScenarios.map(s => [
      `${s.label}（${s.holdingYears}年後）`,
      yen(s.salePrice),
      yen(s.loanBalance),
      yen(s.preTaxProfit),
      yen(s.capitalGainsTax),
      yen(s.afterTaxProfit),
      cagr(s.cagr),
    ]);
    addTable(saleHead, saleBody);
  }

  // ── 4. 財務指標・健全性チェック ────────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('4. 財務指標・健全性チェック');
  const ratioHead = [['指標', 'パターンA', resultB ? 'パターンB' : '', '目安']];
  const ratioRows: [string, (r: SimResult) => string, string][] = [
    ['年収倍率（源泉）',    r => r.ratios.incomeMultipleTax.toFixed(2) + 'x', '≤ 7.0x'],
    ['返済比率（源泉）',    r => pct(r.ratios.repaymentRatioTax),             '≤ 25%'],
    ['表面利回り',          r => pct(r.ratios.grossYield),                    '≥ 4%'],
    ['実質利回り',          r => pct(r.ratios.netYield),                      '≥ 2.5%'],
    ['DSCR（1年目）',       r => r.ratios.dscr.toFixed(2) + 'x',             '≥ 1.2x'],
    ['損益分岐賃料',        r => yen(r.ratios.breakevenRent) + '/月',         '—'],
  ];
  const ratioBody = ratioRows.map(([label, fn, bench]) => [
    label,
    fn(resultA),
    resultB ? fn(resultB) : '',
    bench,
  ]);
  addTable(ratioHead, ratioBody);

  // ── 5. 減価償却・税務明細（1年目） ─────────────────────────────────────────
  if (curY > 220) { doc.addPage(); curY = 20; }
  sectionTitle('5. 税務明細（1年目）');
  const taxHead = [['項目', 'パターンA', resultB ? 'パターンB' : '']];
  const taxRows: [string, (r: SimResult) => string][] = [
    ['家賃収入（年）',       r => yen(r.taxDetail.rentalRevenue)],
    ['管理費等（年）',       r => yen(r.taxDetail.managementExp)],
    ['修繕積立金（年）',     r => yen(r.taxDetail.repairExp)],
    ['火災保険概算（年）',   r => yen(r.taxDetail.insuranceEst)],
    ['固都税（年）',         r => yen(r.taxDetail.fixedAssetTax)],
    ['減価償却費（年）',     r => yen(r.taxDetail.depreciation)],
    ['ローン利息（年）',     r => yen(r.taxDetail.loanInterest)],
    ['不動産所得',           r => yen(r.taxDetail.realEstateIncome)],
    ['所得税（概算）',       r => yen(r.taxDetail.incomeTax)],
    ['住民税（概算）',       r => yen(r.taxDetail.residentTax)],
  ];
  const taxBody = taxRows.map(([label, fn]) => [label, fn(resultA), resultB ? fn(resultB) : '']);
  addTable(taxHead, taxBody);

  // ── 各ページのフッター ─────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, 287, pageW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('MAS - My Agent Simulation  |  本資料は試算値であり、投資助言ではありません。', 14, 293);
    doc.text(`${p} / ${totalPages}ページ`, pageW - 14, 293, { align: 'right' });
  }

  doc.save(`MAS_不動産投資シミュレーション_${dateStr.replace(/\//g, '')}.pdf`);
}
