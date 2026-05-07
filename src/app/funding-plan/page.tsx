'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen } from '@/lib/format';
import { INVESTMENT_BANKS } from '@/lib/data/investmentBanks';

/* ─── types ─────────────────────────────────────────────────────────────── */

/* ─── helpers ────────────────────────────────────────────────────────────── */
function calcMonthly(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0 || n === 0) return principal / Math.max(n, 1);
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('ja-JP');
}

function fmtMan(n: number): string {
  return fmt(n) + '万円';
}

/* ─── PDF export ──────────────────────────────────────────────────────────── */
interface FundingPlanData {
  propertyName: string;
  location: string;
  propertyPrice: number;
  propertyType: string;
  structure: string;
  builtYear: number;
  miscExpenses: number;
  equity: number;
  lenderName: string;
  rate: number;
  termYears: number;
  repaymentMethod: string;
  dansin: boolean;
  monthlyRentPlan: number;
  vacancyRate: number;
  managementFeeMonthly: number;
  fixedAssetTaxMonthly: number;
  customerName: string;
  birthDate: string;
  annualIncome: number;
  employer: string;
  yearsEmployed: number;
  agentName: string;
  createdDate: string;
}

function buildFundingPlanHtml(data: FundingPlanData): string {
  const fmt = (n: number) => Math.round(n).toLocaleString('ja-JP');
  const fmtM = (n: number) => fmt(n) + '万円';

  const totalFunds = data.propertyPrice + data.miscExpenses;
  const loanAmount = Math.max(0, totalFunds - data.equity);
  const equityRatio = totalFunds > 0 ? (data.equity / totalFunds) * 100 : 0;
  const monthlyLoanYen = calcMonthly(loanAmount * 10000, data.rate, data.termYears);
  const totalPayment = monthlyLoanYen * data.termYears * 12;
  const totalInterest = totalPayment - loanAmount * 10000;
  const effectiveRent = data.monthlyRentPlan * (1 - data.vacancyRate / 100);
  const managementPlusFixed = data.managementFeeMonthly + data.fixedAssetTaxMonthly;
  const monthlyCF = effectiveRent - managementPlusFixed - monthlyLoanYen / 10000;
  const grossYield = totalFunds > 0 ? (data.monthlyRentPlan * 12 / totalFunds) * 100 : 0;
  const annualExpenses = managementPlusFixed * 12;
  const netYield = totalFunds > 0 ? ((effectiveRent * 12 - annualExpenses) / totalFunds) * 100 : 0;

  const tdL = (t: string) =>
    `<td style="padding:3px 8px;border:1px solid #E5E7EB;font-size:9px;font-weight:600;background:#EEF1F6;color:#1C2B4A;width:45%;">${t}</td>`;
  const tdV = (t: string) =>
    `<td style="padding:3px 8px;border:1px solid #E5E7EB;font-size:9px;text-align:right;">${t}</td>`;

  const twoCol = (rows: [string, string][]) =>
    `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      ${rows.map(([l, v], i) => `<tr style="background:${i % 2 === 0 ? 'white' : '#F9FAFB'}">${tdL(l)}${tdV(v)}</tr>`).join('')}
    </table>`;

  const sectionHd = (title: string) =>
    `<div style="display:flex;align-items:center;gap:6px;margin:12px 0 4px;">
      <div style="width:4px;height:16px;background:#E8632A;border-radius:2px;flex-shrink:0;"></div>
      <div style="font-size:11px;font-weight:700;color:#1C2B4A;">${title}</div>
    </div>`;

  return `
    <div style="font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#111827;padding:4px;">
      <div style="background:#1C2B4A;color:white;padding:10px 14px;border-radius:6px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-size:15px;font-weight:700;letter-spacing:0.05em;">資金計画書</div>
          <div style="font-size:11px;margin-top:2px;opacity:0.85;">${data.propertyName || '（物件名未入力）'}</div>
        </div>
        <div style="font-size:9px;opacity:0.7;text-align:right;">作成日: ${data.createdDate}<br>担当: ${data.agentName || 'MAS'}</div>
      </div>

      ${sectionHd('１．物件情報')}
      ${twoCol([
        ['物件名', data.propertyName || '―'],
        ['所在地', data.location || '―'],
        ['物件価格', fmtM(data.propertyPrice)],
        ['物件種別', data.propertyType || '―'],
        ['建物構造', data.structure || '―'],
        ['築年', data.builtYear ? String(data.builtYear) + '年' : '―'],
      ])}

      ${sectionHd('２．資金計画')}
      ${twoCol([
        ['物件価格', fmtM(data.propertyPrice)],
        ['諸費用', fmtM(data.miscExpenses)],
        ['必要総資金', fmtM(totalFunds)],
        ['自己資金', fmtM(data.equity)],
        ['自己資金比率', equityRatio.toFixed(1) + '%'],
        ['借入金額', fmtM(loanAmount)],
      ])}

      ${sectionHd('３．ローン条件')}
      ${twoCol([
        ['金融機関', data.lenderName || '―'],
        ['金利（年）', data.rate.toFixed(3) + '%'],
        ['返済期間', String(data.termYears) + '年'],
        ['返済方式', data.repaymentMethod],
        ['月々返済額', fmt(Math.round(monthlyLoanYen)) + '円'],
        ['総支払額', fmt(Math.round(totalPayment / 10000)) + '万円'],
        ['総利息', fmt(Math.round(totalInterest / 10000)) + '万円'],
        ['団体信用生命保険', data.dansin ? '加入' : '非加入'],
      ])}

      ${sectionHd('４．月次収支計画')}
      ${twoCol([
        ['月額家賃収入（予定）', data.monthlyRentPlan.toFixed(2) + '万円'],
        ['空室率', data.vacancyRate.toFixed(1) + '%'],
        ['実効家賃収入', effectiveRent.toFixed(2) + '万円'],
        ['管理費・修繕積立金', managementPlusFixed.toFixed(2) + '万円/月'],
        ['月額ローン返済額', fmt(Math.round(monthlyLoanYen)) + '円'],
        ['月次手取り（税前）', (monthlyCF >= 0 ? '+' : '') + monthlyCF.toFixed(2) + '万円'],
        ['表面利回り', grossYield.toFixed(2) + '%'],
        ['実質利回り', netYield.toFixed(2) + '%'],
      ])}

      ${sectionHd('５．お客様情報')}
      ${twoCol([
        ['お客様名', data.customerName || '―'],
        ['生年月日', data.birthDate || '―'],
        ['年収（源泉）', fmtM(data.annualIncome)],
        ['勤務先', data.employer || '―'],
        ['勤続年数', String(data.yearsEmployed) + '年'],
        ['担当エージェント', data.agentName || 'MAS'],
      ])}

      <div style="margin-top:12px;font-size:8px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:6px;">
        MAS - My Agent Simuration ／ 本資料は参考情報です。実際の融資条件は金融機関にご確認ください。
      </div>
    </div>`;
}

async function exportFundingPlanPDF(data: FundingPlanData): Promise<void> {
  const { elementToPdf } = await import('@/lib/pdf/jpdf');
  await elementToPdf({
    html: buildFundingPlanHtml(data),
    filename: 'MAS_資金計画書_' + (data.propertyName || '物件') + '_' + data.createdDate + '.pdf',
    orientation: 'portrait',
  });
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function FundingPlanPage() {
  const { resultA } = useSimStore();
  const pre = resultA.input;

  // ── Form state ────────────────────────────────────────────────────────
  const [propertyName, setPropertyName] = useState(pre.propertyName ?? '');
  const [location, setLocation] = useState(pre.location ?? '');
  const [propertyPrice, setPropertyPrice] = useState<number>(
    pre.propertyPrice ? Math.round(pre.propertyPrice / 10000) : 5000
  );
  const [propertyType, setPropertyType] = useState('区分マンション');
  const [structure, setStructure] = useState('RC');
  const [builtYear, setBuiltYear] = useState<number>(2005);

  const [miscExpenses, setMiscExpenses] = useState<number>(
    pre.expenses ? Math.round(pre.expenses / 10000) : 200
  );
  const [equity, setEquity] = useState<number>(
    pre.equity ? Math.round(pre.equity / 10000) : 500
  );

  const [lenderName, setLenderName] = useState(pre.lender ?? '');
  const [lenderSuggestOpen, setLenderSuggestOpen] = useState(false);
  const [rate, setRate] = useState<number>(
    pre.rate ? pre.rate * 100 : 1.8
  );
  const [termYears, setTermYears] = useState<number>(pre.termYears ?? 30);
  const [repaymentMethod, setRepaymentMethod] = useState<'元利均等' | '元金均等'>('元利均等');
  const [dansin, setDansin] = useState(true);

  const [monthlyRentPlan, setMonthlyRentPlan] = useState<number>(
    pre.monthlyRent ? Math.round(pre.monthlyRent / 10000) : 15
  );
  const [vacancyRate, setVacancyRate] = useState<number>(5);
  const [managementFeeMonthly, setManagementFeeMonthly] = useState<number>(1);
  const [fixedAssetTaxMonthly, setFixedAssetTaxMonthly] = useState<number>(0.5);

  const [customerName, setCustomerName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [annualIncome, setAnnualIncome] = useState<number>(800);
  const [employer, setEmployer] = useState('');
  const [yearsEmployed, setYearsEmployed] = useState<number>(5);
  const [agentName, setAgentName] = useState('MAS');
  const [createdDate, setCreatedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // ── Derived calculations ───────────────────────────────────────────────
  const totalFunds = useMemo(() => propertyPrice + miscExpenses, [propertyPrice, miscExpenses]);
  const loanAmount = useMemo(() => Math.max(0, totalFunds - equity), [totalFunds, equity]);
  const equityRatio = useMemo(
    () => (totalFunds > 0 ? (equity / totalFunds) * 100 : 0),
    [equity, totalFunds]
  );
  const monthlyLoanYen = useMemo(
    () => calcMonthly(loanAmount * 10000, rate, termYears),
    [loanAmount, rate, termYears]
  );
  const monthlyLoanMan = monthlyLoanYen / 10000;
  const effectiveRent = useMemo(
    () => monthlyRentPlan * (1 - vacancyRate / 100),
    [monthlyRentPlan, vacancyRate]
  );
  const monthlyCF = useMemo(
    () => effectiveRent - managementFeeMonthly - fixedAssetTaxMonthly - monthlyLoanMan,
    [effectiveRent, managementFeeMonthly, fixedAssetTaxMonthly, monthlyLoanMan]
  );
  const grossYield = useMemo(
    () => (totalFunds > 0 ? ((monthlyRentPlan * 12) / totalFunds) * 100 : 0),
    [monthlyRentPlan, totalFunds]
  );
  const netYield = useMemo(() => {
    const annualExpenses = (managementFeeMonthly + fixedAssetTaxMonthly) * 12;
    return totalFunds > 0
      ? ((effectiveRent * 12 - annualExpenses) / totalFunds) * 100
      : 0;
  }, [effectiveRent, managementFeeMonthly, fixedAssetTaxMonthly, totalFunds]);

  // ── Bank suggestions ───────────────────────────────────────────────────
  const bankSuggestions = useMemo(() => {
    if (!lenderName) return [];
    return INVESTMENT_BANKS.filter((b) =>
      b.name.includes(lenderName) || lenderName.includes(b.name.slice(0, 3))
    ).slice(0, 5);
  }, [lenderName]);

  // ── PDF handler ────────────────────────────────────────────────────────
  async function handleExportPDF(): Promise<void> {
    exportFundingPlanPDF({
      propertyName,
      location,
      propertyPrice,
      propertyType,
      structure,
      builtYear,
      miscExpenses,
      equity,
      lenderName,
      rate,
      termYears,
      repaymentMethod,
      dansin,
      monthlyRentPlan,
      vacancyRate,
      managementFeeMonthly,
      fixedAssetTaxMonthly,
      customerName,
      birthDate,
      annualIncome,
      employer,
      yearsEmployed,
      agentName,
      createdDate,
    });
  }

  // ── UI helpers ─────────────────────────────────────────────────────────
  const inputCls =
    'border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full bg-white';
  const readonlyCls =
    'border border-neutral-200 rounded px-3 py-2 text-sm bg-neutral-50 text-neutral-500 w-full';
  const labelCls = 'text-neutral-700 text-sm font-medium';

  function Row({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="grid grid-cols-[140px_1fr] gap-3 items-center py-1.5 border-b border-neutral-100 last:border-0">
        <span className={labelCls}>{label}</span>
        <div>{children}</div>
      </div>
    );
  }

  function SectionCard({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div
        className="bg-white rounded-xl border border-neutral-100"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="bg-orange-500 text-white font-bold text-sm px-4 py-2 rounded-t-lg">
          {title}
        </div>
        <div className="p-4 space-y-0">{children}</div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <AppShell>
      {/* Page header */}
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">資金計画書作成</h1>
          <p className="text-xs text-navy-100">お客様向け資金計画書を作成してPDFで出力</p>
        </div>
        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="12" x2="12" y2="18" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          PDFで出力
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Form (60%) ─────────────────────────────────────────── */}
          <div className="lg:w-[60%] space-y-5">
            {/* ① 物件情報 */}
            <SectionCard title="① 物件情報">
              <Row label="物件名">
                <input
                  className={inputCls}
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="例：渋谷区マンション"
                />
              </Row>
              <Row label="物件所在地">
                <input
                  className={inputCls}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：東京都渋谷区"
                />
              </Row>
              <Row label="物件価格（万円）">
                <input
                  type="number"
                  className={inputCls}
                  value={propertyPrice}
                  min={0}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                />
              </Row>
              <Row label="物件種別">
                <select
                  className={inputCls}
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  {['区分マンション', '1棟アパート', '1棟マンション', '戸建て'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Row>
              <Row label="建物構造">
                <select
                  className={inputCls}
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                >
                  {['木造', '軽量鉄骨', '重量鉄骨', 'RC', 'SRC'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Row>
              <Row label="築年（年）">
                <input
                  type="number"
                  className={inputCls}
                  value={builtYear}
                  min={1950}
                  max={2030}
                  onChange={(e) => setBuiltYear(Number(e.target.value))}
                />
              </Row>
            </SectionCard>

            {/* ② 資金計画 */}
            <SectionCard title="② 資金計画">
              <Row label="物件価格（万円）">
                <div className={readonlyCls}>{fmt(propertyPrice)}</div>
              </Row>
              <Row label="諸費用（万円）">
                <input
                  type="number"
                  className={inputCls}
                  value={miscExpenses}
                  min={0}
                  onChange={(e) => setMiscExpenses(Number(e.target.value))}
                />
              </Row>
              <Row label="必要総資金（万円）">
                <div className={readonlyCls + ' font-semibold text-navy-500'}>
                  {fmt(totalFunds)}
                </div>
              </Row>
              <Row label="自己資金（万円）">
                <input
                  type="number"
                  className={inputCls}
                  value={equity}
                  min={0}
                  onChange={(e) => setEquity(Number(e.target.value))}
                />
              </Row>
              <Row label="自己資金比率">
                <div className={readonlyCls}>{equityRatio.toFixed(1)}%</div>
              </Row>
              <Row label="借入金額（万円）">
                <div className={readonlyCls + ' font-semibold text-orange-500'}>
                  {fmt(loanAmount)}
                </div>
              </Row>
            </SectionCard>

            {/* ③ ローン条件 */}
            <SectionCard title="③ ローン条件">
              <Row label="金融機関名">
                <div className="relative">
                  <input
                    className={inputCls}
                    value={lenderName}
                    onChange={(e) => {
                      setLenderName(e.target.value);
                      setLenderSuggestOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setLenderSuggestOpen(false), 150)}
                    placeholder="例：オリックス銀行"
                  />
                  {lenderSuggestOpen && bankSuggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {bankSuggestions.map((b) => (
                        <button
                          key={b.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-500 border-b border-neutral-100 last:border-0"
                          onMouseDown={() => {
                            setLenderName(b.name);
                            setLenderSuggestOpen(false);
                          }}
                        >
                          {b.name}
                          <span className="text-xs text-neutral-400 ml-2">{b.rateMin}%〜</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Row>
              <Row label="金利（%）">
                <input
                  type="number"
                  className={inputCls}
                  value={rate}
                  step={0.001}
                  min={0}
                  max={20}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </Row>
              <Row label="返済期間">
                <select
                  className={inputCls}
                  value={termYears}
                  onChange={(e) => setTermYears(Number(e.target.value))}
                >
                  {Array.from({ length: 26 }, (_, i) => i + 10).map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="返済方式">
                <div className="flex gap-4">
                  {(['元利均等', '元金均等'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="repayment"
                        value={m}
                        checked={repaymentMethod === m}
                        onChange={() => setRepaymentMethod(m)}
                        className="accent-orange-500"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </Row>
              <Row label="団体信用生命保険">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={dansin}
                    onChange={(e) => setDansin(e.target.checked)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  加入する
                </label>
              </Row>
            </SectionCard>

            {/* ④ 月次収支計画 */}
            <SectionCard title="④ 月次収支計画">
              <Row label="月額家賃収入（万円）">
                <input
                  type="number"
                  className={inputCls}
                  value={monthlyRentPlan}
                  step={0.1}
                  min={0}
                  onChange={(e) => setMonthlyRentPlan(Number(e.target.value))}
                />
              </Row>
              <Row label="空室率（%）">
                <input
                  type="number"
                  className={inputCls}
                  value={vacancyRate}
                  step={0.5}
                  min={0}
                  max={100}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                />
              </Row>
              <Row label="実効家賃収入（万円）">
                <div className={readonlyCls}>{effectiveRent.toFixed(2)}</div>
              </Row>
              <Row label="管理費・修繕積立（万円/月）">
                <input
                  type="number"
                  className={inputCls}
                  value={managementFeeMonthly}
                  step={0.1}
                  min={0}
                  onChange={(e) => setManagementFeeMonthly(Number(e.target.value))}
                />
              </Row>
              <Row label="固定資産税（万円/月）">
                <input
                  type="number"
                  className={inputCls}
                  value={fixedAssetTaxMonthly}
                  step={0.1}
                  min={0}
                  onChange={(e) => setFixedAssetTaxMonthly(Number(e.target.value))}
                />
              </Row>
              <Row label="月額ローン返済額">
                <div className={readonlyCls + ' font-semibold text-orange-500'}>
                  {yen(monthlyLoanYen)}
                </div>
              </Row>
              <Row label="月次手取り（税前）">
                <div
                  className={
                    readonlyCls +
                    ' font-bold ' +
                    (monthlyCF >= 0 ? 'text-success-500' : 'text-danger-500')
                  }
                >
                  {monthlyCF.toFixed(2)}万円
                </div>
              </Row>
              <Row label="表面利回り">
                <div className={readonlyCls}>{grossYield.toFixed(2)}%</div>
              </Row>
              <Row label="実質利回り">
                <div className={readonlyCls}>{netYield.toFixed(2)}%</div>
              </Row>
            </SectionCard>

            {/* ⑤ 申請情報 */}
            <SectionCard title="⑤ 申請情報">
              <Row label="お客様名">
                <input
                  className={inputCls}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="山田 太郎"
                />
              </Row>
              <Row label="生年月日">
                <input
                  type="date"
                  className={inputCls}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </Row>
              <Row label="年収（源泉）（万円）">
                <input
                  type="number"
                  className={inputCls}
                  value={annualIncome}
                  min={0}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                />
              </Row>
              <Row label="勤務先">
                <input
                  className={inputCls}
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  placeholder="株式会社〇〇"
                />
              </Row>
              <Row label="勤続年数（年）">
                <input
                  type="number"
                  className={inputCls}
                  value={yearsEmployed}
                  min={0}
                  onChange={(e) => setYearsEmployed(Number(e.target.value))}
                />
              </Row>
              <Row label="担当エージェント名">
                <input
                  className={inputCls}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </Row>
              <Row label="作成日">
                <input
                  type="date"
                  className={inputCls}
                  value={createdDate}
                  onChange={(e) => setCreatedDate(e.target.value)}
                />
              </Row>
            </SectionCard>
          </div>

          {/* ── Right: Preview (40%) ──────────────────────────────────────── */}
          <div className="lg:w-[40%]">
            <div className="sticky top-6 space-y-4">
              {/* Preview card */}
              <div
                className="bg-white rounded-xl border border-neutral-100 overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Preview header */}
                <div className="bg-navy-500 text-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold tracking-wider">MAS</p>
                      <p className="text-xs text-navy-100 mt-0.5">不動産投資 資金計画書</p>
                    </div>
                    <div className="text-right text-xs text-navy-100">
                      <p>{createdDate}</p>
                      <p className="mt-0.5">{agentName}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold truncate">
                    {propertyName || '（物件名未入力）'}
                  </p>
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
                  <div className="p-3 text-center">
                    <p className="text-xs text-neutral-400">物件価格</p>
                    <p className="text-base font-bold text-navy-500 mt-0.5">{fmt(propertyPrice)}</p>
                    <p className="text-xs text-neutral-400">万円</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-neutral-400">借入金額</p>
                    <p className="text-base font-bold text-orange-500 mt-0.5">{fmt(loanAmount)}</p>
                    <p className="text-xs text-neutral-400">万円</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-neutral-400">月々返済</p>
                    <p className="text-base font-bold text-navy-500 mt-0.5">
                      {fmt(Math.round(monthlyLoanYen / 1000))}
                    </p>
                    <p className="text-xs text-neutral-400">千円</p>
                  </div>
                </div>

                {/* 資金計画サマリー */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-bold text-navy-500 mb-2 border-l-2 border-orange-500 pl-2">
                    資金計画
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {[
                        ['物件価格', fmtMan(propertyPrice)],
                        ['諸費用', fmtMan(miscExpenses)],
                        ['必要総資金', fmtMan(totalFunds), true],
                        ['自己資金', fmtMan(equity)],
                        ['借入金額', fmtMan(loanAmount), false, true],
                        ['自己資金比率', equityRatio.toFixed(1) + '%'],
                      ].map(([label, value, bold, orange]) => (
                        <tr
                          key={String(label)}
                          className="border-b border-neutral-50 last:border-0"
                        >
                          <td className="py-1 text-neutral-500">{label}</td>
                          <td
                            className={`py-1 text-right font-medium ${orange ? 'text-orange-500' : bold ? 'text-navy-500' : 'text-neutral-700'}`}
                          >
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 収支計画サマリー */}
                <div className="px-4 pt-1 pb-3">
                  <p className="text-xs font-bold text-navy-500 mb-2 border-l-2 border-orange-500 pl-2">
                    収支計画
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {[
                        ['月額家賃収入', fmtMan(monthlyRentPlan)],
                        ['実効家賃収入', effectiveRent.toFixed(2) + '万円'],
                        ['月額ローン返済', yen(monthlyLoanYen)],
                        ['月次手取り', monthlyCF.toFixed(2) + '万円', monthlyCF >= 0 ? 'pos' : 'neg'],
                        ['表面利回り', grossYield.toFixed(2) + '%'],
                        ['実質利回り', netYield.toFixed(2) + '%'],
                      ].map(([label, value, sign]) => (
                        <tr
                          key={String(label)}
                          className="border-b border-neutral-50 last:border-0"
                        >
                          <td className="py-1 text-neutral-500">{label}</td>
                          <td
                            className={`py-1 text-right font-medium ${
                              sign === 'pos'
                                ? 'text-success-500'
                                : sign === 'neg'
                                  ? 'text-danger-500'
                                  : 'text-neutral-700'
                            }`}
                          >
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* お客様情報 */}
                {customerName && (
                  <div className="px-4 pb-3 border-t border-neutral-100 pt-2">
                    <p className="text-xs font-bold text-navy-500 mb-2 border-l-2 border-orange-500 pl-2">
                      お客様情報
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div>
                        <span className="text-neutral-400">お名前</span>
                        <p className="font-medium text-neutral-700">{customerName}</p>
                      </div>
                      <div>
                        <span className="text-neutral-400">年収</span>
                        <p className="font-medium text-neutral-700">{fmtMan(annualIncome)}</p>
                      </div>
                      {employer && (
                        <div className="col-span-2">
                          <span className="text-neutral-400">勤務先</span>
                          <p className="font-medium text-neutral-700">{employer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Loan info */}
                <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-100 text-xs text-neutral-500 grid grid-cols-2 gap-1">
                  <span>金融機関: {lenderName || '未入力'}</span>
                  <span className="text-right">金利: {rate.toFixed(3)}%</span>
                  <span>返済期間: {termYears}年</span>
                  <span className="text-right">返済方式: {repaymentMethod}</span>
                </div>
              </div>

              {/* Export button (duplicate for convenience) */}
              <button
                onClick={handleExportPDF}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="12" x2="12" y2="18" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
                PDFで出力する
              </button>

              {/* Disclaimer */}
              <p className="text-xs text-neutral-400 text-center leading-relaxed">
                本資料はMASが作成した参考情報です。
                <br />
                実際の融資条件は金融機関にご確認ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
