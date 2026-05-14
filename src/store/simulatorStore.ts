'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimInput, SimResult } from '@/lib/calc/types';
import { safeSimulate, DEFAULT_INPUT_A, DEFAULT_INPUT_B } from '@/lib/calc/simulate';

function sanitizeInput(input: Partial<SimInput>): Partial<SimInput> {
  const s = { ...input };
  if (s.propertyPrice !== undefined) s.propertyPrice = Math.max(0, s.propertyPrice || 0);
  if (s.equity !== undefined) s.equity = Math.max(0, s.equity || 0);
  if (s.expenses !== undefined) s.expenses = Math.max(0, s.expenses || 0);
  if (s.rate !== undefined) s.rate = Math.max(0.001, Math.min(0.30, s.rate || 0.02));
  if (s.termYears !== undefined) s.termYears = Math.max(1, Math.min(50, Math.round(s.termYears || 35)));
  if (s.monthlyRent !== undefined) s.monthlyRent = Math.max(0, s.monthlyRent || 0);
  if (s.managementFee !== undefined) s.managementFee = Math.max(0, s.managementFee || 0);
  if (s.repairFund !== undefined) s.repairFund = Math.max(0, s.repairFund || 0);
  if (s.otherExpenses !== undefined) s.otherExpenses = Math.max(0, s.otherExpenses || 0);
  if (s.vacancyRate !== undefined) s.vacancyRate = Math.max(0, Math.min(0.99, s.vacancyRate || 0));
  if (s.fixedAssetTax !== undefined) s.fixedAssetTax = Math.max(0, s.fixedAssetTax || 0);
  if (s.buildingRatio !== undefined) s.buildingRatio = Math.max(0, Math.min(1, s.buildingRatio || 0.6));
  if (s.structureDepYears !== undefined) s.structureDepYears = Math.max(1, Math.min(100, Math.round(s.structureDepYears || 47)));
  if (s.equipmentDepYears !== undefined) s.equipmentDepYears = Math.max(1, Math.min(50, Math.round(s.equipmentDepYears || 15)));
  if (s.holdingYears !== undefined) s.holdingYears = Math.max(1, Math.min(50, Math.round(s.holdingYears || 10)));
  if (s.growthRate !== undefined) s.growthRate = Math.max(-0.5, Math.min(0.5, s.growthRate || 0));
  if (s.annualIncomeTaxBase !== undefined) s.annualIncomeTaxBase = Math.max(0, s.annualIncomeTaxBase || 0);
  if (s.annualIncomeDeclared !== undefined) s.annualIncomeDeclared = Math.max(0, s.annualIncomeDeclared || 0);
  // Replace NaN/Infinity with 0 for any number field
  for (const key of Object.keys(s)) {
    const val = (s as Record<string, unknown>)[key];
    if (typeof val === 'number' && !isFinite(val)) {
      (s as Record<string, unknown>)[key] = 0;
    }
  }
  return s;
}

interface SimStore {
  inputA: SimInput;
  inputB: SimInput;
  resultA: SimResult;
  resultB: SimResult;
  activePattern: 'A' | 'B' | 'compare';
  setInputA: (input: Partial<SimInput>) => void;
  setInputB: (input: Partial<SimInput>) => void;
  setActivePattern: (p: 'A' | 'B' | 'compare') => void;
  recalculate: () => void;
}

export const useSimStore = create<SimStore>()(
  persist(
    (set) => ({
      inputA: DEFAULT_INPUT_A,
      inputB: DEFAULT_INPUT_B,
      resultA: safeSimulate(DEFAULT_INPUT_A),
      resultB: safeSimulate(DEFAULT_INPUT_B),
      activePattern: 'A',

      setInputA: (partial) => set(s => {
        const newInput = { ...s.inputA, ...sanitizeInput(partial) };
        return { inputA: newInput, resultA: safeSimulate(newInput) };
      }),
      setInputB: (partial) => set(s => {
        const newInput = { ...s.inputB, ...sanitizeInput(partial) };
        return { inputB: newInput, resultB: safeSimulate(newInput) };
      }),
      setActivePattern: (p) => set({ activePattern: p }),
      recalculate: () => set(s => ({
        resultA: safeSimulate(s.inputA),
        resultB: safeSimulate(s.inputB),
      })),
    }),
    {
      name: 'mas-sim-store',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        // Strip any stale computed fields (resultA/resultB) from old localStorage versions.
        // Old versions stored the full SimResult which may lack the `input` field.
        const s = (persistedState as Record<string, unknown>) ?? {};
        const inputA = s.inputA as Record<string, unknown> | undefined;
        const inputB = s.inputB as Record<string, unknown> | undefined;

        // Validate that critical numeric fields exist and are finite numbers
        const isValidInput = (inp: unknown): inp is SimInput => {
          if (!inp || typeof inp !== 'object') return false;
          const i = inp as Record<string, unknown>;
          const requiredNums = ['propertyPrice', 'rate', 'termYears', 'monthlyRent', 'holdingYears'];
          return requiredNums.every(k => typeof i[k] === 'number' && isFinite(i[k] as number) && (i[k] as number) > 0);
        };

        void version; // consumed by zustand middleware; suppress unused-var lint
        return {
          inputA: isValidInput(inputA) ? inputA : DEFAULT_INPUT_A,
          inputB: isValidInput(inputB) ? inputB : DEFAULT_INPUT_B,
          activePattern: (s.activePattern === 'A' || s.activePattern === 'B' || s.activePattern === 'compare')
            ? s.activePattern
            : 'A',
        };
      },
      partialize: (state) => ({
        inputA: state.inputA,
        inputB: state.inputB,
        activePattern: state.activePattern,
      }),
    }
  )
);

// 旧ストレージキー移行（TERASS→MAS リブランド対応）
if (typeof window !== 'undefined') {
  try {
    const old = localStorage.getItem('terass-sim-store');
    if (old && !localStorage.getItem('mas-sim-store')) {
      const parsed = JSON.parse(old);
      const migrated = {
        state: {
          inputA: parsed?.state?.inputA,
          inputB: parsed?.state?.inputB,
          activePattern: parsed?.state?.activePattern ?? 'A',
        },
        version: 0,
      };
      localStorage.setItem('mas-sim-store', JSON.stringify(migrated));
    }
    localStorage.removeItem('terass-sim-store');
  } catch (e) { console.warn('[MAS] legacy store migration skipped:', e); }
}
