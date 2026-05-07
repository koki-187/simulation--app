'use client';
import { useState } from 'react';
import { AppShell, PatternToggle } from '@/components/layout';
import { Section } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct } from '@/lib/format';

type TaxDetail = ReturnType<typeof useSimStore.getState>['resultA']['taxDetail'];

function buildTaxHtml(t: TaxDetail, patternLabel: string): string {
  const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');
  const today = new Date().toLocaleDateString('ja-JP');

  return `
    <div style="padding:20px;font-family:sans-serif;">
      <div style="background:#1C2B4A;color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:bold;">税金詳細レポート${patternLabel ? ` — ${patternLabel}` : ''}</div>
        <div style="font-size:11px;margin-top:4px;opacity:0.8;">作成日: ${today}</div>
      </div>

      <h3 style="font-size:13px;color:#1C2B4A;margin:16px 0 8px;">不動産所得の計算（1年目）</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          ${[
            ['家賃収入', fmt(t.rentalRevenue)],
            ['管理費・その他費用', fmt(t.managementExp)],
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

      <h3 style="font-size:13px;color:#1C2B4A;margin:16px 0 8px;">譲渡所得税の計算</h3>
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
        ※本シミュレーションは概算です。実際の数値は専門家にご相談ください。 | TERASS
      </div>
    </div>
  `;
}

async function exportTaxPDF(
  resultA: { taxDetail: TaxDetail },
  resultB: { taxDetail: TaxDetail },
  activePattern: string,
) {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');
  const today = new Date().toLocaleDateString('ja-JP');

  let html: string;
  if (activePattern === 'compare') {
    html = buildTaxHtml(resultA.taxDetail, 'パターンA')
         + buildTaxHtml(resultB.taxDetail, 'パターンB');
  } else {
    const t = activePattern === 'B' ? resultB.taxDetail : resultA.taxDetail;
    html = buildTaxHtml(t, '');
  }

  await elementToPdf({
    html,
    filename: `TERASS_税金詳細_${today.replace(/\//g, '')}.pdf`,
    orientation: 'portrait',
  });
}

export default function TaxPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
  const result = activePattern === 'B' ? resultB : resultA;
  const t = result.taxDetail;
  const [pdfLoading, setPdfLoading] = useState(false);
  // PDF button uses resultA, resultB, activePattern for compare support

  const expenseRows = [
    ['管理費・その他費用', yen(t.managementExp)],
    ['損害保険料（概算）', yen(t.insuranceEst)],
    ['固定資産税', yen(t.fixedAssetTax)],
    ['減価償却費', yen(t.depreciation)],
    ['ローン利息', yen(t.loanInterest)],
    ['経費合計', yen(t.totalExpenses)],
  ];

  const taxBrackets = [
    { limit: '195万以下', rate: '5%', deduction: '0' },
    { limit: '330万以下', rate: '10%', deduction: '9.75万' },
    { limit: '695万以下', rate: '20%', deduction: '42.75万' },
    { limit: '900万以下', rate: '23%', deduction: '63.6万' },
    { limit: '1,800万以下', rate: '33%', deduction: '153.6万' },
    { limit: '4,000万以下', rate: '40%', deduction: '279.6万' },
    { limit: '4,000万超', rate: '45%', deduction: '479.6万' },
  ];

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">税金詳細</h1><p className="text-xs text-navy-100">不動産所得税・譲渡所得税の概算</p></div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setPdfLoading(true);
              try { await exportTaxPDF(resultA, resultB, activePattern); }
              catch(e) { console.error(e); alert('PDF出力でエラーが発生しました。'); }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {pdfLoading ? '⏳ 生成中...' : '📄 PDF出力'}
          </button>
          <PatternToggle />
        </div>
      </div>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="grid grid-cols-2 gap-6">
          <Section title="不動産所得の計算（1年目）">
            <div className="space-y-0 text-sm">
              {[
                ['家賃収入', yen(t.rentalRevenue), false],
                ...expenseRows.map(([l,v]) => [l, v, true]),
                ['不動産所得', yen(t.realEstateIncome), false],
              ].map(([label, val, isExpense], i) => (
                <div key={i} className={`flex justify-between items-center py-1.5 border-b border-neutral-100 ${label === '不動産所得' ? 'font-bold bg-navy-50 px-2 rounded' : ''}`}>
                  <span className={`text-neutral-700 ${isExpense ? 'text-neutral-500 pl-3' : ''}`}>{label}</span>
                  <span className={`font-mono ${isExpense ? 'text-danger-500' : 'text-navy-500 font-semibold'}`}>
                    {isExpense ? `(${val})` : val}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm">
              <div className="flex justify-between"><span>所得税率（概算）</span><span className="font-bold text-orange-600">{pct(t.incomeTaxRate)}</span></div>
              <div className="flex justify-between mt-1"><span>所得税概算</span><span className="font-bold text-danger-500">{yen(t.incomeTax)}</span></div>
              <div className="flex justify-between mt-1"><span>住民税（10%）</span><span className="font-bold text-danger-500">{yen(t.residentTax)}</span></div>
              <div className="flex justify-between mt-2 border-t border-orange-200 pt-2 font-bold"><span>合計税負担</span><span className="text-danger-500">{yen(t.totalTaxBurden)}</span></div>
            </div>

            {t.hasLoss && t.salaryIncome > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-4">
                <h3 className="font-bold text-green-800 text-sm mb-3 flex items-center gap-2">
                  <span>💡</span> 損益通算による節税効果（参考）
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">給与所得（入力値）</span>
                    <span className="font-semibold">{t.salaryIncome.toLocaleString()} 万円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">不動産所得（損失）</span>
                    <span className="font-semibold text-red-600">{(t.deductibleLoss / 10000).toFixed(1)} 万円</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2">
                    <span className="text-gray-600">損益通算後の課税所得</span>
                    <span className="font-semibold">{(t.combinedTaxableIncome / 10000).toFixed(1)} 万円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">給与のみの税額（所得税+住民税）</span>
                    <span>{t.taxOnSalaryAlone.toLocaleString()} 円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">損益通算後の税額</span>
                    <span>{t.taxOnCombined.toLocaleString()} 円</span>
                  </div>
                  <div className="flex justify-between bg-green-100 rounded-lg px-3 py-2 mt-2">
                    <span className="font-bold text-green-800">節税見込額（参考）</span>
                    <span className="font-bold text-green-700 text-base">
                      約 {(t.estimatedTaxRefund / 10000).toFixed(1)} 万円
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ⚠️ 土地取得資金にかかる借入金利子は損益通算の対象外（租税特別措置法第41条の4）。実際の節税額は税理士にご確認ください。
                </p>
              </div>
            )}
          </Section>

          <Section title="譲渡所得税の計算">
            <div className="space-y-0 text-sm">
              {[
                ['売却価格', yen(t.salePrice)],
                ['取得費（購入価格）', yen(t.acquisitionCost)],
                ['累計減価償却費', yen(t.accumulatedDep)],
                ['税務上の取得費', yen(t.acquisitionCost - t.accumulatedDep)],
                ['売却費用(3%)', yen(t.sellingCosts)],
                ['譲渡所得', yen(t.taxableGain)],
              ].map(([l,v], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-700">{l}</span>
                  <span className="font-mono font-semibold text-navy-500">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.isLongTerm ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
                  {t.isLongTerm ? '長期譲渡（5年超）' : '短期譲渡（5年以下）'}
                </span>
              </div>
              <div className="flex justify-between"><span>税率</span><span className="font-bold text-orange-600">{pct(t.taxRate)}</span></div>
              <div className="flex justify-between mt-2 font-bold"><span>譲渡所得税概算</span><span className="text-danger-500">{yen(t.capitalGainsTax)}</span></div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3 text-xs text-amber-800">
              <span className="font-bold">⚠️ 長期/短期判定の注意：</span>
              譲渡所得の長期/短期判定は、<span className="font-bold">譲渡した年の1月1日時点</span>での所有期間が5年超かどうかで決まります。
              例えば2020年4月取得・2026年3月売却の場合、2026年1月1日時点では5年9ヶ月ですが、
              2025年12月31日時点では5年8ヶ月のため長期判定となります。
              <span className="font-bold">安全のため6年以上保有してから売却することを推奨します。</span>
            </div>
          </Section>
        </div>

        <Section title="所得税速算表（参考）" color="navy">
          <table className="w-full text-xs">
            <thead><tr className="bg-navy-50"><th className="px-3 py-2 text-left">課税所得</th><th className="px-3 py-2 text-right">税率</th><th className="px-3 py-2 text-right">控除額</th></tr></thead>
            <tbody>
              {taxBrackets.map((b, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-3 py-1.5">{b.limit}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-navy-500">{b.rate}</td>
                  <td className="px-3 py-1.5 text-right text-neutral-500">{b.deduction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </AppShell>
  );
}
