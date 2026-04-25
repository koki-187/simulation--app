export interface SimInput {
  // Section 1: Property
  propertyName: string;
  propertyPrice: number;        // 物件価格
  propertyType: string;         // 物件種別
  location: string;             // 所在地

  // Section 2: Finance
  equity: number;               // 自己資金 (頭金)
  expenses: number;             // 諸費用

  // Section 3: Loan
  rate: number;                 // 金利 (annual, decimal: 0.02)
  termYears: number;            // 返済期間 (years)
  lender?: string;              // 金融機関名

  // Section 4: Operations
  monthlyRent: number;          // 家賃収入（月）
  managementFee: number;        // 管理費（月）
  repairFund: number;           // 修繕積立金（月）
  otherExpenses: number;        // その他費用（月）
  vacancyRate: number;          // 空室率 (decimal: 0.05)
  managementType: 'shukkin' | 'sublease' | 'self';  // 管理形態
  fixedAssetTax: number;        // 固都税（年）

  // Section 5: Depreciation
  buildingRatio: number;        // 建物割合
  structurePrice: number;       // 躯体価格 (optional, calculated from buildingRatio)
  equipmentPrice: number;       // 設備価格
  structureDepYears: number;    // 躯体耐用年数 (RC=47, W=22)
  equipmentDepYears: number;    // 設備耐用年数 (15)

  // Section 6: Exit
  holdingYears: number;         // 保有年数
  growthRate: number;           // 年間資産成長率 (decimal: 0.005)

  // Section 7: Owner income (for ratios)
  annualIncomeTaxBase: number;  // 年収（源泉）
  annualIncomeDeclared: number; // 年収（申告所得）
}

export interface AmortRow {
  no: number;
  year: number;
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  cumInterest: number;
  cumPrincipal: number;
}

export interface DepRow {
  year: number;
  structureAnnual: number;
  equipmentAnnual: number;
  totalAnnual: number;
  structureRemaining: number;
  equipmentRemaining: number;
  totalRemaining: number;
  cumDepreciation: number;
}

export interface CFRow {
  year: number;
  rentalIncome: number;          // 家賃収入（年）実効
  managementCosts: number;       // 管理費+修繕+その他（年）
  fixedAssetTax: number;         // 固都税
  operatingCF: number;           // 運営CF = 家賃 - 管理 - 固都税
  annualLoanPayment: number;     // 年間ローン返済
  loanInterest: number;          // うち利息（年）
  preTaxCF: number;              // 税前CF = 運営CF - ローン返済
  depreciation: number;          // 減価償却費
  taxableIncome: number;         // 課税所得 = 家賃 - 管理 - 固都税 - 利息 - 減価償却
  incomeTax: number;             // 所得税+住民税概算
  afterTaxCF: number;            // 税引後CF
  cumulativeCF: number;          // 累計CF
  loanBalance: number;           // ローン残債
}

export interface SaleScenario {
  label: string;
  multiplier: number;
  salePrice: number;
  loanBalance: number;
  sellingCosts: number;          // 売却費用 3%
  preTaxProfit: number;          // 税引前手残り
  acquisitionCost: number;       // 取得費
  accumulatedDep: number;        // 累計減価償却
  taxableGain: number;           // 譲渡所得
  capitalGainsTax: number;       // 譲渡所得税
  afterTaxProfit: number;        // 税引後手残り
  cagr: number;                  // CAGR
  investmentMultiple: number;    // 投資倍率
  holdingYears: number;
}

export interface TaxDetail {
  // 不動産所得
  rentalRevenue: number;
  managementExp: number;
  repairExp: number;
  insuranceEst: number;
  fixedAssetTax: number;
  depreciation: number;
  loanInterest: number;
  totalExpenses: number;
  realEstateIncome: number;
  incomeTaxRate: number;
  incomeTax: number;
  residentTax: number;
  totalTaxBurden: number;

  // 譲渡所得
  holdingYears: number;
  isLongTerm: boolean;
  taxRate: number;
  salePrice: number;
  acquisitionCost: number;
  accumulatedDep: number;
  sellingCosts: number;
  taxableGain: number;
  capitalGainsTax: number;
}

export interface Ratios {
  grossYield: number;            // 表面利回り
  netYield: number;              // 実質利回り
  repaymentRatio: number;        // 返済比率（月収ベース）
  incomeMultipleTax: number;     // 年収倍率（源泉）
  incomeMultipleDeclared: number; // 年収倍率（申告）
  repaymentRatioTax: number;     // 返済比率（源泉）
  repaymentRatioDeclared: number; // 返済比率（申告）
  breakevenRent: number;         // 損益分岐点賃料
  dscr: number;                  // DSCR
}

export interface BankOption {
  name: string;
  rate: number;
  type: '変動' | '固定';
  termYears: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface SimResult {
  input: SimInput;
  loanAmount: number;
  initialInvestment: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  effectiveMonthlyRent: number;
  structurePrice: number;
  equipmentPrice: number;
  annualStructureDep: number;
  annualEquipmentDep: number;
  annualDepreciation: number;
  amortization: AmortRow[];
  depreciation: DepRow[];
  cashFlows: CFRow[];
  saleScenarios: SaleScenario[];
  taxDetail: TaxDetail;
  ratios: Ratios;
  banks: BankOption[];
}
