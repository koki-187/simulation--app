import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PrepayEvent {
  id: string;
  yearAfter: number;
  amount: number; // 万円
  type: '期間短縮型' | '返済額軽減型';
}

export interface HomeLoanState {
  // 物件情報
  propertyPrice: number;   // 万円
  equity: number;          // 万円
  expenses: number;        // 万円
  // ローン条件
  rateType: '変動' | '固定';
  annualRate: number;      // %
  termYears: number;
  // 年収・税
  annualIncome: number;    // 万円
  taxRate: number;         // %
  deductionEnabled: boolean;
  isNew: boolean;
  entryYear: number;
  // 月次費用
  mgmtFee: number;         // 万円/月
  showExtras: boolean;
  // 繰上げ返済
  events: PrepayEvent[];
  // actions
  set: (patch: Partial<Omit<HomeLoanState, 'set'>>) => void;
  reset: () => void;
}

const DEFAULT: Omit<HomeLoanState, 'set' | 'reset'> = {
  propertyPrice: 4500,
  equity: 500,
  expenses: 150,
  rateType: '変動',
  annualRate: 0.5,
  termYears: 35,
  annualIncome: 600,
  taxRate: 20,
  deductionEnabled: true,
  isNew: true,
  entryYear: 2026,
  mgmtFee: 2,
  showExtras: false,
  events: [],
};

export const useHomeLoanStore = create<HomeLoanState>()(
  persist(
    (set) => ({
      ...DEFAULT,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(() => ({ ...DEFAULT })),
    }),
    { name: 'terass-home-loan-v1' }
  )
);
