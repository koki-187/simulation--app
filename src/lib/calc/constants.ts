/** 税率定数 */
export const LONG_TERM_CG_TAX_RATE = 0.20315;   // 長期譲渡所得税率（5年超）
export const SHORT_TERM_CG_TAX_RATE = 0.3963;   // 短期譲渡所得税率（5年以下）

/** デフォルト銀行オプション */
export const DEFAULT_BANK_OPTIONS = [
  { label: '住信SBI（変動）',       rate: 0.0032,  termYears: 35 },
  { label: 'au じぶん銀行（変動）', rate: 0.00339, termYears: 35 },
  { label: 'イオン銀行（変動）',    rate: 0.0038,  termYears: 35 },
  { label: 'みずほ銀行（変動）',    rate: 0.00375, termYears: 35 },
  { label: 'フラット35（固定）',    rate: 0.0182,  termYears: 35 },
] as const;
