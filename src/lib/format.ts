export const yen = (v: number) => {
  if (!isFinite(v)) return '—';
  return '¥' + Math.round(v).toLocaleString('ja-JP');
};
export const yenM = (v: number) => {
  if (!isFinite(v)) return '—万円';
  const m = Math.round(v / 10000);
  return m.toLocaleString('ja-JP') + '万円';
};
export const pct = (v: number, dp = 2) => {
  if (!isFinite(v)) return '—';
  return (v * 100).toFixed(dp) + '%';
};
export const num = (v: number) => {
  if (!isFinite(v)) return '—';
  return Math.round(v).toLocaleString('ja-JP');
};
export const cagr = (v: number) => {
  if (!isFinite(v)) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%';
};
export const mult = (v: number) => {
  if (!isFinite(v)) return '—';
  return v.toFixed(2) + 'x';
};
