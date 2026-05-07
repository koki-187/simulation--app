// 借り換え住宅ローン 金融機関データ 2026年版
// Source: 各行公式HP・ダイヤモンド不動産研究所・モゲチェック・価格.com (2026年5月7日 全行公式サイト実調査)
// NOTE: rate は借り換え専用融資実行金利（最優遇）。新規住宅ローン金利と異なる場合は newLoanRate に新規金利を記載。

export interface RefinanceBank2026 {
  id: string;
  name: string;
  /**
   * 借り換え専用融資実行金利 % (最優遇、適用条件は notes 参照)
   * ※新規住宅ローン金利とは異なる場合あり（newLoanRate 参照）
   */
  rate: number;
  /**
   * 同行の新規住宅ローン金利 %（借り換え金利と異なる場合のみ設定）
   * - 値が rate より高い → 借り換えの方が有利（楽天銀行等）
   * - 値が rate より低い → 新規の方が有利（三菱UFJ・auじぶん等）
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
  // ──────────────────────────────────────────────────────────────────────────
  // ネット銀行（最安水準）
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'paypay',
    name: 'PayPay銀行',
    rate: 0.850,
    // 新規・借り換えで金利差なし
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: true,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 2_000_000,
    maxBorrowerAge: 65,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。0.850%はSoftBank/Y!mobileスマホ+ネット+でんきの3サービス契約による最大優遇（-0.130%）適用後。割引なしの基本金利は0.980%。年収200万円から申込可。一部繰上：Web無料・電話5,500円。全額繰上：33,000円。5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。金利見直し：4月・10月（半年ごと）。2026年4月1日基準金利改定済み。',
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
    // 変動金利は新規・借り換えで同率。固定10年は借り換えが新規より約0.22%低い（借り換え有利）
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 500_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 65,
    notes: '【借り換え＝新規 同一金利（変動）】変動金利は新規・借り換えで同率0.950%。ただし固定10年は借り換えが2.289%、新規が2.509%（借り換えの方が-0.22%有利）。スゴ団信（がん・脳卒中・急性心筋梗塞50%保障）が50歳以下に無料付帯。LTV80%超は金利上乗せあり。フラット35借り換えキャンペーン（2026年6月30日まで）：事務手数料0.99%に引き下げ。一部繰上・全額繰上とも変動金利期間中は無料。金利見直し：毎月1日（2025年12月より毎月見直しに変更）。',
    dansin: 'がん50%無料',
    applyDays: 25,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '毎月',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'au-jibun',
    name: 'auじぶん銀行',
    rate: 1.125,
    newLoanRate: 1.080,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 0.8,
    minAnnualIncome: 2_000_000,
    maxBorrowerAge: 65,
    notes: '【注意】借り換えは新規より+0.045%高い（新規：1.080% → 借り換え：1.125%）。1.125%は一般団信・LTV≤80%・au金利優遇割（au PAY+J:COM NET+J:COM TV+コミュファ光の契約状況に応じ最大-0.15%）適用後の借り換え金利。au各種割引の適用なし基本金利はさらに高い。がん50%団信選択時は1.179%（借り換え）。LTV≤80%条件あり（>80%は+0.045%上乗せ）。がん100%保障団信が+0.05%で付帯可。一部・全額繰上は変動金利期間中無料。金利見直し：毎月（2025年以降）。51歳以上はがん保障プラン加入不可。',
    dansin: 'がん100%無料',
    applyDays: 21,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '毎月',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  {
    id: 'rakuten',
    name: '楽天銀行',
    rate: 1.057,
    newLoanRate: 1.333,
    rateType: '変動',
    processingFeeType: 'flat',
    processingFeeValue: 330_000,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 4_000_000,
    maxBorrowerAge: 65,
    notes: '【借り換えが新規より有利】借り換え専用金利1.057%、新規変動金利1.333%（借り換えの方が-0.276%低い）。事務手数料が定額¥330,000（借入額によらず一律）で、残債≥¥15Mで2.2%型より安い。全疾病特約付団信・がん50%保障団信が無料付帯。他行口座を返済口座にした場合は金利+0.30%（楽天銀行口座の開設推奨）。一部・全額繰上：マイページ経由で無料。金利見直し：毎月1日。5年ルール・1.25倍ルールあり（元利均等の場合）。2026年4月1.102%→5月1.057%にさらに引き下げ。',
    dansin: 'がん50%無料',
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
    // 新規・借り換えで金利差なし
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 0.9,
    minAnnualIncome: 3_000_000,
    maxBorrowerAge: 65,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。SBIハイパー預金口座開設で0.990%（-0.09%優遇）。5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。一部・全額繰上返済手数料0円。自行既存ローンへの借り換えは不可。2026年5月1日に基準金利+0.350%引上げ（他行平均+0.250%より大きい）。金利見直し：5月・11月（半年ごと）。固定10年：2.65%（自己資金10%以上：2.63%）。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: false,
    has125Rule: false,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  // ──────────────────────────────────────────────────────────────────────────
  // メガバンク・準大手
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'resona',
    name: 'りそな銀行',
    rate: 0.950,
    // 新規・借り換えで金利差なし
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 500_000,
    maxLTV: 1.0,
    minAnnualIncome: 1_000_000,
    maxBorrowerAge: 70,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。基準金利3.125%から最大▲2.175%優遇。事務手数料：融資手数料型（融資額×2.2%+保証会社手数料¥55,000）または金利上乗せ型（初期費用なし・金利+0.3%）。「団信革命」（3大疾病・要介護状態カバー）が選択可。一部繰上：マイゲート（オンライン）無料。全額繰上：マイゲート無料・窓口/テレビ電話¥11,000。最低借入50万円から（メガバンク最低水準）。5年ルール・1.25倍ルールあり（元利均等の場合）。金利見直し：4月・10月（半年ごと）。2026年4月に0.31%引上げ済み。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
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
    notes: '【注意】借り換えは新規より+0.05%高い（新規：0.945% → 借り換え：0.995%）。WEB申込型・保証料不要（店頭申込より金利優遇が大きい）。借り換えの借入期間上限35年（新規は40年）。事務手数料2.2%。固定10年：3.15%（新規・借り換え同率）。5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：ネット無料。全額繰上：ネット¥16,500・窓口¥33,000。金利見直し：4月・10月（半年ごと）。最高借入3億円（ペアローン各2億円）。',
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
    // 新規・借り換えで金利差なし
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 500_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 65,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。手数料型（手数料2.2%・保証料金利内包）が借り換えに最適。◆「借入時負担ゼロ型」：初期費用0円（手数料・保証料不要）の国内唯一プラン。ただし金利が+0.2%上乗せ（最優遇時1.225%）。◆査定額が下がっていても一定条件で借り換え可能。5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：ネット無料。全額繰上：窓口¥33,000。最低借入50万円・最高3億円。金利見直し：4月・10月（半年ごと）。',
    dansin: '一般団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 33_000,
  },
  {
    id: 'smbc',
    name: '三井住友銀行（WEB型）',
    rate: 1.325,
    newLoanRate: 1.075,
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 1_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 0,
    maxBorrowerAge: 70,
    notes: '【注意】借り換えは新規より+0.25%高い（新規：1.075% → 借り換え：1.325%）。金利差が大きく、借り換えコストが他行より高め。WEB申込専用・保証料不要。Oliveアカウント連携でVポイント最大20万pt還元あり。自然災害時残高50%免除の独自保障付き。5年ルール・1.25倍ルールあり（元利均等の場合）。一部繰上：SMBCダイレクト無料。全額繰上：SMBCダイレクト無料（窓口¥33,000）。金利見直し：4月・10月（半年ごと）。',
    dansin: '充実団信',
    applyDays: 45,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 0,
  },
  // ──────────────────────────────────────────────────────────────────────────
  // 流通系・その他
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'aeon',
    name: 'イオン銀行',
    rate: 1.130,
    // 新規・借り換えで金利差なし（LTV≤80%の場合）
    rateType: '変動',
    processingFeeType: 'percent',
    processingFeeValue: 0.022,
    guaranteeFeeRequired: false,
    prepaymentPenalty: true,
    minLoanAmount: 2_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 5_500_000,
    maxBorrowerAge: 70,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。LTV≤80%で1.130%、LTV>80%は1.180%。事務手数料：定率型2.2%（min¥220,000）または定額型¥110,000（金利+0.2%）。全額繰上返済手数料¥55,000（⚠️重要）。一部繰上：無料。イオンセレクトクラブ加入で完済まで毎日5%イオン割引特典あり。最長返済期間50年（35年超は金利+0.1%）。5年ルール・1.25倍ルールあり（元利均等の場合）。金利見直し：5月・11月（半年ごと）。⚠️借入時年齢上限70歳（満71歳未満）・がん100%団信は満50歳未満のみ適用。',
    dansin: 'がん100%無料',
    applyDays: 30,
    has5YearRule: true,
    has125Rule: true,
    rateRevision: '半年',
    prepaymentFeePartial: 0,
    prepaymentFeeFull: 55_000,
  },
  {
    id: 'sony',
    name: 'ソニー銀行（標準コース）',
    rate: 1.347,
    // 新規・借り換えで金利差なし
    rateType: '変動',
    processingFeeType: 'flat',
    processingFeeValue: 44_000,
    guaranteeFeeRequired: false,
    prepaymentPenalty: false,
    minLoanAmount: 5_000_000,
    maxLTV: 1.0,
    minAnnualIncome: 4_000_000,
    maxBorrowerAge: 65,
    notes: '【借り換え＝新規 同一金利】新規・借り換えで変動金利に差なし。◆標準コース（このエントリー）：事務手数料¥44,000（定額）が特徴。残債が大きいほど有利。◆変動セレクトコース：事務手数料2.2%（定率）・金利1.347%。◆固定セレクトコース（10年固定専用）：3.095%。がん50%保障団信が無料付帯。固定↔変動の切替自由。物件購入価格超の借入は+0.05%上乗せ。5年ルール・1.25倍ルールなし（金利変動が即返済額に反映）。一部・全額繰上はWeb無料。最低借入500万円・最高2億円。金利見直し：5月・11月（半年ごと）。2026年5月基準金利+0.35%引上げ後の金利。',
    dansin: 'がん50%無料',
    applyDays: 30,
    has5YearRule: false,
    has125Rule: false,
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
