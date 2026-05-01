// 現行銀行の全額繰上返済手数料（借り換え時に現行銀行へ支払う）
// Source: 各行公式HP・比較サイト (2026年5月調査)
// ※ 変動金利・オンライン/電話申込での最安手数料を掲載

export interface CurrentBankExitFee {
  bankName: string;
  /** 全額繰上返済手数料（変動金利期間中、円） */
  fullPrepaymentFee: number;
  notes: string;
}

export const CURRENT_BANK_EXIT_FEES: CurrentBankExitFee[] = [
  { bankName: '楽天銀行',         fullPrepaymentFee: 0,      notes: 'マイページ経由で無料' },
  { bankName: 'PayPay銀行',       fullPrepaymentFee: 33_000, notes: '電話申込33,000円（変動）' },
  { bankName: '住信SBIネット銀行', fullPrepaymentFee: 0,      notes: '変動金利期間中は無料' },
  { bankName: 'auじぶん銀行',      fullPrepaymentFee: 0,      notes: '変動金利期間中は無料（電話申込）' },
  { bankName: 'ソニー銀行',        fullPrepaymentFee: 0,      notes: 'Web経由で無料' },
  { bankName: 'SBI新生銀行',       fullPrepaymentFee: 0,      notes: '電話申込で無料' },
  { bankName: '三菱UFJ銀行',       fullPrepaymentFee: 16_500, notes: 'インターネット16,500円・窓口33,000円' },
  { bankName: 'みずほ銀行',        fullPrepaymentFee: 33_000, notes: '窓口のみ33,000円（ネット不可）' },
  { bankName: '三井住友銀行',      fullPrepaymentFee: 0,      notes: 'SMBCダイレクト無料（窓口¥33,000）' },
  { bankName: 'りそな銀行',        fullPrepaymentFee: 0,      notes: 'マイゲート（オンライン）無料（窓口¥11,000）' },
  { bankName: '埼玉りそな銀行',    fullPrepaymentFee: 0,      notes: 'マイゲート（オンライン）無料（窓口¥11,000）' },
  { bankName: 'イオン銀行',        fullPrepaymentFee: 55_000, notes: '55,000円（変動・固定共通）' },
  { bankName: 'フラット35',        fullPrepaymentFee: 0,      notes: '無料' },
  { bankName: 'ARUHI',            fullPrepaymentFee: 0,      notes: 'フラット35は無料' },
  { bankName: '三井住友信託銀行',  fullPrepaymentFee: 22_000, notes: '窓口22,000円' },
  { bankName: '横浜銀行',          fullPrepaymentFee: 33_000, notes: '窓口33,000円〜44,000円（変動）' },
  { bankName: '千葉銀行',          fullPrepaymentFee: 33_000, notes: '窓口33,000円' },
  { bankName: 'ろうきん',          fullPrepaymentFee: 3_300,  notes: '変動金利2,200〜3,300円' },
  { bankName: '中央労働金庫',      fullPrepaymentFee: 3_300,  notes: '変動金利2,200〜3,300円' },
  { bankName: 'ゆうちょ銀行',      fullPrepaymentFee: 0,      notes: 'フラット35は無料' },
];

/**
 * 銀行名（部分一致）から現行銀行の全額繰上返済手数料を検索する
 * @returns マッチした場合はExitFeeオブジェクト、見つからない場合はnull
 */
export function findExitFee(bankName: string): CurrentBankExitFee | null {
  if (!bankName || bankName.trim().length < 2) return null;
  const normalized = bankName.replace(/\s+/g, '').toLowerCase();
  // Exact match first
  const exact = CURRENT_BANK_EXIT_FEES.find(f =>
    f.bankName.replace(/\s+/g, '').toLowerCase() === normalized
  );
  if (exact) return exact;
  // Partial match
  return CURRENT_BANK_EXIT_FEES.find(f => {
    const fName = f.bankName.replace(/\s+/g, '').toLowerCase();
    return normalized.includes(fName) || fName.includes(normalized);
  }) ?? null;
}
