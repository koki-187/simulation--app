/**
 * 各ページのHTML生成関数。
 * batchExport.ts と組み合わせて一括PDF出力に使用する。
 */

import { SimResult, CFRow, AmortRow } from '@/lib/calc/types';
import { cashflowBarChartSvg } from './chartSvg';

// ── カラーパレット ────────────────────────────────────────────────────────
const NAVY   = '#1C2B4A';
const ORANGE = '#E8632A';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const INDIGO = '#6366F1';

// ── ヘルパー関数 ──────────────────────────────────────────────────────────

/** XSS対策: ユーザー入力をHTMLエスケープ */
function esc(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** 円表記 */
function fmt(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

/** 万円表記（小数1桁） */
function fmtM(n: number): string {
  return (Math.round(n / 10000) / 10).toFixed(1) + '万円';
}

/** 正負で色を返す */
function valColor(n: number, neutralColor = NAVY): string {
  if (n > 0) return GREEN;
  if (n < 0) return RED;
  return neutralColor;
}

// ── 共通コンポーネント ─────────────────────────────────────────────────────

/** ページヘッダー（全セクション共通）*/
function pageHeader(sectionName: string, propertyName: string, patternLabel: string): string {
  const today = new Date().toLocaleDateString('ja-JP');
  return `
    <div style="background:${NAVY};color:white;padding:12px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-size:22px;font-weight:900;letter-spacing:0.08em;color:${ORANGE};">MAS</div>
        <div style="width:1px;height:30px;background:rgba(255,255,255,0.25);"></div>
        <div>
          <div style="font-size:15px;font-weight:700;">${sectionName}</div>
          <div style="font-size:10px;opacity:0.65;margin-top:2px;">${esc(propertyName)} — ${esc(patternLabel)}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:10px;opacity:0.65;">${today}</div>
    </div>
    <div style="height:3px;background:linear-gradient(to right,${ORANGE},#F59E0B);margin-bottom:18px;"></div>
  `;
}

/** ページフッター（全セクション共通）*/
function pageFooter(): string {
  return `
    <div style="margin-top:16px;border-top:1px solid #E5E7EB;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:9px;color:#9CA3AF;font-weight:600;">MAS — My Agent Simuration</div>
      <div style="font-size:9px;color:#9CA3AF;">※本資料は試算概算値であり、投資助言ではありません。実際の数値は専門家にご相談ください。</div>
    </div>
  `;
}

/** KPIカード1枚 */
function kpiCard(label: string, value: string, sub: string, accentColor: string): string {
  return `
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;border-top:3px solid ${accentColor};">
      <div style="font-size:10px;color:#6B7280;margin-bottom:5px;font-weight:500;">${label}</div>
      <div style="font-size:18px;font-weight:800;color:${accentColor};line-height:1.1;">${value}</div>
      <div style="font-size:9px;color:#9CA3AF;margin-top:3px;">${sub}</div>
    </div>
  `;
}

/** KPIグリッド（4列）*/
function kpiGrid(cards: string[]): string {
  return `
    <div style="display:grid;grid-template-columns:repeat(${cards.length},1fr);gap:12px;margin-bottom:18px;">
      ${cards.join('')}
    </div>
  `;
}

/** テーブルのth */
function th(text: string, align: 'left' | 'right' | 'center' = 'right'): string {
  return `<th style="padding:8px 12px;border:1px solid #374151;text-align:${align};font-weight:600;font-size:11px;">${text}</th>`;
}

/** テーブルのtd */
function td(content: string, align: 'left' | 'right' | 'center' = 'right', extra = ''): string {
  return `<td style="padding:7px 12px;border:1px solid #E5E7EB;text-align:${align};${extra}">${content}</td>`;
}

// ── カバーページ ──────────────────────────────────────────────────────────

export function coverHtml(result: SimResult, patternLabel: string): string {
  const input = result.input;
  const today = new Date().toLocaleDateString('ja-JP');
  const loanAmount = result.loanAmount;
  const grossYield = (result.ratios.grossYield * 100).toFixed(2);
  const netYield   = (result.ratios.netYield * 100).toFixed(2);
  const monthly    = Math.round(result.monthlyPayment).toLocaleString('ja-JP');
  const rent       = Math.round(result.effectiveMonthlyRent).toLocaleString('ja-JP');

  return `
    <div style="font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;background:white;min-height:1050px;display:flex;flex-direction:column;">

      <!-- 上部: 紺背景 -->
      <div style="background:${NAVY};padding:60px 60px 50px;flex-shrink:0;">
        <div style="color:${ORANGE};font-size:28px;font-weight:900;letter-spacing:0.15em;margin-bottom:4px;">MAS</div>
        <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:40px;">My Agent Simuration</div>
        <div style="color:white;font-size:30px;font-weight:800;line-height:1.3;margin-bottom:12px;">${esc(input.propertyName)}</div>
        <div style="display:inline-block;background:${ORANGE};color:white;font-size:12px;font-weight:700;padding:5px 16px;border-radius:20px;">${esc(patternLabel)}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:16px;">不動産投資シミュレーションレポート</div>
      </div>

      <!-- 中央: 主要指標 -->
      <div style="flex:1;padding:40px 60px;">
        <div style="font-size:12px;font-weight:700;color:#6B7280;letter-spacing:0.08em;margin-bottom:16px;">■ 主要投資指標</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:30px;">

          <!-- 物件価格 -->
          <div style="border:1px solid #E5E7EB;border-radius:10px;padding:18px;border-left:4px solid ${NAVY};">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px;">物件価格</div>
            <div style="font-size:22px;font-weight:800;color:${NAVY};">${fmtM(input.propertyPrice)}</div>
          </div>

          <!-- 借入額 -->
          <div style="border:1px solid #E5E7EB;border-radius:10px;padding:18px;border-left:4px solid ${ORANGE};">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px;">借入額</div>
            <div style="font-size:22px;font-weight:800;color:${ORANGE};">${fmtM(loanAmount)}</div>
          </div>

          <!-- 利回り -->
          <div style="border:1px solid #E5E7EB;border-radius:10px;padding:18px;border-left:4px solid ${GREEN};">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px;">表面利回り / 実質利回り</div>
            <div style="font-size:22px;font-weight:800;color:${GREEN};">${grossYield}% / ${netYield}%</div>
          </div>

          <!-- 月額 -->
          <div style="border:1px solid #E5E7EB;border-radius:10px;padding:18px;border-left:4px solid ${INDIGO};">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px;">月額返済 / 実効家賃</div>
            <div style="font-size:22px;font-weight:800;color:${INDIGO};">¥${monthly} / ¥${rent}</div>
          </div>
        </div>

        <!-- 物件詳細 -->
        <div style="background:#F8FAFC;border-radius:8px;padding:16px;font-size:11px;color:#4B5563;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
            <div><span style="color:#9CA3AF;">物件種別:</span> ${esc(input.propertyType)}</div>
            <div><span style="color:#9CA3AF;">金利:</span> ${(input.rate * 100).toFixed(2)}%</div>
            <div><span style="color:#9CA3AF;">返済期間:</span> ${input.termYears}年</div>
            <div><span style="color:#9CA3AF;">空室率:</span> ${(input.vacancyRate * 100).toFixed(1)}%</div>
            <div><span style="color:#9CA3AF;">保有期間:</span> ${input.holdingYears}年</div>
            <div><span style="color:#9CA3AF;">作成日:</span> ${today}</div>
          </div>
        </div>
      </div>

      <!-- フッター -->
      <div style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:12px 60px;font-size:9px;color:#9CA3AF;">
        ※本資料は試算概算値であり、投資助言ではありません。実際の数値は専門家にご相談ください。
      </div>
    </div>
  `;
}

// ── キャッシュフロー分析 ─────────────────────────────────────────────────

export function cashflowSectionHtml(result: SimResult, patternLabel: string): string {
  const rows  = result.cashFlows;
  const input = result.input;

  // KPI値の計算
  const firstRow  = rows[0];
  const lastRow   = rows[rows.length - 1];
  const annualRent = firstRow ? Math.round(firstRow.rentalIncome) : 0;
  const annualLoan = firstRow ? Math.round(firstRow.annualLoanPayment) : 0;
  const firstCF    = firstRow ? Math.round(firstRow.afterTaxCF) : 0;
  const cumulCF    = lastRow  ? Math.round(lastRow.cumulativeCF) : 0;

  const tableRows = rows.map((r: CFRow, i: number) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F8FAFC'};">
      ${td(`${r.year}年`, 'center', 'font-weight:600;')}
      ${td(fmt(r.rentalIncome))}
      ${td(fmt(r.managementCosts))}
      ${td(fmt(r.operatingCF), 'right', `color:${valColor(r.operatingCF)};font-weight:600;`)}
      ${td(fmt(r.annualLoanPayment))}
      ${td(fmt(r.incomeTax), 'right', `color:${r.incomeTax > 0 ? RED : '#111827'};`)}
      ${td(fmt(r.afterTaxCF), 'right', `color:${valColor(r.afterTaxCF)};font-weight:700;`)}
      ${td(fmt(r.cumulativeCF), 'right', `color:${valColor(r.cumulativeCF)};font-weight:700;`)}
      ${td(fmt(r.loanBalance))}
    </tr>
  `).join('');

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('キャッシュフロー分析', input.propertyName, patternLabel)}

      ${kpiGrid([
        kpiCard('年間家賃収入', fmt(annualRent), '1年目実効', NAVY),
        kpiCard('年間ローン返済', fmt(annualLoan), '元利合計', ORANGE),
        kpiCard('1年目税引後CF', fmt(firstCF), firstCF >= 0 ? '黒字' : '赤字', firstCF >= 0 ? GREEN : RED),
        kpiCard(`${input.holdingYears}年累計CF`, fmt(cumulCF), `保有${input.holdingYears}年後`, valColor(cumulCF)),
      ])}

      ${cashflowBarChartSvg(rows)}

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            ${th('年', 'center')}
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
    </div>
  `;
}

// ── 返済スケジュール ─────────────────────────────────────────────────────

export function amortizationSectionHtml(result: SimResult, patternLabel: string): string {
  const rows  = result.amortization;
  const input = result.input;

  const annualRows = Array.from({ length: input.termYears }, (_, i) => {
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

  const tableRows = annualRows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F8FAFC'};">
      ${td(`${r.year}年`, 'center', 'font-weight:700;')}
      ${td(fmt(r.totalPayment))}
      ${td(fmt(r.totalInterest), 'right', `color:${RED};font-weight:600;`)}
      ${td(fmt(r.totalPrincipal), 'right', `color:${GREEN};font-weight:600;`)}
      ${td(fmt(r.endBalance), 'right', 'font-weight:600;')}
      ${td(fmt(r.cumInterest), 'right', `color:#6B7280;`)}
    </tr>
  `).join('');

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('返済スケジュール', input.propertyName, patternLabel)}

      ${kpiGrid([
        kpiCard('借入額', fmtM(result.loanAmount), '元本', NAVY),
        kpiCard('金利', `${(input.rate * 100).toFixed(2)}%`, '年率', ORANGE),
        kpiCard('返済期間', `${input.termYears}年`, '元利均等', INDIGO),
        kpiCard('総支払利息', fmtM(totalInterest), '利息合計', RED),
      ])}

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            ${th('年', 'center')}
            ${th('年間返済額')}
            ${th('うち利息')}
            ${th('うち元金')}
            ${th('残高')}
            ${th('累計利息')}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      ${pageFooter()}
    </div>
  `;
}

// ── 売却シミュレーション ─────────────────────────────────────────────────

export function saleSectionHtml(result: SimResult, patternLabel: string): string {
  const input     = result.input;
  const scenarios = result.saleScenarios;

  function rowBg(label: string, idx: number): string {
    const l = label.toLowerCase();
    if (l.includes('早期') || l.includes('3年') || l.includes('5年')) return '#FFF5F0';
    if (l.includes('長期') || l.includes('10年') || l.includes('15年') || l.includes('20年')) return '#F0FDF4';
    return idx % 2 === 0 ? 'white' : '#F8FAFC';
  }

  function cagrColor(cagr: number): string {
    if (cagr >= 0.03) return GREEN;
    if (cagr >= 0)    return ORANGE;
    return RED;
  }

  const tableRows = scenarios.map((s, i) => `
    <tr style="background:${rowBg(s.label, i)};">
      ${td(esc(s.label), 'left', 'font-weight:600;')}
      ${td(fmt(s.salePrice))}
      ${td(fmt(s.preTaxProfit), 'right', `color:${valColor(s.preTaxProfit)};`)}
      ${td(fmt(s.capitalGainsTax), 'right', `color:${RED};`)}
      ${td(fmt(s.afterTaxProfit), 'right', `color:${valColor(s.afterTaxProfit)};font-weight:700;font-size:13px;`)}
      ${td(`${(s.cagr * 100).toFixed(2)}%`, 'right', `color:${cagrColor(s.cagr)};font-weight:600;`)}
      ${td(`${s.investmentMultiple.toFixed(2)}x`, 'right', `color:${valColor(s.investmentMultiple - 1)};font-weight:600;`)}
    </tr>
  `).join('');

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('売却シミュレーション', input.propertyName, patternLabel)}

      <div style="display:flex;gap:12px;margin-bottom:16px;font-size:10px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:14px;height:14px;background:#FFF5F0;border:1px solid #FECACA;border-radius:2px;"></div>
          <span style="color:#6B7280;">早期売却シナリオ</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:14px;height:14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:2px;"></div>
          <span style="color:#6B7280;">長期保有シナリオ</span>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
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

      ${pageFooter()}
    </div>
  `;
}

// ── 税金詳細 ─────────────────────────────────────────────────────────────

export function taxSectionHtml(result: SimResult, patternLabel: string): string {
  const t     = result.taxDetail;
  const input = result.input;

  const incomeRows: [string, string, string][] = [
    ['家賃収入', fmt(t.rentalRevenue), ''],
    ['管理費・修繕積立金', fmt(t.managementExp), ''],
    ['損害保険料（概算）', fmt(t.insuranceEst), ''],
    ['固定資産税', fmt(t.fixedAssetTax), ''],
    ['減価償却費', fmt(t.depreciation), ''],
    ['ローン利息', fmt(t.loanInterest), ''],
    ['経費合計', fmt(t.totalExpenses), `color:${RED};font-weight:700;`],
    ['不動産所得', fmt(t.realEstateIncome), `color:${valColor(t.realEstateIncome)};font-weight:700;font-size:13px;`],
  ];

  const taxRows: [string, string, string][] = [
    ['所得税率（概算）', `${(t.incomeTaxRate * 100).toFixed(2)}%`, ''],
    ['所得税概算', fmt(t.incomeTax), `color:${RED};`],
    ['住民税（10%）', fmt(t.residentTax), `color:${RED};`],
    ['合計税負担', fmt(t.totalTaxBurden), `color:${RED};font-weight:700;font-size:13px;`],
  ];

  const gainRows: [string, string, string][] = [
    ['売却価格', fmt(t.salePrice), ''],
    ['取得費（購入価格）', fmt(t.acquisitionCost), ''],
    ['累計減価償却費', fmt(t.accumulatedDep), ''],
    ['売却費用（3%）', fmt(t.sellingCosts), ''],
    ['譲渡所得', fmt(t.taxableGain), `color:${valColor(t.taxableGain)};font-weight:700;`],
    [`譲渡所得税（${t.isLongTerm ? '長期' : '短期'} ${(t.taxRate * 100).toFixed(2)}%）`, fmt(t.capitalGainsTax), `color:${RED};font-weight:700;font-size:13px;`],
  ];

  function simpleTableRows(data: [string, string, string][]): string {
    return data.map(([label, val, extra], i) => `
      <tr style="background:${i % 2 === 0 ? 'white' : '#F8FAFC'};">
        <td style="padding:7px 12px;border:1px solid #E5E7EB;font-size:12px;">${label}</td>
        <td style="padding:7px 12px;border:1px solid #E5E7EB;text-align:right;font-size:12px;${extra}">${val}</td>
      </tr>
    `).join('');
  }

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('税金詳細レポート', input.propertyName, patternLabel)}

      ${kpiGrid([
        kpiCard('不動産所得（1年目）', fmt(t.realEstateIncome), t.hasLoss ? '赤字（損益通算可）' : '黒字', valColor(t.realEstateIncome)),
        kpiCard('合計税負担', fmt(t.totalTaxBurden), '所得税+住民税', RED),
        kpiCard('節税見込額', fmt(t.estimatedTaxRefund), t.hasLoss ? '損益通算効果' : '-', GREEN),
        kpiCard('譲渡所得税', fmt(t.capitalGainsTax), t.isLongTerm ? '長期（5年超）' : '短期（5年以下）', RED),
      ])}

      <!-- 2カラムレイアウト -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <!-- 左: 不動産所得計算 -->
        <div>
          <div style="font-size:11px;font-weight:700;color:${NAVY};margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ${NAVY};">不動産所得の計算（1年目）</div>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${simpleTableRows(incomeRows)}</tbody>
          </table>
        </div>
        <!-- 右: 税負担サマリー -->
        <div>
          <div style="font-size:11px;font-weight:700;color:${NAVY};margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ${ORANGE};">税負担サマリー</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <tbody>${simpleTableRows(taxRows)}</tbody>
          </table>

          ${t.hasLoss ? `
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:12px;font-size:11px;">
            <div style="font-weight:700;color:${GREEN};margin-bottom:4px;">損益通算メリット</div>
            <div style="color:#374151;">給与所得との損益通算により</div>
            <div style="font-size:16px;font-weight:800;color:${GREEN};margin-top:4px;">¥${Math.round(t.estimatedTaxRefund).toLocaleString('ja-JP')} 節税見込</div>
          </div>
          ` : `
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:6px;padding:12px;font-size:11px;">
            <div style="font-weight:700;color:${ORANGE};margin-bottom:4px;">追加税負担</div>
            <div style="color:#374151;">不動産所得が増加するため</div>
            <div style="font-size:16px;font-weight:800;color:${ORANGE};margin-top:4px;">¥${Math.round(t.totalTaxBurden).toLocaleString('ja-JP')} 追加税負担</div>
          </div>
          `}
        </div>
      </div>

      <!-- 譲渡所得税計算 -->
      <div>
        <div style="font-size:11px;font-weight:700;color:${NAVY};margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ${RED};">譲渡所得税の計算（${input.holdingYears}年後売却想定）</div>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${simpleTableRows(gainRows)}</tbody>
        </table>
      </div>

      ${pageFooter()}
    </div>
  `;
}

// ── 財務指標 ─────────────────────────────────────────────────────────────

export function ratiosSectionHtml(result: SimResult, patternLabel: string): string {
  const r     = result.ratios;
  const input = result.input;

  interface RatioRow {
    label: string;
    value: string;
    guide: string;
    pass: boolean | null;
    color: string;
  }

  const ratioRows: RatioRow[] = [
    {
      label: '年収倍率（源泉）',
      value: `${r.incomeMultipleTax.toFixed(2)}倍`,
      guide: '目安: 7倍以下',
      pass: r.incomeMultipleTax <= 7,
      color: r.incomeMultipleTax <= 7 ? GREEN : RED,
    },
    {
      label: '年収倍率（申告所得）',
      value: `${r.incomeMultipleDeclared.toFixed(2)}倍`,
      guide: '目安: 7倍以下',
      pass: r.incomeMultipleDeclared <= 7,
      color: r.incomeMultipleDeclared <= 7 ? GREEN : RED,
    },
    {
      label: '返済比率（源泉）',
      value: `${(r.repaymentRatioTax * 100).toFixed(1)}%`,
      guide: '目安: 25%以下',
      pass: r.repaymentRatioTax <= 0.25,
      color: r.repaymentRatioTax <= 0.25 ? GREEN : RED,
    },
    {
      label: '返済比率（申告所得）',
      value: `${(r.repaymentRatioDeclared * 100).toFixed(1)}%`,
      guide: '目安: 25%以下',
      pass: r.repaymentRatioDeclared <= 0.25,
      color: r.repaymentRatioDeclared <= 0.25 ? GREEN : RED,
    },
    {
      label: '表面利回り',
      value: `${(r.grossYield * 100).toFixed(2)}%`,
      guide: '目安: 4%以上',
      pass: r.grossYield >= 0.04,
      color: r.grossYield >= 0.04 ? GREEN : ORANGE,
    },
    {
      label: '実質利回り',
      value: `${(r.netYield * 100).toFixed(2)}%`,
      guide: '目安: 2.5%以上',
      pass: r.netYield >= 0.025,
      color: r.netYield >= 0.025 ? GREEN : RED,
    },
    {
      label: 'DSCR（負債返済倍率）',
      value: `${r.dscr.toFixed(2)}倍`,
      guide: '目安: 1.2倍以上',
      pass: r.dscr >= 1.2,
      color: r.dscr >= 1.2 ? GREEN : RED,
    },
    {
      label: '損益分岐点賃料',
      value: `¥${Math.round(r.breakevenRent).toLocaleString('ja-JP')}/月`,
      guide: `現況家賃: ¥${Math.round(result.effectiveMonthlyRent).toLocaleString('ja-JP')}/月`,
      pass: result.effectiveMonthlyRent >= r.breakevenRent,
      color: result.effectiveMonthlyRent >= r.breakevenRent ? GREEN : RED,
    },
  ];

  const passCount = ratioRows.filter(r => r.pass === true).length;

  const tableRows = ratioRows.map((row, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F8FAFC'};">
      <td style="padding:8px 12px;border:1px solid #E5E7EB;font-size:12px;font-weight:500;">${row.label}</td>
      <td style="padding:8px 12px;border:1px solid #E5E7EB;font-size:14px;font-weight:800;text-align:right;color:${row.color};">${row.value}</td>
      <td style="padding:8px 12px;border:1px solid #E5E7EB;font-size:11px;color:#6B7280;text-align:center;">${row.guide}</td>
      <td style="padding:8px 12px;border:1px solid #E5E7EB;text-align:center;font-size:16px;">
        ${row.pass === true ? '<span style="color:' + GREEN + ';">&#10003;</span>' : row.pass === false ? '<span style="color:' + RED + ';">&#9888;</span>' : '<span style="color:#9CA3AF;">—</span>'}
      </td>
    </tr>
  `).join('');

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('財務健全性指標', input.propertyName, patternLabel)}

      ${kpiGrid([
        kpiCard('表面利回り', `${(r.grossYield * 100).toFixed(2)}%`, '年間家賃 ÷ 物件価格', GREEN),
        kpiCard('実質利回り', `${(r.netYield * 100).toFixed(2)}%`, '経費控除後', r.netYield >= 0.025 ? GREEN : RED),
        kpiCard('DSCR', `${r.dscr.toFixed(2)}x`, r.dscr >= 1.2 ? '健全（1.2以上）' : '注意（1.2未満）', r.dscr >= 1.2 ? GREEN : RED),
        kpiCard('総合評価', `${passCount}/${ratioRows.length}`, '基準クリア', passCount >= 6 ? GREEN : passCount >= 4 ? ORANGE : RED),
      ])}

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            ${th('指標名', 'left')}
            ${th('実績値')}
            ${th('目安・参考値', 'center')}
            ${th('判定', 'center')}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div style="background:#F8FAFC;border-radius:6px;padding:10px 14px;font-size:10px;color:#6B7280;margin-bottom:12px;">
        <strong style="color:${NAVY};">指標の見方:</strong>
        &#10003; = 基準クリア（融資審査・投資判断において良好） ／
        &#9888; = 基準未達（リスク要因として認識が必要）
      </div>

      ${pageFooter()}
    </div>
  `;
}

// ── 資金計画書 ──────────────────────────────────────────────────────────

export function fundingPlanSectionHtml(result: SimResult, patternLabel: string): string {
  const input      = result.input;
  const totalFunds = input.propertyPrice + input.expenses;
  const loanAmount = result.loanAmount;

  function blockHeader(title: string, accent: string): string {
    return `
      <div style="font-size:11px;font-weight:700;color:${NAVY};margin:0 0 8px;padding:6px 12px;background:#F8FAFC;border-left:3px solid ${accent};border-radius:0 4px 4px 0;">
        ${title}
      </div>
    `;
  }

  function planRow(label: string, val: string, bold = false): string {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #F3F4F6;font-size:12px;">
        <span style="color:#4B5563;">${label}</span>
        <span style="font-weight:${bold ? '800' : '600'};color:${bold ? NAVY : '#111827'};">${val}</span>
      </div>
    `;
  }

  return `
    <div style="padding:0 20px 20px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;">
      ${pageHeader('資金計画書', input.propertyName, patternLabel)}

      ${kpiGrid([
        kpiCard('物件価格', fmtM(input.propertyPrice), '税抜', NAVY),
        kpiCard('自己資金', fmtM(input.equity), '頭金', ORANGE),
        kpiCard('借入額', fmtM(loanAmount), `金利${(input.rate * 100).toFixed(2)}%`, INDIGO),
        kpiCard('月額返済', fmt(result.monthlyPayment), `${input.termYears}年返済`, GREEN),
      ])}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <!-- 左列: 物件情報 + 資金計画 -->
        <div>
          ${blockHeader('物件情報', NAVY)}
          <div style="padding:0 4px;">
            ${planRow('物件名', esc(input.propertyName))}
            ${planRow('物件種別', esc(input.propertyType))}
            ${planRow('所在地', esc(input.location))}
            ${planRow('物件価格', fmt(input.propertyPrice))}
            ${planRow('諸費用', fmt(input.expenses))}
            ${planRow('必要総資金', fmt(totalFunds), true)}
          </div>

          <div style="margin-top:16px;">
            ${blockHeader('資金計画', ORANGE)}
            <div style="padding:0 4px;">
              ${planRow('自己資金（頭金）', fmt(input.equity))}
              ${planRow('借入額', fmt(loanAmount), true)}
              ${planRow('金利', `${(input.rate * 100).toFixed(2)}%`)}
              ${planRow('返済期間', `${input.termYears}年`)}
              ${input.lender ? planRow('金融機関', esc(input.lender)) : ''}
            </div>
          </div>
        </div>

        <!-- 右列: 返済詳細 + 収支概要 -->
        <div>
          ${blockHeader('返済詳細', INDIGO)}
          <div style="padding:0 4px;">
            ${planRow('月額返済額', fmt(result.monthlyPayment), true)}
            ${planRow('総返済額', fmt(result.totalPayment))}
            ${planRow('うち利息', fmt(result.totalInterest))}
          </div>

          <div style="margin-top:16px;">
            ${blockHeader('収支概要', GREEN)}
            <div style="padding:0 4px;">
              ${planRow('月額家賃収入', fmt(input.monthlyRent))}
              ${planRow('空室率', `${(input.vacancyRate * 100).toFixed(1)}%`)}
              ${planRow('実効月額家賃', fmt(result.effectiveMonthlyRent))}
              ${planRow('表面利回り', `${(result.ratios.grossYield * 100).toFixed(2)}%`)}
              ${planRow('実質利回り', `${(result.ratios.netYield * 100).toFixed(2)}%`)}
            </div>
          </div>

          <!-- 自己資金比率バー -->
          <div style="margin-top:16px;background:#F8FAFC;border-radius:8px;padding:12px;">
            <div style="font-size:10px;color:#6B7280;margin-bottom:6px;">自己資金比率</div>
            <div style="background:#E5E7EB;border-radius:4px;height:10px;overflow:hidden;">
              <div style="background:${ORANGE};height:100%;width:${Math.min(100, Math.round((input.equity / totalFunds) * 100))}%;border-radius:4px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:4px;">
              <span style="color:${ORANGE};font-weight:700;">自己資金 ${Math.round((input.equity / totalFunds) * 100)}%</span>
              <span style="color:#6B7280;">借入 ${Math.round((loanAmount / totalFunds) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      ${pageFooter()}
    </div>
  `;
}
