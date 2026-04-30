# Performance Optimization Plan — terass-sim

**Date:** 2026-04-30
**Scope:** 9 issues across ~15 files
**Estimated complexity:** LOW-MEDIUM (all changes are isolated, no architectural changes)
**Risk:** LOW (all changes are additive; no behavior changes, only render/compute savings)

---

## Context

The terass-sim Next.js 16 app (React 19, Zustand 5, Recharts 3, Tailwind v4) has multiple performance bottlenecks: unnecessary re-renders from Zustand whole-store subscriptions, unmemoized chart data, unmemoized components, an O(n*e) loop in `buildSchedule`, and missing Next.js build optimizations. All fixes are low-risk and backward compatible.

## Work Objectives

Reduce unnecessary React re-renders, optimize computation hot paths, and enable Next.js production optimizations without changing any user-facing behavior.

## Guardrails

**Must Have:**
- All existing functionality preserved identically
- TypeScript strict mode compliance
- No new dependencies (useShallow is already in zustand)

**Must NOT Have:**
- Any changes to component visual output
- Any changes to calculation logic/results
- SSR/hydration mismatches

---

## Task Flow (ordered by dependency and ROI)

### Step 1: Next.js Config Optimizations (TRIVIAL / HIGH IMPACT)

**File:** `next.config.ts`

**Changes:**
- Add `experimental.optimizePackageImports: ['recharts']` to tree-shake Recharts (currently imports entire library on every page)
- Add `compiler.removeConsole: true` for production builds (strips console.log)

**Specific code:**
```ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

**Acceptance criteria:**
- `next build` succeeds without errors
- Recharts bundle size reduced (visible in build output)
- No console.log in production output

**Risk:** NONE — standard Next.js config options

---

### Step 2: Zustand Selector Optimization (LOW EFFORT / HIGH IMPACT)

**Files (12 call sites):**
| File | Current | Fix |
|---|---|---|
| `src/app/page.tsx:11` | `const { resultA, resultB, inputA, inputB } = useSimStore()` | `useShallow` |
| `src/app/cashflow/page.tsx:63` | `const { resultA, resultB, activePattern } = useSimStore()` | `useShallow` |
| `src/app/compare/page.tsx:62` | `const { resultA, resultB, inputA, inputB } = useSimStore()` | `useShallow` |
| `src/app/sale/page.tsx:252` | `const { resultA, resultB, inputA, inputB } = useSimStore()` | `useShallow` |
| `src/app/tax/page.tsx:8` | `const { resultA, resultB, activePattern } = useSimStore()` | `useShallow` |
| `src/app/amortization/page.tsx:49` | `const { resultA, resultB, activePattern } = useSimStore()` | `useShallow` |
| `src/app/input/page.tsx:31` | `const { inputA, inputB, resultA, resultB, setInputA, setInputB } = useSimStore()` | `useShallow` |
| `src/app/input/page.tsx:137` | `const { activePattern, setActivePattern } = useSimStore()` | `useShallow` |
| `src/app/ratios/page.tsx:8` | `const { resultA, resultB, activePattern } = useSimStore()` | `useShallow` |
| `src/app/funding-plan/page.tsx:216` | `const { resultA } = useSimStore()` | Single selector (no useShallow needed) |
| `src/app/banks/page.tsx:8` | `const { resultA } = useSimStore()` | Single selector (no useShallow needed) |
| `src/components/layout/PatternToggle.tsx:6` | `const { activePattern, setActivePattern } = useSimStore()` | `useShallow` |
| `src/app/home-sim/page.tsx:221` | `const store = useHomeLoanStore()` | **Destructure with `useShallow`** |

**Pattern for multi-field selectors:**
```ts
import { useShallow } from 'zustand/react/shallow';

// Before:
const { resultA, resultB, activePattern } = useSimStore();

// After:
const { resultA, resultB, activePattern } = useSimStore(
  useShallow(s => ({ resultA: s.resultA, resultB: s.resultB, activePattern: s.activePattern }))
);
```

**Pattern for single-field selectors (funding-plan, banks):**
```ts
// Before:
const { resultA } = useSimStore();

// After:
const resultA = useSimStore(s => s.resultA);
```

**Pattern for home-sim (worst offender -- subscribes to entire store):**
```ts
// Before:
const store = useHomeLoanStore();
const { propertyName, propertyPrice, equity, ... } = store;

// After:
const {
  propertyName, propertyPrice, equity, expenses,
  rateType, annualRate, termYears,
  annualIncome, taxRate, deductionEnabled, isNew, entryYear,
  mgmtFee, showExtras, events, set: setStore,
} = useHomeLoanStore(
  useShallow(s => ({
    propertyName: s.propertyName, propertyPrice: s.propertyPrice,
    equity: s.equity, expenses: s.expenses,
    rateType: s.rateType, annualRate: s.annualRate, termYears: s.termYears,
    annualIncome: s.annualIncome, taxRate: s.taxRate,
    deductionEnabled: s.deductionEnabled, isNew: s.isNew, entryYear: s.entryYear,
    mgmtFee: s.mgmtFee, showExtras: s.showExtras, events: s.events,
    set: s.set,
  }))
);
```

**Acceptance criteria:**
- Each page only re-renders when its specific subscribed fields change
- No TypeScript errors
- All pages function identically

**Risk:** LOW — `useShallow` does shallow equality comparison; since Zustand already returns stable references for unchanged fields, this is safe

---

### Step 3: buildSchedule O(n*e) Fix (LOW EFFORT / MEDIUM IMPACT)

**File:** `src/app/home-sim/page.tsx` — `buildSchedule` function (line 67-146)

**Current problem:** Line 95: `const eventsAtMonth = sorted.filter(e => e.yearAfter * 12 === m);` runs inside a loop of up to 420 iterations (35 years * 12), filtering all events every iteration.

**Fix:** Pre-compute a `Map<number, PrepayEvent[]>` before the loop:

```ts
// Before the for loop (after line 82):
const eventsByMonth = new Map<number, PrepayEvent[]>();
for (const e of sorted) {
  const month = e.yearAfter * 12;
  const arr = eventsByMonth.get(month);
  if (arr) arr.push(e);
  else eventsByMonth.set(month, [e]);
}

// Replace line 95:
// const eventsAtMonth = sorted.filter(e => e.yearAfter * 12 === m);
const eventsAtMonth = eventsByMonth.get(m) ?? [];
```

**Acceptance criteria:**
- `buildSchedule` produces identical output for all inputs
- O(n+e) complexity instead of O(n*e)

**Risk:** NONE — pure refactor of internal loop structure

---

### Step 4: Memoize Chart Data (LOW EFFORT / MEDIUM IMPACT)

**File 1:** `src/app/page.tsx` (lines 14-20)

**Current:** `cfData` is computed on every render without `useMemo`.

**Fix:**
```ts
const cfData = useMemo(() =>
  resultA.cashFlows.slice(0, 20).map((row, i) => ({
    year: `${row.year}年`,
    'A 税引後CF': Math.round(row.afterTaxCF / 10000),
    'B 税引後CF': Math.round(resultB.cashFlows[i]?.afterTaxCF / 10000),
    'A 累計CF': Math.round(row.cumulativeCF / 10000),
    'B 累計CF': Math.round(resultB.cashFlows[i]?.cumulativeCF / 10000),
  })),
  [resultA.cashFlows, resultB.cashFlows]
);
```

Add `import { useMemo } from 'react';` if not already imported (page.tsx currently imports React but not useMemo individually — check import line).

**File 2:** `src/app/cashflow/page.tsx` (line 67)

**Current:** `chartData` is computed on every render.

**Fix:**
```ts
const chartData = useMemo(() =>
  rows.map(r => ({
    year: r.year + '年',
    '運営CF': Math.round(r.operatingCF / 10000),
    '税引後CF': Math.round(r.afterTaxCF / 10000),
    '累計CF': Math.round(r.cumulativeCF / 10000),
  })),
  [rows]
);
```

Note: `rows` is derived from `result` which comes from the store. Need to also memoize `rows`:
```ts
const rows = useMemo(() => result.cashFlows.slice(0, 30), [result.cashFlows]);
```

Add `import { useMemo } from 'react';` to cashflow/page.tsx.

**Acceptance criteria:**
- Chart data objects only recomputed when source data changes
- Charts display identically

**Risk:** NONE

---

### Step 5: Memoize Leaf Components (TRIVIAL)

**File 1:** `src/components/ui/StatBox.tsx`

**Fix:** Wrap with `React.memo`:
```ts
import { memo } from 'react';
// ... keep existing code ...
export const StatBox = memo(StatBox_Inner);
// Or use named function:
export const StatBox = memo(function StatBox({ ... }: StatBoxProps) { ... });
```

**File 2:** `src/components/layout/Sidebar.tsx`

Note: Sidebar uses `usePathname()` hook which already causes re-renders only on route change. Memoization benefit is minimal but still worth doing for consistency.

**Fix:** Wrap the exported function:
```ts
import { memo } from 'react';
// ...
export const Sidebar = memo(function Sidebar() { ... });
```

**Acceptance criteria:**
- Components skip re-render when props are unchanged (StatBox) or pathname is unchanged (Sidebar)
- Visual output identical

**Risk:** NONE

---

### Step 6: Font Configuration Fix (TRIVIAL)

**File:** `src/app/layout.tsx` (line 5-9)

**Current:** `subsets: ['latin']` — missing Japanese subset. Weight `'500'` may be unused.

**Fix:**
```ts
const notoSansJP = Noto_Sans_JP({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  preload: false,
});
```

**Important notes:**
- `Noto_Sans_JP` from `next/font/google` does NOT support `'japanese'` as a subset value — Google Fonts API uses unicode-range subsetting automatically for CJK fonts. Removing the invalid subset avoids a build error.
- Weight `'500'` removal: grep the codebase for `font-medium` usage (Tailwind `font-medium` = 500). If it IS used, keep `'500'`. If only `font-normal` (400), `font-semibold` (600), and `font-bold` (700) are used, remove it to reduce font download.
- Add `preload: false` because CJK fonts are large and should use on-demand loading via CSS unicode-range.

**Pre-check before applying:** Search for `font-medium` in components. If found (likely), keep weight `'500'`.

**Acceptance criteria:**
- `next build` succeeds
- Font loads correctly on all pages
- No FOUT (flash of unstyled text) regression

**Risk:** LOW — font weight removal needs verification first

---

### Step 7: Cumulative Interest Pre-computation (LOW EFFORT)

**File:** `src/app/home-sim/page.tsx` (lines 349-365)

**Current problem:** Inside `chartData` useMemo, each data point computes cumulative interest via `.slice(0, monthIdx + 1).reduce(...)` — this is O(n*p) where p is the number of chart points.

**Fix:** Compute a running cumulative interest array once, then index into it:
```ts
const chartData = useMemo(() => {
  // Pre-compute cumulative interest array
  const cumulativeInterest: number[] = [];
  let runningTotal = 0;
  for (const row of baseResult.rows) {
    runningTotal += row.interest;
    cumulativeInterest.push(runningTotal);
  }

  const points = [1, 5, 10, 15, 20, 25, 30, 35].filter(y => y <= termYears);
  if (!points.includes(termYears)) points.push(termYears);

  return points.map(year => {
    const monthIdx = Math.min(year * 12 - 1, baseResult.rows.length - 1);
    const row = baseResult.rows[monthIdx];
    return {
      year,
      残高: Math.round((row?.balance ?? 0) / 10000),
      累計利息: Math.round((cumulativeInterest[monthIdx] ?? 0) / 10000),
    };
  });
}, [baseResult, termYears]);
```

**Acceptance criteria:**
- Chart data values identical to current implementation
- Single pass over rows instead of repeated slicing

**Risk:** NONE — pure computation refactor

---

## Success Criteria

1. `next build` completes without errors or warnings
2. All 15+ pages render identically to before
3. Bundle size reduced (Recharts tree-shaking via optimizePackageImports)
4. React DevTools Profiler shows reduced re-renders on store updates
5. No TypeScript strict mode violations

## Execution Order

1. Step 1 (next.config.ts) — no dependencies, instant win
2. Step 2 (Zustand selectors) — highest impact, touch many files
3. Step 3 (buildSchedule) + Step 7 (cumulative interest) — both in home-sim, do together
4. Step 4 (chart memoization) — depends on Step 2 being done (stable references)
5. Step 5 (component memoization) — independent, do anytime
6. Step 6 (font config) — independent, do anytime

## Deferred / Not Included

- **Recharts dynamic loading (Issue 9):** Medium effort, requires creating wrapper components with `next/dynamic` and loading skeletons for all 7 chart-using pages. Deferred to a separate plan to keep this one focused on quick wins.
