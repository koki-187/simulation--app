/**
 * MAS PDF — Monochrome Design System  v2.0
 * ─────────────────────────────────────────
 * Philosophy: "派手さよりも上質、装飾よりも余白、色よりも階層"
 * Inspired by architectural journals and top-tier financial reports.
 *
 * COLOR PALETTE (pure monotone — NO chroma allowed)
 *   #000000  Black   — text, borders, headers, bars
 *   #888888  Gray    — secondary text, muted labels, sub-bars
 *   #F7F7F7  Light   — card backgrounds, alternate rows
 *   #FFFFFF  White   — primary background
 *
 * TYPOGRAPHY
 *   EN : Inter  (weight 200 / 300 / 400 / 500 / 600)
 *   JA : Noto Sans JP (weight 300 / 400 / 500)
 *   NO serif, NO Garamond, NO Cormorant — Gothic only.
 *   letter-spacing: generous (0.1–0.4em for labels, 0.04em for body)
 *
 * LAYOUT
 *   A4 portrait  : 794 × 1123 px  padding 91px / 83px  (24mm / 22mm)
 *   A4 landscape : 1122 × 794 px  padding 83px / 91px
 *   Content is LEFT-ALIGNED, not centered.
 *   One theme per page. Large whitespace. Data is not packed.
 *
 * SECTION HEADING (3-layer, always in this order)
 *   1. English title  — Inter 30px weight 200  letter-spacing 0.04em
 *   2. Japanese title — Noto 13px weight 500   letter-spacing 0.35em
 *   3. Black underline — 32px wide × 2px tall
 *
 * KPI BLOCK
 *   top + bottom 2px solid #000, 3-column grid
 *   label: 9px uppercase letter-spacing 0.18em gray
 *   value: Inter 26px weight 200
 *   sub  : 10px gray
 *
 * TABLES
 *   header row : background #000, color #fff, uppercase small-caps style
 *   body rows  : alternate #fff / #F7F7F7
 *   highlight  : background #000, color #fff (best scenario, totals)
 *
 * PROPERTY CARD
 *   background #F7F7F7, left border 3px solid #000
 *
 * COVER PAGE
 *   background #000, 48px grid overlay (white 3% opacity)
 *   L-corner marks (white 30% opacity, 28px legs)
 *   title 40px Inter weight 300 white
 */

import { SimResult, CFRow, AmortRow } from '@/lib/calc/types';
import { cashflowBarChartSvg } from './chartSvg';

// ── Palette ──────────────────────────────────────────────────────────────────
const BLACK = '#000000';
const GRAY  = '#888888';
const LIGHT = '#F7F7F7';
const WHITE = '#FFFFFF';

// ── Font stacks ──────────────────────────────────────────────────────────────
const F_EN = "Inter, 'Helvetica Neue', Arial, sans-serif";
const F_JA = "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif";
const F    = `${F_EN}, ${F_JA}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** XSS guard */
function esc(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** ¥X,XXX,XXX */
function fmt(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

/** X.X万円 */
function fmtM(n: number): string {
  const man = Math.round(n) / 10000;
  if (man >= 10000) return `${(man / 10000).toFixed(2)}億円`;
  if (man >= 1000)  return `${(man / 1000).toFixed(2)}千万円`;
  return `${man.toFixed(1)}万円`;
}

/** Today in ja-JP */
function today(): string {
  return new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── 48px grid SVG overlay (for cover) ────────────────────────────────────────
function gridOverlay(w: number, h: number): string {
  const step = 48;
  const lines: string[] = [];
  for (let x = step; x < w; x += step) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="white" stroke-width="0.5"/>`);
  }
  for (let y = step; y < h; y += step) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="white" stroke-width="0.5"/>`);
  }
  return `<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.03;"
    viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
    >${lines.join('')}</svg>`;
}

/** L-corner marks */
function cornerMarks(leg = 28): string {
  const s = `background:rgba(255,255,255,0.30)`;
  const pos = [
    { top: '20px', left: '20px',  borderTop: `1px solid rgba(255,255,255,0.35)`, borderLeft: `1px solid rgba(255,255,255,0.35)` },
    { top: '20px', right: '20px', borderTop: `1px solid rgba(255,255,255,0.35)`, borderRight: `1px solid rgba(255,255,255,0.35)` },
    { bottom: '20px', left: '20px',  borderBottom: `1px solid rgba(255,255,255,0.35)`, borderLeft: `1px solid rgba(255,255,255,0.35)` },
    { bottom: '20px', right: '20px', borderBottom: `1px solid rgba(255,255,255,0.35)`, borderRight: `1px solid rgba(255,255,255,0.35)` },
  ];
  return pos.map(p => {
    const styleObj = Object.entries(p).map(([k, v]) => `${k}:${v}`).join(';');
    return `<div style="position:absolute;${styleObj};width:${leg}px;height:${leg}px;"></div>`;
  }).join('');
}

// ── Shared page components ────────────────────────────────────────────────────

/** Top strip: MAS logotype + property + date */
function pageHeader(propertyName: string, patternLabel: string): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;
      padding-bottom:10px;border-bottom:1px solid ${BLACK};margin-bottom:32px;">
      <div style="font-family:${F_EN};font-size:12px;font-weight:600;
        letter-spacing:0.45em;color:${BLACK};">MAS</div>
      <div style="font-size:9px;color:${GRAY};letter-spacing:0.12em;text-align:center;">
        ${esc(propertyName)}&ensp;/&ensp;${esc(patternLabel)}
      </div>
      <div style="font-size:9px;color:${GRAY};letter-spacing:0.08em;">${today()}</div>
    </div>
  `;
}

/** 3-layer section heading */
function sectionHeading(enTitle: string, jaTitle: string): string {
  return `
    <div style="margin-bottom:28px;">
      <div style="font-family:${F_EN};font-size:30px;font-weight:400;
        color:${BLACK};letter-spacing:0.04em;line-height:1;">${enTitle}</div>
      <div style="font-family:${F_JA};font-size:13px;font-weight:500;
        color:${BLACK};letter-spacing:0.35em;margin-top:8px;">${jaTitle}</div>
      <div style="width:32px;height:2px;background:${BLACK};margin-top:12px;"></div>
    </div>
  `;
}

/** KPI block — top+bottom 2px black border, 3-col grid */
function kpiBlock(items: { enLabel: string; value: string; sub: string }[]): string {
  const cols = items.slice(0, 3);  // max 3 per row
  const cells = cols.map((item, i) => `
    <div style="padding:0 ${i < cols.length - 1 ? '24px' : '0'} 0 ${i > 0 ? '24px' : '0'};
      ${i < cols.length - 1 ? `border-right:1px solid ${LIGHT};` : ''}">
      <div style="font-family:${F_EN};font-size:9px;font-weight:500;
        letter-spacing:0.18em;color:${GRAY};text-transform:uppercase;line-height:1;">${item.enLabel}</div>
      <div style="font-family:${F_EN};font-size:26px;font-weight:200;
        color:${BLACK};margin-top:8px;line-height:1;letter-spacing:-0.01em;">${item.value}</div>
      <div style="font-size:10px;color:${GRAY};margin-top:6px;font-family:${F_JA};">${item.sub}</div>
    </div>
  `).join('');
  return `
    <div style="border-top:2px solid ${BLACK};border-bottom:2px solid ${BLACK};
      padding:20px 0;display:grid;grid-template-columns:repeat(${cols.length},1fr);
      gap:0;margin-bottom:32px;">
      ${cells}
    </div>
  `;
}

/** Table TH */
function th(text: string, align: 'left' | 'right' | 'center' = 'right', width?: string): string {
  return `<th style="padding:9px 12px;border-right:1px solid rgba(255,255,255,0.18);border-bottom:2px solid rgba(255,255,255,0.08);text-align:${align};
    font-family:${F_EN};font-size:9px;font-weight:600;letter-spacing:0.14em;
    text-transform:uppercase;${width ? `width:${width};` : ''}">${text}</th>`;
}

/** Table TD — normal row */
function td(content: string, align: 'left' | 'right' | 'center' = 'right', extra = ''): string {
  return `<td style="padding:8px 12px;border-bottom:1px solid rgba(0,0,0,0.09);border-right:1px solid rgba(0,0,0,0.06);
    text-align:${align};font-size:11px;${extra}">${content}</td>`;
}

/** Table TD — highlight row (black bg white text) */
function tdHL(content: string, align: 'left' | 'right' | 'center' = 'right', extra = ''): string {
  return `<td style="padding:8px 12px;border:1px solid ${BLACK};
    text-align:${align};font-size:11px;color:${WHITE};${extra}">${content}</td>`;
}

/** Page footer */
function pageFooter(): string {
  return `
    <div style="margin-top:24px;border-top:1px solid ${GRAY};padding-top:8px;
      display:flex;justify-content:space-between;align-items:center;">
      <div style="font-family:${F_EN};font-size:8px;color:${GRAY};letter-spacing:0.18em;">
        MAS — MY AGENT SIMULATION
      </div>
      <div style="font-size:8px;color:${GRAY};">
        ※本資料は試算概算値であり、投資助言ではありません。実際の数値は専門家にご相談ください。
      </div>
    </div>
  `;
}

// ── Page wrapper ─────────────────────────────────────────────────────────────

function pageWrap(content: string, orientation: 'portrait' | 'landscape' = 'portrait'): string {
  const isLand = orientation === 'landscape';
  const pV = 91, pH = 83;  // vertical / horizontal padding px
  return `
    <div style="font-family:${F};background:${WHITE};
      width:${isLand ? 1122 : 794}px;min-height:${isLand ? 794 : 1123}px;
      padding:${pV}px ${pH}px;box-sizing:border-box;position:relative;color:${BLACK};">
      ${content}
    </div>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COVER PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function coverHtml(result: SimResult, patternLabel: string): string {
  const input      = result.input;
  const loanAmount = result.loanAmount;
  const grossYield = (result.ratios.grossYield * 100).toFixed(2);
  const netYield   = (result.ratios.netYield * 100).toFixed(2);
  const monthly    = Math.round(result.monthlyPayment).toLocaleString('ja-JP');
  const rent       = Math.round(result.effectiveMonthlyRent).toLocaleString('ja-JP');

  const metrics = [
    { en: 'PROPERTY PRICE', ja: '物件価格',     val: fmtM(input.propertyPrice) },
    { en: 'LOAN AMOUNT',    ja: '借入額',        val: fmtM(loanAmount) },
    { en: 'GROSS YIELD',    ja: '表面利回り',    val: `${grossYield}%` },
    { en: 'NET YIELD',      ja: '実質利回り',    val: `${netYield}%` },
    { en: 'MONTHLY PMT',    ja: '月額返済',      val: `¥${monthly}` },
    { en: 'EFFECTIVE RENT', ja: '実効家賃',      val: `¥${rent}` },
  ];

  const metricCells = metrics.map(m => `
    <div style="border-right:1px solid rgba(255,255,255,0.10);padding:0 20px;">
      <div style="font-family:${F_EN};font-size:8px;font-weight:400;letter-spacing:0.2em;
        color:rgba(255,255,255,0.40);text-transform:uppercase;line-height:1;">${m.en}</div>
      <div style="font-family:${F_JA};font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px;">${m.ja}</div>
      <div style="font-family:${F_EN};font-size:18px;font-weight:300;color:${WHITE};
        margin-top:8px;letter-spacing:0.01em;">${m.val}</div>
    </div>
  `).join('');

  // Large background ornament number
  const ornamentPrice = Math.round(input.propertyPrice / 10000).toLocaleString('ja-JP');

  return `
    <div style="font-family:${F};background:${BLACK};width:794px;min-height:1123px;
      position:relative;overflow:hidden;box-sizing:border-box;">

      ${gridOverlay(794, 1123)}
      ${cornerMarks(28)}

      <!-- Left vertical accent bar -->
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;
        background:rgba(255,255,255,0.45);z-index:2;"></div>

      <!-- Background ornament: giant price number -->
      <div style="position:absolute;right:-40px;bottom:160px;
        font-family:${F_EN};font-size:320px;font-weight:700;
        color:rgba(255,255,255,0.03);letter-spacing:-0.06em;line-height:1;
        pointer-events:none;user-select:none;z-index:0;white-space:nowrap;">
        ${ornamentPrice}
      </div>

      <!-- Upper content area -->
      <div style="padding:100px 83px 0 86px;position:relative;z-index:1;">

        <!-- Report type label -->
        <div style="font-family:${F_EN};font-size:9px;font-weight:500;letter-spacing:0.40em;
          color:rgba(255,255,255,0.28);text-transform:uppercase;margin-bottom:64px;
          display:flex;align-items:center;gap:16px;">
          <div style="width:24px;height:1px;background:rgba(255,255,255,0.22);flex-shrink:0;"></div>
          REAL ESTATE INVESTMENT SIMULATION REPORT
        </div>

        <!-- Property name — Hero typography -->
        <div style="font-family:${F_EN};font-size:68px;font-weight:200;color:${WHITE};
          letter-spacing:-0.02em;line-height:0.95;margin-bottom:20px;
          word-break:break-word;">
          ${esc(input.propertyName)}
        </div>

        <!-- Pattern badge + property meta row -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:80px;">
          <div style="display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,0.25);
            padding:5px 16px;">
            <span style="font-family:${F_EN};font-size:9px;font-weight:500;letter-spacing:0.28em;
              color:rgba(255,255,255,0.55);">${esc(patternLabel).toUpperCase()}</span>
          </div>
          <div style="width:1px;height:16px;background:rgba(255,255,255,0.15);flex-shrink:0;"></div>
          <div style="font-family:${F_JA};font-size:11px;color:rgba(255,255,255,0.32);
            letter-spacing:0.08em;">
            ${esc(input.propertyType)}${input.location ? `&ensp;—&ensp;${esc(input.location)}` : ''}
          </div>
        </div>

        <!-- Separator line -->
        <div style="width:100%;height:1px;background:rgba(255,255,255,0.10);margin-bottom:40px;"></div>

        <!-- Metrics grid (2 rows × 3 cols) -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:0;">
          ${metricCells}
        </div>

        <!-- Second separator -->
        <div style="width:100%;height:1px;background:rgba(255,255,255,0.10);margin-top:40px;"></div>
      </div>

      <!-- Bottom strip: property details -->
      <div style="position:absolute;bottom:0;left:0;right:0;
        border-top:1px solid rgba(255,255,255,0.08);padding:28px 83px 28px 86px;z-index:1;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:24px;">
          ${[
            ['INTEREST RATE', '金利', `${(input.rate * 100).toFixed(2)}%`],
            ['TERM',          '返済期間', `${input.termYears}年`],
            ['VACANCY',       '空室率',   `${(input.vacancyRate * 100).toFixed(1)}%`],
            ['HOLDING',       '保有期間', `${input.holdingYears}年`],
          ].map(([en, ja, val]) => `
            <div style="border-right:1px solid rgba(255,255,255,0.06);padding:0 16px 0 0;margin-right:16px;">
              <div style="font-family:${F_EN};font-size:8px;letter-spacing:0.20em;
                color:rgba(255,255,255,0.25);text-transform:uppercase;">${en}</div>
              <div style="font-family:${F_JA};font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;">${ja}</div>
              <div style="font-family:${F_EN};font-size:16px;font-weight:300;
                color:rgba(255,255,255,0.72);margin-top:8px;letter-spacing:0.02em;">${val}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:${F_EN};font-size:9px;font-weight:600;letter-spacing:0.40em;
            color:rgba(255,255,255,0.18);">MAS — MY AGENT SIMULATION</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.18);letter-spacing:0.08em;">${today()}</div>
        </div>
      </div>
    </div>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CASH FLOW ANALYSIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function cashflowSectionHtml(result: SimResult, patternLabel: string): string {
  const rows  = result.cashFlows;
  const input = result.input;

  const firstRow = rows[0];
  const lastRow  = rows[rows.length - 1];
  const annualRent = firstRow ? Math.round(firstRow.rentalIncome) : 0;
  const annualLoan = firstRow ? Math.round(firstRow.annualLoanPayment) : 0;
  const firstCF   = firstRow ? Math.round(firstRow.afterTaxCF) : 0;
  const cumulCF   = lastRow  ? Math.round(lastRow.cumulativeCF) : 0;

  const signStr = (n: number) => n >= 0 ? fmt(n) : `△ ${fmt(Math.abs(n))}`;

  const tableRows = rows.map((r: CFRow, i: number) => {
    const isHL = false; // no color highlight in monochrome — use weight instead
    const bg   = i % 2 === 0 ? WHITE : LIGHT;
    const cfBold = r.afterTaxCF < 0 ? 'font-weight:600;' : 'font-weight:700;';
    return `
      <tr style="background:${bg};">
        ${td(`${r.year}`, 'center', 'font-weight:600;font-family:Inter,sans-serif;')}
        ${td(fmt(r.rentalIncome))}
        ${td(fmt(r.managementCosts))}
        ${td(fmt(r.operatingCF), 'right', r.operatingCF < 0 ? 'font-weight:600;' : '')}
        ${td(fmt(r.annualLoanPayment))}
        ${td(r.incomeTax > 0 ? fmt(r.incomeTax) : '—')}
        ${td(signStr(r.afterTaxCF), 'right', cfBold)}
        ${td(signStr(r.cumulativeCF), 'right', r.cumulativeCF < 0 ? 'font-weight:700;' : 'font-weight:700;')}
        ${td(fmt(r.loanBalance), 'right', `color:${GRAY};`)}
      </tr>
    `;
  }).join('');

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('CASH FLOW ANALYSIS', 'キャッシュフロー分析')}

    ${kpiBlock([
      { enLabel: 'Annual Rent',    value: fmt(annualRent), sub: '1年目 年間家賃収入' },
      { enLabel: 'Loan Payment',   value: fmt(annualLoan), sub: '1年目 年間ローン返済' },
      { enLabel: `${input.holdingYears}Y Cum. CF`, value: signStr(cumulCF), sub: `${input.holdingYears}年間 税引後累計CF` },
    ])}

    ${cashflowBarChartSvg(rows)}

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
      <thead>
        <tr style="background:${BLACK};color:${WHITE};">
          ${th('年', 'center', '36px')}
          ${th('家賃収入')}
          ${th('運営費')}
          ${th('運営CF')}
          ${th('ローン返済')}
          ${th('税金')}
          ${th('税引後CF')}
          ${th('累計CF')}
          ${th('残債')}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    ${pageFooter()}
  `;

  return pageWrap(content, 'landscape');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AMORTIZATION SCHEDULE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function amortizationSectionHtml(result: SimResult, patternLabel: string): string {
  const rows  = result.amortization;
  const input = result.input;

  const annualRows = Array.from({ length: input.holdingYears }, (_, i) => {
    const yr = rows.filter((r: AmortRow) => r.year === i + 1);
    return {
      year:          i + 1,
      totalPayment:  yr.reduce((s: number, r: AmortRow) => s + r.payment, 0),
      totalInterest: yr.reduce((s: number, r: AmortRow) => s + r.interest, 0),
      totalPrincipal:yr.reduce((s: number, r: AmortRow) => s + r.principal, 0),
      endBalance:    yr[yr.length - 1]?.balance ?? 0,
      cumInterest:   yr[yr.length - 1]?.cumInterest ?? 0,
    };
  });

  const totalInterest = annualRows[annualRows.length - 1]?.cumInterest ?? result.totalInterest;

  const tableRows = annualRows.map((r, i) => {
    const isLast = i === annualRows.length - 1;
    const bg = isLast ? BLACK : (i % 2 === 0 ? WHITE : LIGHT);
    const Cell = isLast ? tdHL : td;
    return `
      <tr style="background:${bg};">
        ${Cell(`${r.year}`, 'center', 'font-weight:700;font-family:Inter,sans-serif;')}
        ${Cell(fmt(r.totalPayment))}
        ${Cell(fmt(r.totalInterest), 'right', isLast ? 'font-weight:700;' : '')}
        ${Cell(fmt(r.totalPrincipal), 'right', isLast ? 'font-weight:700;' : '')}
        ${Cell(fmt(r.endBalance))}
        ${Cell(fmt(r.cumInterest), 'right', isLast ? 'font-weight:700;' : `color:${GRAY};`)}
      </tr>
    `;
  }).join('');

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('REPAYMENT SCHEDULE', '返済スケジュール')}

    ${kpiBlock([
      { enLabel: 'Loan Amount',   value: fmtM(result.loanAmount),    sub: '借入元本' },
      { enLabel: 'Interest Rate', value: `${(input.rate * 100).toFixed(2)}%`, sub: '年利（固定）' },
      { enLabel: 'Total Interest',value: fmtM(totalInterest),         sub: `${input.holdingYears}年間 累計利息` },
    ])}

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
      <thead>
        <tr style="background:${BLACK};color:${WHITE};">
          ${th('年', 'center', '36px')}
          ${th('年間返済額')}
          ${th('うち利息')}
          ${th('うち元金')}
          ${th('期末残高')}
          ${th('累計利息')}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <!-- Mini bar: loan vs interest ratio -->
    <div style="background:${LIGHT};padding:14px 18px;display:flex;align-items:center;gap:20px;">
      <div style="font-size:9px;letter-spacing:0.12em;color:${GRAY};white-space:nowrap;">元利内訳</div>
      ${(() => {
        const total = result.loanAmount + totalInterest;
        const pctP  = Math.round((result.loanAmount / total) * 100);
        const pctI  = 100 - pctP;
        return `
          <div style="flex:1;">
            <div style="display:flex;height:8px;width:100%;">
              <div style="width:${pctP}%;background:${BLACK};"></div>
              <div style="width:${pctI}%;background:${GRAY};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:9px;color:${GRAY};">
              <span>元金 ${pctP}%&ensp;${fmtM(result.loanAmount)}</span>
              <span>利息 ${pctI}%&ensp;${fmtM(totalInterest)}</span>
            </div>
          </div>
        `;
      })()}
    </div>

    ${pageFooter()}
  `;

  return pageWrap(content, 'portrait');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SALE SIMULATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function saleSectionHtml(result: SimResult, patternLabel: string): string {
  const input     = result.input;
  const scenarios = result.saleScenarios;

  // Best scenario = highest afterTaxProfit
  const bestIdx = scenarios.reduce((best, s, i) =>
    s.afterTaxProfit > scenarios[best].afterTaxProfit ? i : best, 0);

  const tableRows = scenarios.map((s, i) => {
    const isHL = i === bestIdx;
    const bg   = isHL ? BLACK : (i % 2 === 0 ? WHITE : LIGHT);
    const Cell = isHL ? tdHL : td;
    const cagrStr = `${(s.cagr * 100).toFixed(2)}%`;
    const multStr = `${s.investmentMultiple.toFixed(2)}x`;
    return `
      <tr style="background:${bg};">
        ${Cell(esc(s.label), 'left', isHL ? 'font-weight:600;' : 'font-weight:500;')}
        ${Cell(fmt(s.salePrice))}
        ${Cell(fmt(s.preTaxProfit), 'right', s.preTaxProfit < 0 && !isHL ? `color:${GRAY};` : '')}
        ${Cell(fmt(s.capitalGainsTax))}
        ${Cell(fmt(s.afterTaxProfit), 'right', 'font-weight:700;')}
        ${Cell(cagrStr, 'right', !isHL && s.cagr < 0 ? `color:${GRAY};` : '')}
        ${Cell(multStr, 'right', 'font-weight:600;')}
      </tr>
    `;
  }).join('');

  const bestScenario = scenarios[bestIdx];

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('SALE SIMULATION', '売却シミュレーション')}

    ${kpiBlock([
      { enLabel: 'Property Price',    value: fmtM(input.propertyPrice), sub: '取得価格' },
      { enLabel: 'Best Net Proceeds', value: fmt(bestScenario?.afterTaxProfit ?? 0), sub: '最良シナリオ 税引後手残り' },
      { enLabel: 'Best CAGR',         value: `${((bestScenario?.cagr ?? 0) * 100).toFixed(2)}%`, sub: '最良シナリオ 年平均成長率' },
    ])}

    <!-- Legend -->
    <div style="display:flex;gap:20px;margin-bottom:12px;font-size:9px;color:${GRAY};">
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:12px;height:12px;background:${BLACK};"></div>
        <span>最良シナリオ（税引後手残り 最大）</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:12px;height:12px;background:${LIGHT};border:1px solid ${GRAY};"></div>
        <span>その他のシナリオ</span>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
      <thead>
        <tr style="background:${BLACK};color:${WHITE};">
          ${th('シナリオ', 'left')}
          ${th('売却価格')}
          ${th('税引前手残り')}
          ${th('譲渡所得税')}
          ${th('税引後手残り')}
          ${th('CAGR')}
          ${th('投資倍率')}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <!-- Explanatory note -->
    <div style="background:${LIGHT};border-left:3px solid ${BLACK};padding:14px 16px;
      font-size:10px;color:${GRAY};line-height:1.8;">
      <div style="font-weight:500;color:${BLACK};margin-bottom:4px;">算出前提</div>
      保有年数 ${input.holdingYears}年 &ensp;|&ensp;
      取得価格 ${fmtM(input.propertyPrice)} &ensp;|&ensp;
      金利 ${(input.rate * 100).toFixed(2)}% &ensp;|&ensp;
      返済期間 ${input.termYears}年<br>
      CAGR = 税引後手残り ÷ 自己資金の年平均成長率。投資倍率 = 総回収 ÷ 自己資金。
    </div>

    ${pageFooter()}
  `;

  return pageWrap(content, 'portrait');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAX DETAILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function taxSectionHtml(result: SimResult, patternLabel: string): string {
  const t     = result.taxDetail;
  const input = result.input;

  function twoColRow(label: string, val: string, bold = false): string {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:7px 0;border-bottom:1px solid ${LIGHT};font-size:11px;">
        <span style="color:${GRAY};">${label}</span>
        <span style="font-weight:${bold ? '700' : '500'};color:${bold ? BLACK : BLACK};
          font-family:${bold ? F_EN : 'inherit'};">${val}</span>
      </div>
    `;
  }

  function miniHeader(text: string): string {
    return `<div style="font-family:${F_EN};font-size:9px;font-weight:500;letter-spacing:0.15em;
      text-transform:uppercase;color:${GRAY};padding:10px 0 6px;
      border-bottom:1px solid ${BLACK};margin-bottom:6px;">${text}</div>`;
  }

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('TAX ANALYSIS', '税金詳細レポート')}

    ${kpiBlock([
      { enLabel: 'Real Estate Income', value: fmt(t.realEstateIncome), sub: t.hasLoss ? '1年目 不動産所得（赤字）' : '1年目 不動産所得' },
      { enLabel: 'Total Tax Burden',   value: fmt(t.totalTaxBurden),   sub: '所得税 + 住民税' },
      { enLabel: 'Capital Gains Tax',  value: fmt(t.capitalGainsTax),  sub: t.isLongTerm ? '譲渡所得税（長期）' : '譲渡所得税（短期）' },
    ])}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:20px;">

      <!-- Left: 不動産所得の計算 -->
      <div>
        ${miniHeader('Real Estate Income  不動産所得の計算（1年目）')}
        ${[
          ['家賃収入',          fmt(t.rentalRevenue)],
          ['管理費・修繕積立金', fmt(t.managementExp)],
          ['損害保険料（概算）', fmt(t.insuranceEst)],
          ['固定資産税',        fmt(t.fixedAssetTax)],
          ['減価償却費',        fmt(t.depreciation)],
          ['ローン利息',        fmt(t.loanInterest)],
          ['経費合計',          fmt(t.totalExpenses), true],
          ['不動産所得',        fmt(t.realEstateIncome), true],
        ].map(([l, v, b]) => twoColRow(String(l), String(v), !!b)).join('')}
      </div>

      <!-- Right: 税負担 + 節税 -->
      <div>
        ${miniHeader('Tax Burden  税負担サマリー')}
        ${[
          [`所得税率（概算）`,  `${(t.incomeTaxRate * 100).toFixed(2)}%`],
          ['所得税概算',        fmt(t.incomeTax)],
          ['住民税（10%）',     fmt(t.residentTax)],
          ['合計税負担',        fmt(t.totalTaxBurden), true],
        ].map(([l, v, b]) => twoColRow(String(l), String(v), !!b)).join('')}

        <!-- Tax effect note -->
        <div style="background:${LIGHT};border-left:3px solid ${BLACK};
          padding:12px 14px;margin-top:14px;font-size:10px;color:${GRAY};line-height:1.7;">
          <div style="font-weight:500;color:${BLACK};margin-bottom:4px;">
            ${t.hasLoss ? '損益通算メリット' : '追加税負担'}
          </div>
          ${t.hasLoss
            ? `給与所得との損益通算により<br><span style="font-family:${F_EN};font-size:16px;font-weight:300;color:${BLACK};">${fmt(t.estimatedTaxRefund)}</span>&ensp;節税見込`
            : `不動産所得 増加のため<br><span style="font-family:${F_EN};font-size:16px;font-weight:300;color:${BLACK};">${fmt(t.totalTaxBurden)}</span>&ensp;追加税負担`
          }
        </div>
      </div>
    </div>

    <!-- Capital gains tax -->
    <div>
      ${miniHeader(`Capital Gains  譲渡所得税の計算（${input.holdingYears}年後売却想定）`)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
        <div>
          ${[
            ['売却価格',          fmt(t.salePrice)],
            ['取得費（購入価格）', fmt(t.acquisitionCost)],
            ['累計減価償却費',    fmt(t.accumulatedDep)],
            ['売却費用（3%）',    fmt(t.sellingCosts)],
          ].map(([l, v]) => twoColRow(l, v)).join('')}
        </div>
        <div>
          ${twoColRow('譲渡所得',
            fmt(t.taxableGain), true)}
          ${twoColRow(`譲渡所得税率（${t.isLongTerm ? '長期 5年超' : '短期 5年以下'} / ${(t.taxRate * 100).toFixed(2)}%）`,
            fmt(t.capitalGainsTax), true)}
        </div>
      </div>
    </div>

    ${pageFooter()}
  `;

  return pageWrap(content, 'portrait');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINANCIAL HEALTH RATIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ratiosSectionHtml(result: SimResult, patternLabel: string): string {
  const r     = result.ratios;
  const input = result.input;

  interface RatioItem {
    label: string;
    value: string;
    guide: string;
    pass: boolean | null;
  }

  const ratios: RatioItem[] = [
    { label: '年収倍率（源泉）',   value: `${r.incomeMultipleTax.toFixed(2)}倍`,         guide: '目安 7倍以下',      pass: r.incomeMultipleTax <= 7 },
    { label: '年収倍率（申告）',   value: `${r.incomeMultipleDeclared.toFixed(2)}倍`,     guide: '目安 7倍以下',      pass: r.incomeMultipleDeclared <= 7 },
    { label: '返済比率（源泉）',   value: `${(r.repaymentRatioTax * 100).toFixed(1)}%`,   guide: '目安 25%以下',      pass: r.repaymentRatioTax <= 0.25 },
    { label: '返済比率（申告）',   value: `${(r.repaymentRatioDeclared * 100).toFixed(1)}%`, guide: '目安 25%以下',   pass: r.repaymentRatioDeclared <= 0.25 },
    { label: '表面利回り',         value: `${(r.grossYield * 100).toFixed(2)}%`,           guide: '目安 4%以上',       pass: r.grossYield >= 0.04 },
    { label: '実質利回り',         value: `${(r.netYield * 100).toFixed(2)}%`,             guide: '目安 2.5%以上',     pass: r.netYield >= 0.025 },
    { label: 'DSCR',               value: `${r.dscr.toFixed(2)}倍`,                        guide: '目安 1.2倍以上',    pass: r.dscr >= 1.2 },
    { label: '損益分岐点賃料',     value: `¥${Math.round(r.breakevenRent).toLocaleString('ja-JP')}/月`,
      guide: `現況 ¥${Math.round(result.effectiveMonthlyRent).toLocaleString('ja-JP')}/月`,
      pass: result.effectiveMonthlyRent >= r.breakevenRent },
  ];

  const passCount = ratios.filter(r => r.pass === true).length;

  const tableRows = ratios.map((row, i) => {
    const bg   = i % 2 === 0 ? WHITE : LIGHT;
    const mark = row.pass === true ? '✓' : row.pass === false ? '✗' : '—';
    const markStyle = row.pass === true
      ? `font-weight:700;font-size:14px;color:${BLACK};`
      : row.pass === false
      ? `font-weight:700;font-size:14px;color:${GRAY};`
      : `color:${GRAY};`;
    return `
      <tr style="background:${bg};">
        ${td(row.label, 'left', 'font-weight:500;')}
        ${td(row.value, 'right', `font-family:${F_EN};font-size:13px;font-weight:300;`)}
        ${td(row.guide, 'center', `color:${GRAY};font-size:10px;`)}
        ${td(`<span style="${markStyle}">${mark}</span>`, 'center')}
      </tr>
    `;
  }).join('');

  // Score bar
  const scorePct = Math.round((passCount / ratios.length) * 100);

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('FINANCIAL HEALTH', '財務健全性指標')}

    ${kpiBlock([
      { enLabel: 'Gross Yield',  value: `${(r.grossYield * 100).toFixed(2)}%`, sub: '表面利回り' },
      { enLabel: 'Net Yield',    value: `${(r.netYield * 100).toFixed(2)}%`,   sub: '実質利回り（経費控除後）' },
      { enLabel: 'Health Score', value: `${passCount} / ${ratios.length}`,      sub: '基準クリア数' },
    ])}

    <!-- Score bar -->
    <div style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;font-size:9px;
        color:${GRAY};letter-spacing:0.1em;margin-bottom:6px;">
        <span>HEALTH SCORE</span>
        <span style="color:${BLACK};font-weight:500;">${scorePct}%</span>
      </div>
      <div style="height:4px;background:${LIGHT};width:100%;">
        <div style="height:4px;background:${BLACK};width:${scorePct}%;"></div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
      <thead>
        <tr style="background:${BLACK};color:${WHITE};">
          ${th('指標名', 'left')}
          ${th('実績値')}
          ${th('目安・参考値', 'center')}
          ${th('判定', 'center', '48px')}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div style="background:${LIGHT};border-left:3px solid ${BLACK};
      padding:12px 16px;font-size:10px;color:${GRAY};line-height:1.8;">
      <span style="font-weight:500;color:${BLACK};">判定の見方：</span>&ensp;
      ✓ = 基準クリア（融資審査・投資判断において良好）&ensp;
      ✗ = 基準未達（リスク要因として把握が必要）
    </div>

    ${pageFooter()}
  `;

  return pageWrap(content, 'portrait');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNDING PLAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function fundingPlanSectionHtml(result: SimResult, patternLabel: string): string {
  const input      = result.input;
  const totalFunds = input.propertyPrice + input.expenses;
  const loanAmount = result.loanAmount;
  const equityPct  = Math.round((input.equity / totalFunds) * 100);
  const loanPct    = 100 - equityPct;

  function planRow(label: string, val: string, bold = false): string {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:7px 0;border-bottom:1px solid ${LIGHT};font-size:11px;">
        <span style="color:${GRAY};">${label}</span>
        <span style="font-weight:${bold ? '700' : '500'};color:${bold ? BLACK : BLACK};
          font-family:${bold ? F_EN : 'inherit'};">${val}</span>
      </div>
    `;
  }

  function cardHeader(enLabel: string, jaLabel: string): string {
    return `
      <div style="font-family:${F_EN};font-size:9px;font-weight:500;letter-spacing:0.15em;
        text-transform:uppercase;color:${GRAY};margin-bottom:2px;">${enLabel}</div>
      <div style="font-size:11px;font-weight:500;color:${BLACK};
        letter-spacing:0.08em;margin-bottom:10px;padding-bottom:6px;
        border-bottom:1px solid ${BLACK};">${jaLabel}</div>
    `;
  }

  const content = `
    ${pageHeader(input.propertyName, patternLabel)}
    ${sectionHeading('FUNDING PLAN', '資金計画書')}

    ${kpiBlock([
      { enLabel: 'Property Price', value: fmtM(input.propertyPrice), sub: '物件価格（税抜）' },
      { enLabel: 'Self Funding',   value: fmtM(input.equity),        sub: '自己資金（頭金）' },
      { enLabel: 'Monthly PMT',   value: fmt(result.monthlyPayment), sub: `毎月返済額（${input.termYears}年）` },
    ])}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px;">

      <!-- Left -->
      <div>
        ${cardHeader('Property', '物件情報')}
        ${planRow('物件名',    esc(input.propertyName))}
        ${planRow('物件種別',  esc(input.propertyType))}
        ${planRow('所在地',    esc(input.location) || '—')}
        ${planRow('物件価格',  fmt(input.propertyPrice))}
        ${planRow('諸費用',    fmt(input.expenses))}
        ${planRow('必要総資金', fmt(totalFunds), true)}

        <div style="margin-top:20px;">
          ${cardHeader('Finance', '資金計画')}
          ${planRow('自己資金（頭金）', fmt(input.equity))}
          ${planRow('借入額',          fmt(loanAmount), true)}
          ${planRow('金利',            `${(input.rate * 100).toFixed(2)}%（年）`)}
          ${planRow('返済期間',        `${input.termYears}年`)}
          ${input.lender ? planRow('金融機関', esc(input.lender)) : ''}
        </div>
      </div>

      <!-- Right -->
      <div>
        ${cardHeader('Repayment', '返済詳細')}
        ${planRow('月額返済額', fmt(result.monthlyPayment), true)}
        ${planRow('総返済額',   fmt(result.totalPayment))}
        ${planRow('うち利息',   fmt(result.totalInterest))}

        <div style="margin-top:20px;">
          ${cardHeader('Income', '収支概要')}
          ${planRow('月額家賃収入',  fmt(input.monthlyRent))}
          ${planRow('空室率',        `${(input.vacancyRate * 100).toFixed(1)}%`)}
          ${planRow('実効月額家賃',  fmt(result.effectiveMonthlyRent))}
          ${planRow('表面利回り',    `${(result.ratios.grossYield * 100).toFixed(2)}%`)}
          ${planRow('実質利回り',    `${(result.ratios.netYield * 100).toFixed(2)}%`)}
        </div>

        <!-- Equity ratio bar -->
        <div style="margin-top:20px;background:${LIGHT};padding:14px;border-left:3px solid ${BLACK};">
          <div style="font-size:9px;letter-spacing:0.14em;color:${GRAY};
            text-transform:uppercase;margin-bottom:8px;">自己資金比率</div>
          <div style="display:flex;height:6px;width:100%;">
            <div style="width:${equityPct}%;background:${BLACK};"></div>
            <div style="width:${loanPct}%;background:${GRAY};"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;">
            <span style="color:${BLACK};font-weight:600;">自己資金 ${equityPct}%&ensp;${fmtM(input.equity)}</span>
            <span style="color:${GRAY};">借入 ${loanPct}%&ensp;${fmtM(loanAmount)}</span>
          </div>
        </div>
      </div>
    </div>

    ${pageFooter()}
  `;

  return pageWrap(content, 'portrait');
}
