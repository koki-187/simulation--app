/**
 * 各ページのHTML生成関数。
 * batchExport.ts と組み合わせて一括PDF出力に使用する。
 */

import { SimResult, CFRow, AmortRow } from '@/lib/calc/types';
import { cashflowBarChartSvg } from './chartSvg';

const NAVY = '#1C2B4A';
const ORANGE = '#E8632A';

function fmt(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

/** XSS対策: ユーザー入力をHTMLエスケープ */
function esc(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── カバーページ ──────────────────────────────────────────────────────────

export function coverHtml(propertyName: string, patternLabel: string): string {
  const today = new Date().toLocaleDateString('ja-JP');
  return `
    <div style="padding:40px; min-height:500px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; background:white;">
      <div style="font-size:32px; font-weight:bold; color:${NAVY}; margin-bottom:8px;">MAS</div>
      <div style="font-size:14px; color:#6B7280; margin-bottom:32px;">My Agent Simuration</div>
      <div style="font-size:22px; font-weight:bold; color:#111827; margin-bottom:16px;">${esc(propertyName)}</div>
      <div style="font-size:13px; color:#6B7280;">シミュレーションレポート${patternLabel ? ` — ${esc(patternLabel)}` : ''}</div>
      <div style="font-size:11px; color:#9CA3AF; margin-top:8px;">作成日: ${today}</div>
      <div style="margin-top:48px; font-size:9px; color:#D1D5DB;">※本資料はシミュレーション概算値です。実際の数値は専門家にご相談ください。</div>
    </div>
  `;
}

// ── キャッシュフロー ─────────────────────────────────────────────────────

export function cashflowSectionHtml(result: SimResult, patternLabel: string): string {
  const rows = result.cashFlows;
  const input = result.input;
  const today = new Date().toLocaleDateString('ja-JP');

  const tableRows = rows.map((r: CFRow) => `
    <tr style="background:${r.year % 2 === 0 ? '#F9FAFB' : 'white'}">
      <td style="padding:3px 6px;border:1px solid #E5E7EB;">${r.year}年</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.rentalIncome)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.managementCosts)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:${r.operatingCF >= 0 ? '#16A34A' : '#DC2626'};">${fmt(r.operatingCF)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.annualLoanPayment)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:${r.incomeTax > 0 ? '#DC2626' : '#111827'};">${fmt(r.incomeTax)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:${r.afterTaxCF >= 0 ? '#16A34A' : '#DC2626'};">${fmt(r.afterTaxCF)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;color:${r.cumulativeCF >= 0 ? '#16A34A' : '#DC2626'};font-weight:bold;">${fmt(r.cumulativeCF)}</td>
      <td style="padding:3px 6px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.loanBalance)}</td>
    </tr>
  `).join('');

  return `
    <div style="padding:20px;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">キャッシュフロー分析 — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">物件: ${esc(input.propertyName)} ／ 作成日: ${today}</div>
      </div>
      ${cashflowBarChartSvg(rows)}
      <table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            <th style="padding:4px 6px;border:1px solid #374151;text-align:left;">年</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">家賃収入</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">運営費</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">運営CF</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">ローン返済</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">税金</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">税引後CF</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">累計CF</th>
            <th style="padding:4px 6px;border:1px solid #374151;text-align:right;">残債</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}

// ── 返済スケジュール ─────────────────────────────────────────────────────

export function amortizationSectionHtml(result: SimResult, patternLabel: string): string {
  const rows = result.amortization;
  const input = result.input;
  const today = new Date().toLocaleDateString('ja-JP');

  // Build annual rows
  const annualRows = Array.from({ length: input.termYears }, (_, i) => {
    const yr = rows.filter((r: AmortRow) => r.year === i + 1);
    return {
      year: i + 1,
      totalPayment: yr.reduce((s: number, r: AmortRow) => s + r.payment, 0),
      totalInterest: yr.reduce((s: number, r: AmortRow) => s + r.interest, 0),
      totalPrincipal: yr.reduce((s: number, r: AmortRow) => s + r.principal, 0),
      endBalance: yr[yr.length - 1]?.balance ?? 0,
      cumInterest: yr[yr.length - 1]?.cumInterest ?? 0,
    };
  });

  const tableRows = annualRows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:center;font-weight:bold;">${r.year}年</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(r.totalPayment)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;">${fmt(r.totalInterest)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#16A34A;">${fmt(r.totalPrincipal)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${fmt(r.endBalance)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#6B7280;">${fmt(r.cumInterest)}</td>
    </tr>
  `).join('');

  return `
    <div style="padding:20px;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">返済スケジュール — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">物件: ${esc(input.propertyName)} ／ 作成日: ${today}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            <th style="padding:5px 8px;border:1px solid #374151;text-align:center;">年</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">年間返済額</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">うち利息</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">うち元金</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">残高</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">累計利息</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}

// ── 売却シミュレーション ─────────────────────────────────────────────────

export function saleSectionHtml(result: SimResult, patternLabel: string): string {
  const input = result.input;
  const today = new Date().toLocaleDateString('ja-JP');
  const scenarios = result.saleScenarios;

  const tableRows = scenarios.map((s, i) => `
    <tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">
      <td style="padding:3px 8px;border:1px solid #E5E7EB;">${s.label}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(s.salePrice)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${fmt(s.preTaxProfit)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;">${fmt(s.capitalGainsTax)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;color:${s.afterTaxProfit >= 0 ? '#16A34A' : '#DC2626'};font-weight:bold;">${fmt(s.afterTaxProfit)}</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${(s.cagr * 100).toFixed(2)}%</td>
      <td style="padding:3px 8px;border:1px solid #E5E7EB;text-align:right;">${s.investmentMultiple.toFixed(2)}x</td>
    </tr>
  `).join('');

  return `
    <div style="padding:20px;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">売却シミュレーション — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">物件: ${esc(input.propertyName)} ／ 作成日: ${today}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:${NAVY};color:white;">
            <th style="padding:5px 8px;border:1px solid #374151;text-align:left;">シナリオ</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">売却価格</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">税引前手残り</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">譲渡所得税</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">税引後手残り</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">CAGR</th>
            <th style="padding:5px 8px;border:1px solid #374151;text-align:right;">投資倍率</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:12px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}

// ── 税金詳細 ─────────────────────────────────────────────────────────────

export function taxSectionHtml(result: SimResult, patternLabel: string): string {
  const t = result.taxDetail;
  const today = new Date().toLocaleDateString('ja-JP');

  return `
    <div style="padding:20px;font-family:sans-serif;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">税金詳細レポート — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">作成日: ${today}</div>
      </div>

      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">不動産所得の計算（1年目）</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          ${[
            ['家賃収入', fmt(t.rentalRevenue)],
            ['管理費・修繕積立金', fmt(t.managementExp)],
            ['損害保険料（概算）', fmt(t.insuranceEst)],
            ['固定資産税', fmt(t.fixedAssetTax)],
            ['減価償却費', fmt(t.depreciation)],
            ['ローン利息', fmt(t.loanInterest)],
            ['経費合計', fmt(t.totalExpenses)],
            ['不動産所得', fmt(t.realEstateIncome)],
          ].map(([l, v]) => `
            <tr>
              <td style="padding:4px 8px;border:1px solid #E5E7EB;">${l}</td>
              <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${v}</td>
            </tr>`).join('')}
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">
        <tbody>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">所得税率（概算）</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${(t.incomeTaxRate * 100).toFixed(2)}%</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">所得税概算</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:600;">${fmt(t.incomeTax)}</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">住民税（10%）</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:600;">${fmt(t.residentTax)}</td></tr>
          <tr style="background:#FFF7ED;"><td style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:bold;">合計税負担</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:bold;">${fmt(t.totalTaxBurden)}</td></tr>
        </tbody>
      </table>

      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">譲渡所得税の計算</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          ${[
            ['売却価格', fmt(t.salePrice)],
            ['取得費（購入価格）', fmt(t.acquisitionCost)],
            ['累計減価償却費', fmt(t.accumulatedDep)],
            ['売却費用(3%)', fmt(t.sellingCosts)],
            ['譲渡所得', fmt(t.taxableGain)],
          ].map(([l, v]) => `
            <tr>
              <td style="padding:4px 8px;border:1px solid #E5E7EB;">${l}</td>
              <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${v}</td>
            </tr>`).join('')}
          <tr style="background:#FFF7ED;">
            <td style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:bold;">譲渡所得税概算 (${t.isLongTerm ? '長期' : '短期'} ${(t.taxRate * 100).toFixed(2)}%)</td>
            <td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;color:#DC2626;font-weight:bold;">${fmt(t.capitalGainsTax)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:16px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}

// ── 年収倍率・返済比率 ─────────────────────────────────────────────────

export function ratiosSectionHtml(result: SimResult, patternLabel: string): string {
  const r = result.ratios;
  const today = new Date().toLocaleDateString('ja-JP');

  const row = (label: string, val: string) =>
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${label}</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${val}</td></tr>`;

  return `
    <div style="padding:20px;font-family:sans-serif;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">年収倍率・返済比率 — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">作成日: ${today}</div>
      </div>
      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">融資健全性指標</h3>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:11px;">
        <tbody>
          ${row('年収倍率（源泉）', r.incomeMultipleTax.toFixed(2) + '倍')}
          ${row('年収倍率（申告）', r.incomeMultipleDeclared.toFixed(2) + '倍')}
          ${row('返済比率（源泉）', (r.repaymentRatioTax * 100).toFixed(1) + '%')}
          ${row('返済比率（申告）', (r.repaymentRatioDeclared * 100).toFixed(1) + '%')}
          ${row('表面利回り', (r.grossYield * 100).toFixed(2) + '%')}
          ${row('実質利回り', (r.netYield * 100).toFixed(2) + '%')}
          ${row('DSCR', r.dscr.toFixed(2) + '倍')}
          ${row('損益分岐点賃料', '¥' + r.breakevenRent.toLocaleString() + '/月')}
        </tbody>
      </table>
      <div style="margin-top:16px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}

// ── 資金計画書 ──────────────────────────────────────────────────────────

export function fundingPlanSectionHtml(result: SimResult, patternLabel: string): string {
  const input = result.input;
  const today = new Date().toLocaleDateString('ja-JP');

  const totalFunds = input.propertyPrice + input.expenses;
  const loanAmount = totalFunds - input.equity;

  const row = (label: string, val: string) =>
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${label}</td><td style="padding:4px 8px;border:1px solid #E5E7EB;text-align:right;font-weight:600;">${val}</td></tr>`;

  return `
    <div style="padding:20px;font-family:sans-serif;">
      <div style="background:${NAVY};color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">資金計画書 — ${esc(patternLabel)}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">物件: ${esc(input.propertyName)} ／ 作成日: ${today}</div>
      </div>
      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">物件情報</h3>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:11px;">
        <tbody>
          ${row('物件名', esc(input.propertyName))}
          ${row('物件種別', esc(input.propertyType))}
          ${row('所在地', esc(input.location))}
          ${row('物件価格', fmt(input.propertyPrice))}
          ${row('諸費用', fmt(input.expenses))}
          ${row('必要総資金', fmt(totalFunds))}
        </tbody>
      </table>
      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">資金計画</h3>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:11px;">
        <tbody>
          ${row('自己資金（頭金）', fmt(input.equity))}
          ${row('借入額', fmt(loanAmount))}
          ${row('金利', (input.rate * 100).toFixed(2) + '%')}
          ${row('返済期間', input.termYears + '年')}
          ${input.lender ? row('金融機関', esc(input.lender)) : ''}
          ${row('月額返済額', fmt(result.monthlyPayment))}
          ${row('総返済額', fmt(result.totalPayment))}
          ${row('うち利息', fmt(result.totalInterest))}
        </tbody>
      </table>
      <h3 style="font-size:13px;color:${NAVY};margin:16px 0 8px;">収支概要</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11px;">
        <tbody>
          ${row('月額家賃収入', fmt(input.monthlyRent))}
          ${row('空室率', (input.vacancyRate * 100).toFixed(1) + '%')}
          ${row('実効月額家賃', fmt(result.effectiveMonthlyRent))}
          ${row('表面利回り', (result.ratios.grossYield * 100).toFixed(2) + '%')}
          ${row('実質利回り', (result.ratios.netYield * 100).toFixed(2) + '%')}
        </tbody>
      </table>
      <div style="margin-top:16px;font-size:9px;color:#6B7280;">
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | MAS
      </div>
    </div>
  `;
}
