/**
 * Pure-data SVG chart generators for PDF export.
 * These functions return HTML strings containing inline SVGs,
 * with no dependency on the live DOM or Recharts.
 */

import type { CFRow } from '@/lib/calc/types';

const NAVY = '#1C2B4A';
const ORANGE = '#E8632A';

/**
 * Bar chart showing annual operating CF and after-tax CF (in 万円).
 * Filters to year 1 and every 5th year to keep the chart readable.
 */
export function cashflowBarChartSvg(rows: CFRow[]): string {
  const data = rows
    .filter(r => r.year === 1 || r.year % 5 === 0)
    .map(r => ({
      year: `${r.year}年`,
      opCF: Math.round(r.operatingCF / 10000),
      atCF: Math.round(r.afterTaxCF / 10000),
    }));

  if (data.length === 0) return '';

  const W = 660, H = 200;
  const mL = 70, mR = 16, mT = 12, mB = 44;
  const cW = W - mL - mR;
  const cH = H - mT - mB;

  const allVals = data.flatMap(d => [d.opCF, d.atCF, 0]);
  const maxV = Math.max(...allVals);
  const minV = Math.min(...allVals);
  const range = maxV - minV || 1;

  const yPx = (v: number) => mT + cH - ((v - minV) / range) * cH;
  const zeroY = yPx(0);

  // Nice Y-axis ticks
  const rawStep = (maxV - minV) / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
  const step = Math.max(Math.ceil(rawStep / mag) * mag, 1);
  const ticks: number[] = [];
  for (let t = Math.ceil(minV / step) * step; t <= maxV + step * 0.01; t += step) {
    ticks.push(t);
  }

  const groupW = cW / data.length;
  const barPairW = Math.min(groupW * 0.65, 30);
  const barW = (barPairW - 2) / 2;

  const yLines = ticks.map(t => {
    const y = yPx(t);
    if (y < mT - 2 || y > mT + cH + 2) return '';
    return `<line x1="${mL}" y1="${y.toFixed(1)}" x2="${W - mR}" y2="${y.toFixed(1)}" stroke="#F0F1F3" stroke-width="1"/>`
      + `<text x="${mL - 4}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9" fill="#9CA3AF">${t.toLocaleString('ja-JP')}</text>`;
  }).join('');

  const bars = data.map((d, i) => {
    const cx = mL + groupW * i + groupW / 2;
    const lx = cx - barW - 1;
    const rx = cx + 1;

    const opH = Math.max(Math.abs(yPx(d.opCF) - zeroY), 0.5);
    const opY = d.opCF >= 0 ? yPx(d.opCF) : zeroY;

    const atH = Math.max(Math.abs(yPx(d.atCF) - zeroY), 0.5);
    const atY = d.atCF >= 0 ? yPx(d.atCF) : zeroY;

    return `<rect x="${lx.toFixed(1)}" y="${opY.toFixed(1)}" width="${barW.toFixed(1)}" height="${opH.toFixed(1)}" fill="${NAVY}" rx="1.5"/>`
      + `<rect x="${rx.toFixed(1)}" y="${atY.toFixed(1)}" width="${barW.toFixed(1)}" height="${atH.toFixed(1)}" fill="${ORANGE}" rx="1.5"/>`
      + `<text x="${cx.toFixed(1)}" y="${(mT + cH + 15).toFixed(1)}" text-anchor="middle" font-size="9" fill="#6B7280">${d.year}</text>`;
  }).join('');

  const legY = mT + cH + 30;

  return `<div style="margin-bottom:16px;">`
    + `<div style="font-size:11px;font-weight:bold;color:${NAVY};margin-bottom:6px;">年次CF推移（万円）</div>`
    + `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">`
    + yLines
    + `<line x1="${mL}" y1="${zeroY.toFixed(1)}" x2="${W - mR}" y2="${zeroY.toFixed(1)}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4 3"/>`
    + `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${mT + cH}" stroke="#D1D5DB" stroke-width="1"/>`
    + bars
    + `<rect x="${mL}" y="${legY}" width="8" height="8" fill="${NAVY}" rx="1"/>`
    + `<text x="${mL + 11}" y="${legY + 7}" font-size="9" fill="#374151">運営CF</text>`
    + `<rect x="${mL + 58}" y="${legY}" width="8" height="8" fill="${ORANGE}" rx="1"/>`
    + `<text x="${mL + 69}" y="${legY + 7}" font-size="9" fill="#374151">税引後CF</text>`
    + `</svg></div>`;
}

/**
 * Radar chart for A/B pattern comparison.
 * data values must be pre-normalized to 0–100 (higher = better).
 */
export function radarChartSvg(
  data: { subject: string; A: number; B: number }[],
  nameA: string,
  nameB: string,
): string {
  if (data.length < 3) return '';

  const n = data.length;
  const W = 540, H = 295;
  const cx = 210, cy = 145, r = 100;

  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2;
  const pt = (i: number, val: number) => {
    const a = angle(i);
    const v = Math.max(0, val) / 100;
    return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a) };
  };

  const gridPolygons = [20, 40, 60, 80, 100].map(lv => {
    const pts = Array.from({ length: n }, (_, i) => {
      const p = pt(i, lv);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${lv === 100 ? '#D1D5DB' : '#EAECF0'}" stroke-width="${lv === 100 ? '1.5' : '0.8'}"/>`;
  }).join('');

  const axisLines = data.map((_, i) => {
    const p = pt(i, 100);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#E5E7EB" stroke-width="1"/>`;
  }).join('');

  const axisLabels = data.map((d, i) => {
    const a = angle(i);
    const lx = cx + (r + 15) * Math.cos(a);
    const ly = cy + (r + 15) * Math.sin(a);
    const anchor = Math.cos(a) < -0.2 ? 'end' : Math.cos(a) > 0.2 ? 'start' : 'middle';
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10" fill="#4B5563">${d.subject}</text>`;
  }).join('');

  const polyA = data.map((d, i) => { const p = pt(i, d.A); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
  const polyB = data.map((d, i) => { const p = pt(i, d.B); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

  const legX = W - 185;
  const legY = 18;
  const trunc = (s: string, max = 16) => s.length > max ? s.slice(0, max) + '…' : s;

  return `<div style="margin-bottom:16px;">`
    + `<div style="font-size:11px;font-weight:bold;color:${NAVY};margin-bottom:6px;">総合評価レーダー（正規化スコア 0〜100）</div>`
    + `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">`
    + gridPolygons
    + axisLines
    + axisLabels
    + `<polygon points="${polyB}" fill="${NAVY}" fill-opacity="0.12" stroke="${NAVY}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<polygon points="${polyA}" fill="${ORANGE}" fill-opacity="0.22" stroke="${ORANGE}" stroke-width="2" stroke-linejoin="round"/>`
    + `<rect x="${legX}" y="${legY}" width="10" height="10" fill="${ORANGE}" fill-opacity="0.8" rx="2"/>`
    + `<text x="${legX + 14}" y="${legY + 8}" font-size="10" fill="#374151">A: ${trunc(nameA)}</text>`
    + `<rect x="${legX}" y="${legY + 18}" width="10" height="10" fill="${NAVY}" fill-opacity="0.6" rx="2"/>`
    + `<text x="${legX + 14}" y="${legY + 26}" font-size="10" fill="#374151">B: ${trunc(nameB)}</text>`
    + `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="9" fill="#9CA3AF">※各指標を0〜100に正規化したスコアです。</text>`
    + `</svg></div>`;
}
