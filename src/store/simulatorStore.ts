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
    { name: 'terass-sim-store' }
  )
);
