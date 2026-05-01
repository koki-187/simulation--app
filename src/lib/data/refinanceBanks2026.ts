// 借り換え住宅ローン 金融機関データ 2026年版
// Source: Research agent — rates as of 2026年4月〜5月
// NOTE: 変動金利は半年ごとに見直し。最優遇金利を掲載。

export interface RefinanceBank2026 {
  id: string;
  name: string;
  /** 変動金利 % (最優遇、適用条件は notes 参照) */
  rate: number;
  rateType: '変動' | '固定10年' | '固定35年';
  /** percent → 借入額 × processingFeeValue; flat → processingFeeValue 円 */
  processingFeeType: 'percent' | 'flat';
  processingFeeValue: number;
  /** 保証料が別途かかるか */
  guaranteeFeeRequired: boolean;
  /** 繰上返済手数料あり */
  prepaymentPenalty: boolean;
  minLoanAmount: number;
  maxLTV: number;           // 例 1.0 = 100%
  minAnnualIncome: number;  // 0 = 非公開
  maxBorrowerAge: number;   // 借入時の上限年齢
  notes: string;
  /** 団信の種類 */
  dansin: 'がん100%無料' | 'がん50%無料' | '一般団信' | '充実団信';
  /** 審査〜融資の目安日数 */
  applyDays: number;
}

export const REFINANCE_BANKS_2026: RefinanceBank2026[] = [
  {
    id: 'paypay',
    name: 'PayPay銀行',
    rate: 0.850,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 2_000_000,
    maxBorrowerAge: 65,
    notes: '最安水準の変動金利。年収200万円から申込可。全額繰上返済も無料。事務手数料2.2%。',
    dansin: '一般団信',
    applyDays: 30,
  },
  {
    id: 'sbi-sumishin',
    name: '住信SBIネット銀行',
    rate: 0.950,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 500_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 65,
    notes: 'スゴ団信（がん・脳卒中・急性心筋梗塞50%保障）が無料付帯。事務手数料2.2%。',
    dansin: 'がん50%無料',
    applyDays: 25,
  },
  {
    id: 'au-jibun',
    name: 'auじぶん銀行',
    rate: 0.930,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 0.8,
    minAnnualIncome: 2_000_000,
    maxBorrowerAge: 65,
    notes: 'au/UQモバイル・電気・インターネット契約で最大-0.15%優遇。LTV≤80%で最優遇金利0.930%（表面1.134%）。事務手数料2.2%。',
    dansin: 'がん100%無料',
    applyDays: 21,
  },
  {
    id: 'sony',
    name: 'ソニー銀行（標準コース）',
    rate: 0.997,
    rateType: '変動',
    processingFeeType: 'flat',
    processingFeeValue: 44_000,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 4_000_000,
    maxBorrowerAge: 65,
    notes: '標準コース：事務手数料¥44,000（定額）が最大の特徴。残債が大きいほど有利。がん団信50%が無料付帯。固定↔変動の切替が自由。',
    dansin: 'がん50%無料',
    applyDays: 30,
  },
  {
    id: 'mufg',
    name: '三菱UFJ銀行（WEB型）',
    rate: 0.995,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 70,
    notes: 'WEB申込型・保証料不要。借り換えは新規より+0.05%（新規0.945%）。事務手数料2.2%。全国対応。',
    dansin: '一般団信',
    applyDays: 45,
  },
  {
    id: 'mizuho',
    name: 'みずほ銀行（手数料型）',
    rate: 1.025,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 65,
    notes: '手数料型（手数料2.2%・保証料不要）が借り換えに最適。勤務先給与振込条件あり。最優遇金利1.025%。',
    dansin: '一般団信',
    applyDays: 45,
  },
  {
    id: 'aeon',
    name: 'イオン銀行',
    rate: 1.130,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: true,
    minLoanAmount: 2_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 1_000_000,
    maxBorrowerAge: 71,
    notes: 'LTV≤80%で1.130%（>80%は1.180%）。事務手数料2.2%（min¥220,000）。定額¥110,000型は+0.2%金利上乗せ。全額繰上返済手数料¥55,000に注意。',
    dansin: 'がん100%無料',
    applyDays: 30,
  },
  {
    id: 'smbc',
    name: '三井住友銀行（WEB型）',
    rate: 1.275,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 70,
    notes: 'WEB申込専用・保証料不要。大手メガバンクで最高水準の金利。自然災害時残高50%免除の独自保障あり。',
    dansin: '充実団信',
    applyDays: 45,
  },
  {
    id: 'rakuten',
    name: '楽天銀行',
    rate: 1.333,
    rateType: '変動',
    processingFeeType: 'flat',
    processingFeeValue: 330_000,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 4_000_000,
    maxBorrowerAge: 65,
    notes: '事務手数料が定額¥330,000。借入額≥¥15Mで2.2%型より安い。金利は高めだが手数料メリットあり。変動金利（固定特約付き）。',
    dansin: '一般団信',
    applyDays: 30,
  },
];

/**
 * 借入額に応じた事務手数料を計算
 */
export function calcProcessingFee(bank: RefinanceBank2026, loanAmount: number): number {
  if (bank.processingFeeType === 'percent') {
    return loanAmount * bank.processingFeeValue;
  }
  return bank.processingFeeValue;
}
