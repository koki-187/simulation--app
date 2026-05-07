// 借り換え住宅ローン 金融機関データ 2026年版
// Source: 各行公式HP・ダイヤモンド不動産研究所・モゲチェック (2026年5月調査)
// NOTE: 変動金利は見直し頻度により異なる。最優遇金利を掲載。

export interface RefinanceBank2026 {
  id: string;
  name: string;
  /**
   * 借り換え専用融資実行金利 % (最優遇、適用条件は notes 参照)
   * ※新規住宅ローン金利とは異なる場合あり（newLoanRate 参照）
   */
  rate: number;
  /**
   * 同行の新規住宅ローン金利 % (借り換え金利と異なる場合のみ設定)
   * 例: 三菱UFJ は新規 0.945% に対し借り換えは 0.995%（+0.05%）
   */
  newLoanRate?: number;
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
  /** 5年ルール適用あり（変動・元利均等の場合） */
  has5YearRule: boolean;
  /** 1.25倍ルール適用あり（変動・元利均等の場合） */
  has125Rule: boolean;
  /** 金利見直しタイミング */
  rateRevision: '毎月' | '半年';
  /** 一部繰上返済手数料（この銀行への借り換え後の手数料、円） */
  prepaymentFeePartial: number;
  /** 全額繰上返済手数料（この銀行への借り換え後の手数料、円） */
  prepaymentFeeFull: number;
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
    prepaymentPenalty: true,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 2_000_000,
    maxBorrowerAge: 65,
    notes: '最安水準の変動金利。年収200万円から申込可。一部繰上返済はWeb無料・電話5,500円。全額繰上返済は電話申込33,000円。5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。金利見直し：4月・10月（半年ごと）。',
    dansin: '一般団信',
    applyDays: 30,
    has5YearRule: false,
    has125Rule: false,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 33_000,
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
    notes: 'スゴ団信（がん・脳卒中・急性心筋梗塞50%保障）が無料付帯。事務手数料2.2%。5年ルール・1.25倍ルールあり（元利均等の場合のみ）。一部繰上・全額繰上ともに変動金利期間中は無料。金利見直し：4月・10月（半年ごと）。',
    dansin: 'がん50%無料',
    applyDays: 25,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
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
    notes: '【重要】0.930%はau/UQモバイル・電気・インターネット契約セット割引（最大-0.195%）を全て適用した場合の金利。割引なしの借り換え標準金利は1.125%。LTV≤80%条件あり。がん100%保障団信が無料。一部・全額繰上は変動金利期間中無料。金利見直し：4月・10月（半年ごと）。',
    dansin: 'がん100%無料',
    applyDays: 21,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'sony',
    name: 'ソニー銀行（標準コース）',
    rate: 1.347,
    rateType: '変動',
    processingFeeType: 'flat',
    processingFeeValue: 44_000,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 4_000_000,
    maxBorrowerAge: 65,
    notes: '標準コース：事務手数料¥44,000（定額）が最大の特徴。残債が大きいほど有利。がん団信50%が無料付帯。固定↔変動の切替が自由。5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。一部・全額繰上はWeb経由で無料。金利見直し：5月・11月（半年ごと）。※2026年5月に基準金利+0.35%引上げ後の金利。',
    dansin: 'がん50%無料',
    applyDays: 30,
    has5YearRule: false,
    has125Rule: false,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'mufg',
    name: '三菱UFJ銀行（WEB型）',
    rate: 0.995,
    newLoanRate: 0.945,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 70,
    notes: 'WEB申込型・保証料不要。【注意】借り換えは新規より+0.05%（新規：0.945% → 借り換え：0.995%）。事務手数料2.2%。5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：ネット無料。全額繰上：ネット16,500円・窓口33,000円。金利見直し：4月・10月（半年ごと）。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 16_500,
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
    notes: '手数料型（手数料2.2%・保証料不要）が借り換えに最適。勤務先給与振込条件あり。5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：ネット無料。全額繰上：窓口33,000円（ネット不可）。金利見直し：4月・10月（半年ごと）。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 33_000,
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
    minAnnualIncome: 5_500_000,
    maxBorrowerAge: 70,
    notes: 'LTV≤80%で1.130%（>80%は1.180%）。事務手数料2.2%（min¥220,000）または定額¥110,000（金利+0.2%）。5年ルール・1.25倍ルールあり（元利均等の場合）。全額繰上返済手数料¥55,000（重要）。一部繰上：無料。金利見直し：5月・11月（半年ごと）。⚠️借入時年齢上限70歳（満71歳未満）・がん100%団信は満50歳未満のみ適用。',
    dansin: 'がん100%無料',
    applyDays: 30,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 55_000,
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
    notes: 'WEB申込専用・保証料不要。大手メガバンクで安心感あり。5年ルール・1.25倍ルールあり（元利均等の場合）。自然災害時残高50%免除の独自保障あり。一部繰上：SMBCダイレクト無料。全額繰上：SMBCダイレクト無料（窓口¥33,000）。金利見直し：4月・10月（半年ごと）。',
    dansin: '充実団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
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
    notes: '事務手数料が定額¥330,000。借入額≥¥15Mで2.2%型より安い。5年ルール・1.25倍ルールあり（元利均等の場合）。一部・全額繰上：マイページ経由で無料。金利見直し：毎月1日。※借り換え特別金利1.057%は年収650万円以上・給与振込条件あり。',
    dansin: '一般団信',
    applyDays: 30,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '毎月',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'sbi-shinsei',
    name: 'SBI新生銀行',
    rate: 1.080,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 0.9,
    minAnnualIncome: 3_000_000,
    maxBorrowerAge: 65,
    notes: '5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。一部・全額繰上返済手数料0円。金利見直し：5月・11月（半年ごと）。※2026年5月に基準金利+0.350%引上げ後の金利。SBIハイパー預金保有者は0.990%。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: false,
    has125Rule: false,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'resona',
    name: 'りそな銀行',
    rate: 0.950,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 500_000,
    maxLTV: 1.0,
    minAnnualIncome: 1_000_000,
    maxBorrowerAge: 70,
    notes: '5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：マイゲート経由無料。全額繰上：マイゲート（オンライン）無料・窓口/テレビ電話11,000円（変動金利）。最低借入50万円から。事務手数料：融資額×2.2%（+別途55,000円がかかるプランあり）。金利見直し：4月・10月（半年ごと）。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
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
