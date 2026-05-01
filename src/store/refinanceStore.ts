import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RefinanceState {
  // 現在のローン
  currentBalance: number;     // 現在の残債 (円) default: 28000000
  currentRate: number;        // 現在の金利 (%) default: 1.511
  remainingYears: number;     // 残返済期間 (年) default: 28
  prepaymentPenalty: number;  // 繰上返済手数料 (円) default: 0
  currentBank: string;        // 現行銀行名 default: '楽天銀行'
  // 借り換えコスト追加
  registrationFee: number;    // 抵当権設定・抹消費用 (円) default: 150000
  autoRegistrationFee: boolean; // true = 残債から自動計算
  otherFees: number;          // その他費用 (円) default: 0
  // UI状態
  selectedBankId: string | null;
  areaFilter: string;         // '全エリア' | area
  rateTypeFilter: 'all' | '変動' | '固定';
  sortBy: 'savings' | 'breakeven' | 'rate' | 'fee';
  // actions
  set: (patch: Partial<Omit<RefinanceState, 'set'>>) => void;
}

const DEFAULT: Omit<RefinanceState, 'set'> = {
  currentBalance: 28000000,
  currentRate: 1.511,
  remainingYears: 28,
  prepaymentPenalty: 0,
  currentBank: '楽天銀行',
  registrationFee: 150000,
  autoRegistrationFee: true,
  otherFees: 0,
  selectedBankId: null,
  areaFilter: '全エリア',
  rateTypeFilter: '変動',
  sortBy: 'savings',
};

export const useRefinanceStore = create<RefinanceState>()(
  persist(
    (set) => ({
      ...DEFAULT,
      set: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    { name: 'terass-refinance-v1' }
  )
);
