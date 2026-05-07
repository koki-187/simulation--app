/**
 * メインシミュレーション PDF エクスポート
 * html2canvas + jsPDF 方式で日本語を正しく描画する（Helvetica 方式は廃止）
 */
import type { SimResult } from '@/lib/calc/types';
import { yen, pct, cagr } from '@/lib/format';

function buildSimHtml(resultA: SimResult, resultB: SimResult | null): string {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const results = resultB ? [resultA, resultB] : [resultA];
  const patterns = resultB ? ['パターンA', 'パターンB'] : ['パターンA'];
  const hasB = !!resultB;

  // ヘルパー
  const th = (t: string) => `<th style="padding:4px 8px;border:1px solid #374151;text-align:center;">${t}</th>`;
  const td = (t: string, right = true, bold = false) =>
    `<td style="padding:3px 8px;border:1px solid #E5E7EB;${right ? 'text-align:right;' : ''}${bold ? 'font-weight:700;' : ''}">${t}</td>`;
  const tdL = (t: string) => td(t, false);

  // ── セクション共通スタイル ────────────────────────────────────────────────
  const sectionTitle = (n: string, title: string) => `
    <div style="display:flex;align-items:center;gap:8px;margin:16px 0 6px;">
      <div style="width:4px;height:18px;background:#E8632A;border-radius:2px;flex-shrink:0;"></div>
      <div style="font-size:12px;font-weight:700;color:#1C2B4A;">${n}. ${title}</div>
    </div>`;

  const tableStyle = 'width:100%;border-collapse:collapse;font-size:9px;margin-bottom:4px;';
  const theadStyle = 'background:#1C2B4A;color:white;';

  // ── Section 1: 物件概要・資金計画 ─────────────────────────────────────────
  const overviewFields: [string, (r: SimResult) => string][] = [
    ['物件名',           r => r.input.propertyName || '—'],
    ['物件種別',         r => r.input.propertyType || '—'],
    ['物件価格',         r => yen(r.input.propertyPrice)],
    ['自己資金（頭金）', r => yen(r.input.equity)],
    ['諸費用',           r => yen(r.input.expenses)],
    ['借入額',           r => yen(r.loanAmount)],
    ['金利（年）',       r => pct(r.input.rate)],
    ['返済期間',         r => `${r.input.termYears}年`],
    ['月額返済',         r => yen(r.monthlyPayment)],
    ['初期投資合計',     r => yen(r.initialInvestment)],
    ['家賃収入（月）',   r => yen(r.input.monthlyRent)],
    ['管理費（月）',     r => yen(r.input.managementFee)],
    ['修繕積立金（月）', r => yen(r.input.repairFund)],
    ['空室率',           r => pct(r.input.vacancyRate)],
    ['実効家賃（月）',   r => yen(r.effectiveMonthlyRent)],
    ['保有期間',         r => `${r.input.holdingYears}年`],
  ];

  const sec1 = `
    ${sectionTitle('1', '物件概要・資金計画')}
    <table style="${tableStyle}">
      <thead><tr style="${theadStyle}">
        ${th('項目')}${patterns.map(p => th(p)).join('')}
      </tr></thead>
      <tbody>
        ${overviewFields.map(([label, fn], i) => `
          <tr style="background:${i % 2 === 0 ? '#ffffff' : '#EEF1F6'}">
            ${tdL(label)}${results.map(r => td(fn(r))).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;

  // ── Section 2: 年次キャッシュフロー（前N年）─────────────────────────────
  const maxYears = Math.min(10, resultA.input.holdingYears);
  const cfRows: string[] = [];
  for (let y = 1; y <= maxYears; y++) {
    const cfA = resultA.cashFlows.find(r => r.year === y);
    if (!cfA) continue;
    if (hasB) {
      const cfB = resultB!.cashFlows.find(r => r.year === y);
      cfRows.push(`<tr style="background:${y % 2 === 0 ? '#EEF1F6' : '#ffffff'}">
        ${tdL(`${y}年`)}
        ${td(yen(cfA.preTaxCF))}${td(yen(cfA.incomeTax))}${td(yen(cfA.afterTaxCF), true, true)}
        ${td(yen(cfB?.preTaxCF ?? 0))}${td(yen(cfB?.incomeTax ?? 0))}${td(yen(cfB?.afterTaxCF ?? 0), true, true)}
      </tr>`);
    } else {
      const color = cfA.afterTaxCF >= 0 ? '#16A34A' : '#DC2626';
      const cumColor = cfA.cumulativeCF >= 0 ? '#16A34A' : '#DC2626';
      cfRows.push(`<tr style="background:${y % 2 === 0 ? '#EEF1F6' : '#ffffff'}">
        ${tdL(`${y}年`)}
        ${td(yen(cfA.preTaxCF))}${td(yen(cfA.incomeTax))}
        <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:700;color:${color};">${yen(cfA.afterTaxCF)}</td>
        <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:700;color:${cumColor};">${yen(cfA.cumulativeCF)}</td>
      </tr>`);
    }
  }

  const cfHead = hasB
    ? `${th('年')}${th('A: 税前CF')}${th('A: 税額')}${th('A: 税引後CF')}${th('B: 税前CF')}${th('B: 税額')}${th('B: 税引後CF')}`
    : `${th('年')}${th('税前CF')}${th('所得税')}${th('税引後CF')}${th('累計CF')}`;

  const sec2 = `
    ${sectionTitle('2', `年次キャッシュフロー（前${maxYears}年）`)}
    <table style="${tableStyle}">
      <thead><tr style="${theadStyle}">${cfHead}</tr></thead>
      <tbody>${cfRows.join('')}</tbody>
    </table>`;

  // ── Section 3: 売却シナリオ分析 ────────────────────────────────────────────
  const saleRows = results.map((res, ri) => {
    const header = hasB
      ? `<tr><td colspan="7" style="padding:4px 8px;background:#FFF5F0;font-weight:700;color:#E8632A;border:1px solid #E5E7EB;">${patterns[ri]}</td></tr>`
      : '';
    const rows = res.saleScenarios.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#EEF1F6'}">
        ${tdL(`${s.label}（${s.holdingYears}年後）`)}
        ${td(yen(s.salePrice))}${td(yen(s.loanBalance))}${td(yen(s.preTaxProfit))}
        ${td(yen(s.capitalGainsTax))}
        <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:700;color:${s.afterTaxProfit >= 0 ? '#16A34A' : '#DC2626'};">${yen(s.afterTaxProfit)}</td>
        ${td(cagr(s.cagr))}
      </tr>`).join('');
    return header + rows;
  }).join('');

  const sec3 = `
    ${sectionTitle('3', '売却シナリオ分析')}
    <table style="${tableStyle}">
      <thead><tr style="${theadStyle}">
        ${th('シナリオ')}${th('売却価格')}${th('ローン残債')}${th('税前手残り')}${th('譲渡税')}${th('税引後手残り')}${th('CAGR')}
      </tr></thead>
      <tbody>${saleRows}</tbody>
    </table>`;

  // ── Section 4: 財務指標・健全性チェック ─────────────────────────────────
  const ratioRows: [string, (r: SimResult) => string, string][] = [
    ['年収倍率（源泉）',    r => (r.ratios.incomeMultipleTax > 0 ? r.ratios.incomeMultipleTax.toFixed(2) : '—') + 'x', '≤ 7.0x'],
    ['返済比率（源泉）',    r => pct(r.ratios.repaymentRatioTax),             '≤ 25%'],
    ['表面利回り',          r => pct(r.ratios.grossYield),                    '≥ 4%'],
    ['実質利回り',          r => pct(r.ratios.netYield),                      '≥ 2.5%'],
    ['DSCR（1年目）',       r => r.ratios.dscr.toFixed(2) + 'x',             '≥ 1.2x'],
    ['損益分岐賃料',        r => yen(r.ratios.breakevenRent) + '/月',         '—'],
  ];

  const ratioColB = hasB ? th('パターンB') : '';
  const sec4 = `
    ${sectionTitle('4', '財務指標・健全性チェック')}
    <table style="${tableStyle}">
      <thead><tr style="${theadStyle}">
        ${th('指標')}${th('パターンA')}${ratioColB}${th('目安')}
      </tr></thead>
      <tbody>
        ${ratioRows.map(([label, fn, bench], i) => `
          <tr style="background:${i % 2 === 0 ? '#ffffff' : '#EEF1F6'}">
            ${tdL(label)}${td(fn(resultA))}${hasB ? td(fn(resultB!)) : ''}${td(bench, false)}
          </tr>`).join('')}
      </tbody>
    </table>`;

  // ── Section 5: 税務明細（1年目）────────────────────────────────────────────
  const taxRows: [string, (r: SimResult) => string][] = [
    ['家賃収入（年）',       r => yen(r.taxDetail.rentalRevenue)],
    ['管理費・その他（年）', r => yen(r.taxDetail.managementExp)],
    ['修繕積立金（年）',     r => yen(r.taxDetail.repairExp)],
    ['火災保険概算（年）',   r => yen(r.taxDetail.insuranceEst)],
    ['固都税（年）',         r => yen(r.taxDetail.fixedAssetTax)],
    ['減価償却費（年）',     r => yen(r.taxDetail.depreciation)],
    ['ローン利息（年）',     r => yen(r.taxDetail.loanInterest)],
    ['不動産所得',           r => yen(r.taxDetail.realEstateIncome)],
    ['所得税（概算）',       r => yen(r.taxDetail.incomeTax)],
    ['住民税（概算）',       r => yen(r.taxDetail.residentTax)],
    ['損益通算 節税見込',    r => r.taxDetail.estimatedTaxRefund > 0
      ? `▲${yen(r.taxDetail.estimatedTaxRefund)}`
      : '—'],
  ];

  const taxColB = hasB ? th('パターンB') : '';
  const sec5 = `
    ${sectionTitle('5', '税務明細（1年目）')}
    <table style="${tableStyle}">
      <thead><tr style="${theadStyle}">
        ${th('項目')}${th('パターンA')}${taxColB}
      </tr></thead>
      <tbody>
        ${taxRows.map(([label, fn], i) => `
          <tr style="background:${i % 2 === 0 ? '#ffffff' : '#EEF1F6'}">
            ${tdL(label)}${td(fn(resultA))}${hasB ? td(fn(resultB!)) : ''}
          </tr>`).join('')}
      </tbody>
    </table>`;

  return `
    <div style="font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#111827;">
      <!-- ヘッダー -->
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-size:15px;font-weight:700;letter-spacing:0.05em;">MAS 不動産投資シミュレーション報告書</div>
          <div style="font-size:10px;margin-top:3px;opacity:0.8;">作成日: ${today}</div>
        </div>
        <div style="font-size:8px;opacity:0.7;text-align:right;">本資料は試算値であり、投資助言ではありません。</div>
      </div>
      ${sec1}${sec2}${sec3}${sec4}${sec5}
      <div style="margin-top:12px;font-size:8px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:6px;">
        MAS - My Agent Simuration ／ 本資料は試算値であり、投資助言ではありません。実際の数値は専門家にご相談ください。
      </div>
    </div>`;
}

export async function exportPDF(resultA: SimResult, resultB: SimResult | null) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const propName = resultA.input.propertyName || '報告書';
  await elementToPdf({
    html: buildSimHtml(resultA, resultB),
    filename: `MAS_不動産投資シミュレーション_${propName}_${today.replace(/\//g, '')}.pdf`,
    orientation: 'portrait',
  });
}
