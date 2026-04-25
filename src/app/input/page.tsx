'use client';
import { AppShell, PatternToggle } from '@/components/layout';
import { Section, NumInput } from '@/components/ui';
import { useSimStore } from '@/store/simulatorStore';
import { yen, pct } from '@/lib/format';

function InputPanel({ pattern }: { pattern: 'A' | 'B' }) {
  const { inputA, inputB, resultA, resultB, setInputA, setInputB } = useSimStore();
  const input = pattern === 'A' ? inputA : inputB;
  const result = pattern === 'A' ? resultA : resultB;
  const set = (v: Parameters<typeof setInputA>[0]) => pattern === 'A' ? setInputA(v) : setInputB(v);

  return (
    <div className="space-y-4">
      <Section title="1. 物件情報">
        <div className="grid grid-cols-1 gap-0">
          <div className="flex items-center gap-2 py-2 border-b border-neutral-100">
            <span className="label-cell flex-1">物件名</span>
            <input value={input.propertyName} onChange={e => set({ propertyName: e.target.value })}
              className="input-cell w-48 text-left" />
          </div>
          <NumInput label="物件価格" value={input.propertyPrice} onChange={v => set({ propertyPrice: v })} fmt="currency" unit="円" />
          <div className="flex items-center gap-2 py-1.5">
            <span className="label-cell flex-1">物件種別</span>
            <select value={input.propertyType} onChange={e => set({ propertyType: e.target.value })}
              className="input-cell w-40 text-left">
              {['区分マンション','戸建て','一棟アパート','一棟マンション','商業'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="2. 資金計画">
        <NumInput label="自己資金（頭金）" value={input.equity} onChange={v => set({ equity: v })} fmt="currency" unit="円" />
        <NumInput label="諸費用" value={input.expenses} onChange={v => set({ expenses: v })} fmt="currency" unit="円" note="登記・仲介等" />
        <NumInput label="借入額（自動）" value={result.loanAmount} onChange={() => {}} fmt="currency" unit="円" readOnly />
        <NumInput label="初期投資合計（自動）" value={result.initialInvestment} onChange={() => {}} fmt="currency" unit="円" readOnly />
      </Section>

      <Section title="3. ローン条件">
        <NumInput label="金利（年）" value={input.rate} onChange={v => set({ rate: v })} fmt="percent" step={0.01} />
        <NumInput label="返済期間" value={input.termYears} onChange={v => set({ termYears: v })} fmt="years" unit="年" />
        <NumInput label="月々返済額（自動）" value={result.monthlyPayment} onChange={() => {}} fmt="currency" unit="円/月" readOnly />
        <NumInput label="総支払額（自動）" value={result.totalPayment} onChange={() => {}} fmt="currency" unit="円" readOnly />
        <NumInput label="総利息（自動）" value={result.totalInterest} onChange={() => {}} fmt="currency" unit="円" readOnly />
      </Section>

      <Section title="4. 運用計画">
        <NumInput label="家賃収入（月）" value={input.monthlyRent} onChange={v => set({ monthlyRent: v })} fmt="currency" unit="円/月" />
        <NumInput label="管理費（月）" value={input.managementFee} onChange={v => set({ managementFee: v })} fmt="currency" unit="円/月" />
        <NumInput label="修繕積立金（月）" value={input.repairFund} onChange={v => set({ repairFund: v })} fmt="currency" unit="円/月" />
        <NumInput label="その他費用（月）" value={input.otherExpenses} onChange={v => set({ otherExpenses: v })} fmt="currency" unit="円/月" />
        <NumInput label="空室率" value={input.vacancyRate} onChange={v => set({ vacancyRate: v })} fmt="percent" step={0.01} />
        <NumInput label="実効家賃（自動）" value={result.effectiveMonthlyRent} onChange={() => {}} fmt="currency" unit="円/月" readOnly />
        <NumInput label="固都税（年）" value={input.fixedAssetTax} onChange={v => set({ fixedAssetTax: v })} fmt="currency" unit="円/年" />
        <NumInput label="表面利回り（自動）" value={result.ratios.grossYield} onChange={() => {}} fmt="percent" readOnly />
        <NumInput label="実質利回り（自動）" value={result.ratios.netYield} onChange={() => {}} fmt="percent" readOnly />
      </Section>

      <Section title="5. 減価償却">
        <NumInput label="建物割合" value={input.buildingRatio} onChange={v => set({ buildingRatio: v })} fmt="percent" step={0.01} />
        <NumInput label="躯体耐用年数" value={input.structureDepYears} onChange={v => set({ structureDepYears: v })} fmt="years" />
        <NumInput label="設備耐用年数" value={input.equipmentDepYears} onChange={v => set({ equipmentDepYears: v })} fmt="years" />
        <NumInput label="年間減価償却費（自動）" value={result.annualDepreciation} onChange={() => {}} fmt="currency" unit="円/年" readOnly />
      </Section>

      <Section title="6. 売却・保有">
        <NumInput label="保有年数" value={input.holdingYears} onChange={v => set({ holdingYears: v })} fmt="years" />
        <NumInput label="年間資産成長率" value={input.growthRate} onChange={v => set({ growthRate: v })} fmt="percent" step={0.001} />
      </Section>

      <Section title="7. 年収情報（比率計算用）">
        <NumInput label="年収（源泉徴収票）" value={input.annualIncomeTaxBase} onChange={v => set({ annualIncomeTaxBase: v })} fmt="currency" unit="円/年" />
        <NumInput label="年収（確定申告所得）" value={input.annualIncomeDeclared} onChange={v => set({ annualIncomeDeclared: v })} fmt="currency" unit="円/年" />
      </Section>
    </div>
  );
}

export default function InputPage() {
  const { activePattern, setActivePattern } = useSimStore();
  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">入力フォーム</h1>
          <p className="text-xs text-navy-100">物件情報・ローン・運用条件の入力</p>
        </div>
        <PatternToggle />
      </div>
      <div className="p-6">
        {activePattern === 'compare' ? (
          <div className="grid grid-cols-2 gap-6">
            <div><h2 className="text-sm font-bold text-orange-500 mb-3">Pattern A</h2><InputPanel pattern="A" /></div>
            <div><h2 className="text-sm font-bold text-orange-300 mb-3">Pattern B</h2><InputPanel pattern="B" /></div>
          </div>
        ) : (
          <div className="max-w-xl"><InputPanel pattern={activePattern === 'B' ? 'B' : 'A'} /></div>
        )}
      </div>
    </AppShell>
  );
}
