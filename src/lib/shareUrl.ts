/**
 * URL共有ユーティリティ
 * inputA/inputB を Base64+JSON でシリアライズして ?share= パラメータに埋め込む
 */
import type { SimInput } from '@/lib/calc/types';

interface SharePayload {
  a: Partial<SimInput>;
  b?: Partial<SimInput>;
  v: 1; // version
}

export function encodeShareUrl(inputA: SimInput, inputB?: SimInput): string {
  const payload: SharePayload = {
    v: 1,
    a: inputA,
    ...(inputB ? { b: inputB } : {}),
  };
  const json = JSON.stringify(payload);
  // encodeURIComponent → 100% ASCII, btoa は ASCII only なので安全
  // Buffer.from fallback は除去（window.location を使うためブラウザ専用）
  const b64 = btoa(encodeURIComponent(json));
  const url = new URL(window.location.href);
  url.searchParams.set('share', b64);
  url.pathname = '/input'; // always link to input page
  return url.toString();
}

/** 数値フィールドが実際に number 型かチェックするミニバリデーター */
function isValidPartialInput(obj: unknown): obj is Partial<import('@/lib/calc/types').SimInput> {
  if (typeof obj !== 'object' || obj === null) return false;
  const numericFields = [
    'propertyPrice', 'equity', 'expenses', 'rate', 'termYears',
    'monthlyRent', 'managementFee', 'repairFund', 'otherExpenses',
    'vacancyRate', 'fixedAssetTax', 'buildingRatio',
    'structureDepYears', 'equipmentDepYears', 'holdingYears', 'growthRate',
    'annualIncomeTaxBase', 'annualIncomeDeclared',
  ];
  const record = obj as Record<string, unknown>;
  for (const field of numericFields) {
    if (field in record && typeof record[field] !== 'number') return false;
  }
  return true;
}

export function decodeShareUrl(param: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(param));
    const parsed = JSON.parse(json) as SharePayload;
    if (parsed.v !== 1) return null;
    // 数値フィールドの型を検証 — 不正なURLでストアが汚染されるのを防ぐ
    if (parsed.a && !isValidPartialInput(parsed.a)) return null;
    if (parsed.b && !isValidPartialInput(parsed.b)) return null;
    return parsed;
  } catch {
    return null;
  }
}
