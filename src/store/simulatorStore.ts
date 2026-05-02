'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimInput, SimResult } from '@/lib/calc/types';
import { simulate, DEFAULT_INPUT_A, DEFAULT_INPUT_B } from '@/lib/calc/simulate';

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
    (set, get) => ({
      inputA: DEFAULT_INPUT_A,
      inputB: DEFAULT_INPUT_B,
      resultA: simulate(DEFAULT_INPUT_A),
      resultB: simulate(DEFAULT_INPUT_B),
      activePattern: 'A',

      setInputA: (partial) => set(s => {
        const newInput = { ...s.inputA, ...partial };
        return { inputA: newInput, resultA: simulate(newInput) };
      }),
      setInputB: (partial) => set(s => {
        const newInput = { ...s.inputB, ...partial };
        return { inputB: newInput, resultB: simulate(newInput) };
      }),
      setActivePattern: (p) => set({ activePattern: p }),
      recalculate: () => set(s => ({
        resultA: simulate(s.inputA),
        resultB: simulate(s.inputB),
      })),
    }),
    {
      name: 'mas-sim-store',
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
  } catch { /* ignore */ }
}
