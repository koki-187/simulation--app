import { DepRow } from './types';

/** RC structure: 47yr, wood: 22yr, steel: 34yr — standard rates */
export const STRUCTURE_YEARS: Record<string, number> = {
  'RC': 47, '鉄骨': 34, '木造': 22, '軽量鉄骨': 27,
};

/** Equipment useful life: 15 years */
export const EQUIPMENT_YEARS = 15;

/** Straight-line depreciation rate */
export function depRate(years: number): number {
  return 1 / years;
}

/** Annual depreciation (straight-line, floor) */
export function annualDep(cost: number, years: number, year: number): number {
  if (year > years) return 0;
  return Math.floor(cost / years);
}

/** Full depreciation schedule for structure + equipment */
export function calcDepreciation(
  structureCost: number,
  equipmentCost: number,
  structureYears: number,
  equipmentYears: number,
  holdingYears: number
): DepRow[] {
  const rows: DepRow[] = [];
  let cumDep = 0;

  for (let y = 1; y <= holdingYears; y++) {
    const strAnn = annualDep(structureCost, structureYears, y);
    const eqAnn = annualDep(equipmentCost, equipmentYears, y);
    const total = strAnn + eqAnn;
    cumDep += total;

    const strRemaining = Math.max(0, structureCost - Math.floor(structureCost / structureYears) * Math.min(y, structureYears));
    const eqRemaining = Math.max(0, equipmentCost - Math.floor(equipmentCost / equipmentYears) * Math.min(y, equipmentYears));

    rows.push({
      year: y,
      structureAnnual: strAnn,
      equipmentAnnual: eqAnn,
      totalAnnual: total,
      structureRemaining: strRemaining,
      equipmentRemaining: eqRemaining,
      totalRemaining: strRemaining + eqRemaining,
      cumDepreciation: cumDep,
    });
  }
  return rows;
}
