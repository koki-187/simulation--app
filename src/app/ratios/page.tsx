'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { StatBox } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { yen, pct } from '@/lib/format';
import { elementToPdf } from '@/lib/pdf/jpdf';

// ── DCF helpers ──────────────────────────────────────────────────────────────

function calcNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + discountRate, i + 1), 0);
}

function calcIRR(initialInvestment: number, cashFlows: number[]): number | null {
  if (initialInvestment <= 0) return null;
  let lo = -0.99, hi = 10.0;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npv = cashFlows.reduce((s, cf, j) => s + cf / Math.pow(1 + mid, j + 1), -initialInvestment);
    if (Math.abs(npv) < 1) break;
    if (npv > 0) lo = mid; else hi = mid;
  }
  const irr = (lo + hi) / 2;
  return irr > -0.99 && irr < 10 ? irr : null;
}

// ── PDF export ───────────────────────────────────────────────────────────────

function buildPdfHtml(
  patternLabel: string,
  r: ReturnType<typeof useSimStore.getState>['resultA']['ratios'],
  dcf: { npv3: number; npv5: number; npv7: number; irr: number | null; multiple: number },
): string {
  const row = (label: string, val: string) =>
    `<tr><td style="padding:4px 8px;border:1px solid #e2e8f0">${label}</td><td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:right">${val}</td></tr>`;

  return `
    <div style="font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;padding:24px;color:#1e293b">
      <h1 style="font-size:16px;margin-bottom:16px">年収倍率・返済比率 — パターン${patternLabel}</h1>
      <h2 style="font-size:13px;margin-bottom:8px">融資健全性指標</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:11px">
        ${row('年収倍率（源泉）', r.incomeMultipleTax.toFixed(2) + '倍')}
        ${row('年収倍率（申告）', r.incomeMultipleDeclared.toFixed(2) + '倍')}
        ${row('返済比率（源泉）', (r.repaymentRatioTax * 100).toFixed(1) + '%')}
        ${row('返済比率（申告）', (r.repaymentRatioDeclared * 100).toFixed(1) + '%')}
        ${row('表面利回り', (r.grossYield * 100).toFixed(2) + '%')}
        ${row('実質利回り', (r.netYield * 100).toFixed(2) + '%')}
        ${row('DSCR', r.dscr.toFixed(2) + '倍')}
        ${row('損益分岐点賃料', '¥' + r.breakevenRent.toLocaleString() + '/月')}
      </table>
      <h2 style="font-size:13px;margin-bottom:8px">DCFキャッシュフロー分析</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:12px;font-size:11px">
        ${row('NPV（割引率3%）', '¥' + Math.round(dcf.npv3).toLocaleString())}
        ${row('NPV（割引率5%）', '¥' + Math.round(dcf.npv5).toLocaleString())}
        ${row('NPV（割引率7%）', '¥' + Math.round(dcf.npv7).toLocaleString())}
        ${row('IRR（自己資本）', dcf.irr !== null ? (dcf.irr * 100).toFixed(2) + '%' : 'N/A')}
        ${row('投資倍率', dcf.multiple.toFixed(2) + 'x')}
      </table>
      <p style="font-size:9px;color:#64748b">NPV・IRRは自己資本（頭金）に対する計算。割引率は投資家の期待収益率を想定。</p>
    </div>
  `;
}

// ── DCF table component ───────────────────────────────────────────────────────

type DCFData = {
  npv3: number;
  npv5: number;
  npv7: number;
  irr: number | null;
  multiple: number;
  equity: number;
};

function DCFTable({ d, label }: { d: DCFData; label?: string }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-5">
      {label && <div className="text-xs font-bold text-gold-600 mb-3">{label}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left py-2 text-xs font-semibold text-neutral-500">指標</th>
            <th className="text-right py-2 text-xs font-semibold text-neutral-500">値</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'NPV（割引率3%）', value: Math.round(d.npv3), isYen: true },
            { label: 'NPV（割引率5%）', value: Math.round(d.npv5), isYen: true },
            { label: 'NPV（割引率7%）', value: Math.round(d.npv7), isYen: true },
          ].map(({ label, value, isYen }) => (
            <tr key={label} className="border-b border-neutral-50">
              <td className="py-2 text-neutral-700">{label}</td>
              <td className={`py-2 text-right font-mono font-semibold ${value > 0 ? 'text-success-600' : value < 0 ? 'text-danger-500' : 'text-neutral-600'}`}>
                {isYen ? yen(value) : value}
              </td>
            </tr>
          ))}
          <tr className="border-b border-neutral-50">
            <td className="py-2 text-neutral-700">IRR（レバレッジ後 自己資本IRR）</td>
            <td className={`py-2 text-right font-mono font-semibold ${d.irr !== null && d.irr > 0 ? 'text-success-600' : 'text-danger-500'}`}>
              {d.irr !== null ? pct(d.irr) : 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-neutral-700">投資倍率</td>
            <td className={`py-2 text-right font-mono font-semibold ${d.multiple >= 1 ? 'text-success-600' : 'text-danger-500'}`}>
              {d.multiple.toFixed(2)}x
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-neutral-400">NPV・IRRは自己資本（頭金）に対する計算。割引率は投資家の期待収益率を想定。</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RatiosPage() {
  const { resultA, resultB, activePattern } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
  );
  const result = activePattern === 'B' ? resultB : resultA;
  const r = result.ratios;

  // Build DCF inputs for one result
  function buildDCF(res: typeof resultA) {
    const holdingYears = res.input.holdingYears;
    const annualCFs = res.cashFlows.slice(0, holdingYears).map(row => row.afterTaxCF);
    // Add terminal proceeds to the last year CF
    const terminalProceeds = res.saleScenarios[1]?.afterTaxProfit ?? 0;
    const terminalCFs = annualCFs.map((cf, i) =>
      i === annualCFs.length - 1 ? cf + terminalProceeds : cf
    );
    const equity = res.initialInvestment;
    return {
      npv3: calcNPV(terminalCFs, 0.03),
      npv5: calcNPV(terminalCFs, 0.05),
      npv7: calcNPV(terminalCFs, 0.07),
      irr: calcIRR(equity, terminalCFs),
      multiple: equity > 0 ? (terminalProceeds + res.cashFlows[holdingYears - 1]?.cumulativeCF + equity) / equity : 0,
      equity,
    };
  }

  const dcfA = buildDCF(resultA);
  const dcfB = buildDCF(resultB);
  const dcf = activePattern === 'B' ? dcfB : dcfA;

  const isCompare = activePattern === 'compare';

  const handlePdfExport = async () => {
    try {
      const htmlA = buildPdfHtml('A', resultA.ratios, dcfA);
      const htmlB = isCompare ? buildPdfHtml('B', resultB.ratios, dcfB) : '';
      await elementToPdf({
        html: htmlA + htmlB,
        filename: `MAS_DCF_${resultA.input.propertyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`,
      });
    } catch (e) {
      console.error('PDF出力エラー:', e);
      alert('PDF出力でエラーが発生しました。');
    }
  };

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">年収倍率・返済比率</h1><p className="text-xs text-navy-100">融資審査の健全性指標</p></div>
        <PatternToggle />
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="年収倍率（源泉）" value={r.incomeMultipleTax.toFixed(2)} unit="倍" positive={r.incomeMultipleTax <= 7} negative={r.incomeMultipleTax > 10} sub="7倍以下が融資理想" />
          <StatBox label="年収倍率（申告）" value={r.incomeMultipleDeclared.toFixed(2)} unit="倍" positive={r.incomeMultipleDeclared <= 7} negative={r.incomeMultipleDeclared > 10} sub="申告所得ベース" />
          <StatBox label="返済比率（源泉）" value={pct(r.repaymentRatioTax)} positive={r.repaymentRatioTax <= 0.25} negative={r.repaymentRatioTax > 0.35} sub="25%以下が目安" />
          <StatBox label="返済比率（申告）" value={pct(r.repaymentRatioDeclared)} positive={r.repaymentRatioDeclared <= 0.25} negative={r.repaymentRatioDeclared > 0.35} sub="申告所得ベース" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="表面利回り" value={pct(r.grossYield)} positive={r.grossYield >= 0.04} negative={r.grossYield < 0.02} sub="4%以上が目安" />
          <StatBox label="実質利回り" value={pct(r.netYield)} positive={r.netYield >= 0.02} negative={r.netYield < 0} sub="2%以上が目安" />
          <StatBox label="損益分岐点賃料" value={yen(r.breakevenRent)} unit="/月" sub="この家賃を下回ると赤字" warn />
          <StatBox label="DSCR" value={r.dscr.toFixed(2)} unit="倍" positive={r.dscr >= 1.2} negative={r.dscr < 1.0} sub="1.2倍以上が安全圏" />
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-4">融資健全性チェックリスト</h3>
          {[
            { label: '年収倍率（源泉）≤ 7倍', ok: r.incomeMultipleTax <= 7 },
            { label: '返済比率（源泉）≤ 25%', ok: r.repaymentRatioTax <= 0.25 },
            { label: '実質利回り ≥ 2%', ok: r.netYield >= 0.02 },
            { label: 'DSCR ≥ 1.2倍', ok: r.dscr >= 1.2 },
            { label: '損益分岐賃料 < 現行家賃', ok: r.breakevenRent < result.effectiveMonthlyRent },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
              <span className={`text-lg ${item.ok ? '✅' : '❌'}`}>{item.ok ? '✅' : '❌'}</span>
              <span className={`text-sm ${item.ok ? 'text-success-500 font-medium' : 'text-danger-500'}`}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* DCF分析 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-navy-500">DCFキャッシュフロー分析</h3>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors"
            >
              PDF出力
            </button>
          </div>
          {isCompare ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DCFTable d={dcfA} label="パターン A" />
              <DCFTable d={dcfB} label="パターン B" />
            </div>
          ) : (
            <DCFTable d={dcf} />
          )}
        </div>

        {/* 用語解説 */}
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-navy-500 mb-4">📖 用語解説</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { term: '年収倍率', desc: '借入額 ÷ 年収。7倍以下が融資審査の目安。10倍超は厳しいと判断されやすい。' },
              { term: '返済比率', desc: '年間ローン返済額 ÷ 年収。25%以下が理想。35%超は返済負担が重い水準。' },
              { term: '表面利回り', desc: '年間家賃収入 ÷ 物件価格。空室・費用を考慮しない単純利回り。4%以上が目安。' },
              { term: '実質利回り', desc: '（年間家賃 − 諸費用 − 固都税）÷ 物件価格。実際の手残り率。2%以上が目安。' },
              { term: 'DSCR', desc: 'Debt Service Coverage Ratio（借債返済余力）。運営CF ÷ 年間返済額。1.2倍以上が安全圏。1.0未満は赤字。' },
              { term: 'NPV', desc: '正味現在価値。将来CFを割引率で現在価値に換算した合計。NPV > 0 なら投資価値あり。' },
              { term: 'IRR', desc: '内部収益率（自己資本ベース）。NPV = 0 となる割引率。期待収益率を上回れば投資判断○。' },
              { term: 'CAGR', desc: 'Compound Annual Growth Rate（年平均成長率）。投資元本が毎年何%複利で増えたかを示す。売却益＋累計CFを含む総合リターン。' },
              { term: '投資倍率', desc: '（税引後売却益 ＋ 累計CF ＋ 初期投資）÷ 初期投資。1.0x以下は元本割れ。2.0x以上が優良。' },
              { term: '損益分岐点賃料', desc: 'ローン返済・管理費・固都税を合算した最低限必要な月額家賃。現行家賃がこれを下回ると月次赤字。' },
            ].map(({ term, desc }) => (
              <div key={term} className="bg-white rounded-lg p-3 border border-neutral-100">
                <div className="font-bold text-navy-500 mb-1">{term}</div>
                <div className="text-neutral-600 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
