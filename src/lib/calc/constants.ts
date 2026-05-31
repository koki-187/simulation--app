/** 税率定数 */
export const LONG_TERM_CG_TAX_RATE = 0.20315;   // 長期譲渡所得税率（5年超）
export const SHORT_TERM_CG_TAX_RATE = 0.3963;   // 短期譲渡所得税率（5年以下）

/** 投資用ローン基準金利（2026年5月時点）
 *  都心RC区分マンション向け: オリックス銀行・スルガ銀行・あすか信用組合等の平均帯
 *  変動: 1.8〜2.5%、固定・ノンバンク: 2.5〜4%
 */
export const INVESTMENT_LOAN_STANDARD_RATE = 0.025;  // 基準金利 2.50%

/** デフォルト銀行オプション */
export const DEFAULT_BANK_OPTIONS = [
  { label: '住信SBI（変動）',       rate: 0.0032,  termYears: 35 },
  { label: 'au じぶん銀行（変動）', rate: 0.00339, termYears: 35 },
  { label: 'イオン銀行（変動）',    rate: 0.0038,  termYears: 35 },
  { label: 'みずほ銀行（変動）',    rate: 0.00375, termYears: 35 },
  { label: 'フラット35（固定）',    rate: 0.0182,  termYears: 35 },
] as const;
