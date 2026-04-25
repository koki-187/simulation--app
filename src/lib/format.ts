export const yen = (v: number) => '¥' + Math.round(v).toLocaleString('ja-JP');
export const yenM = (v: number) => (v / 1_000_000).toFixed(2) + '百万円';
export const pct = (v: number, dp = 2) => (v * 100).toFixed(dp) + '%';
export const num = (v: number) => Math.round(v).toLocaleString('ja-JP');
export const cagr = (v: number) => (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%';
export const mult = (v: number) => v.toFixed(2) + 'x';
