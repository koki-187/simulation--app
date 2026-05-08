/**
 * Pure-data SVG chart generators for PDF export — MAS Monochrome Design System.
 * These functions return HTML strings containing inline SVGs,
 * with no dependency on the live DOM or Recharts.
 *
 * Color palette: #000000 / #888888 / #F7F7F7 / #FFFFFF only.
 */

import type { CFRow } from '@/lib/calc/types';

const BLACK  = '#000000';
const GRAY   = '#888888';
const LIGHT  = '#F7F7F7';

/**
 * Bar chart showing annual operating CF and after-tax CF (in 万円).
 * Filters to year 1 and every 5th year to keep the chart readable.
 * Two bars per group: solid black (operatingCF) + hatched gray (afterTaxCF).
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

  const W = 660, H = 190;
  const mL = 72, mR = 16, mT = 12, mB = 40;
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
  const barPairW = Math.min(groupW * 0.6, 28);
  const barW = (barPairW - 2) / 2;

  // Grid lines + y-axis labels
  const yLines = ticks.map(t => {
    const y = yPx(t);
    if (y < mT - 2 || y > mT + cH + 2) return '';
    const isZero = t === 0;
    return `<line x1="${mL}" y1="${y.toFixed(1)}" x2="${W - mR}" y2="${y.toFixed(1)}"
              stroke="${isZero ? BLACK : LIGHT}" stroke-width="${isZero ? '1' : '0.5'}"
              stroke-dasharray="${isZero ? 'none' : '3 3'}"/>`
      + `<text x="${mL - 5}" y="${(y + 3.5).toFixed(1)}" text-anchor="end"
              font-size="9" fill="${GRAY}" font-family="Inter,'Helvetica Neue',sans-serif">${t.toLocaleString('ja-JP')}</text>`;
  }).join('');

  // Bars
  const bars = data.map((d, i) => {
    const cx = mL + groupW * i + groupW / 2;
    const lx = cx - barW - 1;
    const rx = cx + 1;

    const opH = Math.max(Math.abs(yPx(d.opCF) - zeroY), 0.5);
    const opY = d.opCF >= 0 ? yPx(d.opCF) : zeroY;

    const atH = Math.max(Math.abs(yPx(d.atCF) - zeroY), 0.5);
    const atY = d.atCF >= 0 ? yPx(d.atCF) : zeroY;

    // Negative bars: lighter fill
    const opFill = d.opCF >= 0 ? BLACK : GRAY;
    const atFill = d.atCF >= 0 ? GRAY : LIGHT;
    const atStroke = d.atCF >= 0 ? '' : `stroke="${GRAY}" stroke-width="0.5"`;

    return `<rect x="${lx.toFixed(1)}" y="${opY.toFixed(1)}" width="${barW.toFixed(1)}" height="${opH.toFixed(1)}" fill="${opFill}"/>`
      + `<rect x="${rx.toFixed(1)}" y="${atY.toFixed(1)}" width="${barW.toFixed(1)}" height="${atH.toFixed(1)}" fill="${atFill}" ${atStroke}/>`
      + `<text x="${cx.toFixed(1)}" y="${(mT + cH + 14).toFixed(1)}" text-anchor="middle"
              font-size="9" fill="${GRAY}" font-family="Inter,'Helvetica Neue',sans-serif">${d.year}</text>`;
  }).join('');

  const legY = mT + cH + 28;

  return `<div style="margin-bottom:20px;">`
    + `<div style="font-size:9px;font-weight:500;letter-spacing:0.18em;color:${GRAY};text-transform:uppercase;margin-bottom:10px;font-family:Inter,'Helvetica Neue',sans-serif;">ANNUAL CASH FLOW  万円</div>`
    + `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">`
    + `<defs><pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="${GRAY}" stroke-width="1.5"/></pattern></defs>`
    + yLines
    + `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${mT + cH}" stroke="${GRAY}" stroke-width="0.5"/>`
    + bars
    + `<rect x="${mL}" y="${legY}" width="8" height="8" fill="${BLACK}"/>`
    + `<text x="${mL + 12}" y="${legY + 7}" font-size="9" fill="${GRAY}" font-family="Inter,'Helvetica Neue',sans-serif">運営CF</text>`
    + `<rect x="${mL + 56}" y="${legY}" width="8" height="8" fill="${GRAY}"/>`
    + `<text x="${mL + 70}" y="${legY + 7}" font-size="9" fill="${GRAY}" font-family="Inter,'Helvetica Neue',sans-serif">税引後CF</text>`
    + `</svg></div>`;
}

/**
 * Radar chart for A/B pattern comparison — monochrome variant.
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
    return `<polygon points="${pts}" fill="none" stroke="${lv === 100 ? GRAY : LIGHT}" stroke-width="${lv === 100 ? '1' : '0.6'}"/>`;
  }).join('');

  const axisLines = data.map((_, i) => {
    const p = pt(i, 100);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${LIGHT}" stroke-width="0.8"/>`;
  }).join('');

  const axisLabels = data.map((d, i) => {
    const a = angle(i);
    const lx = cx + (r + 18) * Math.cos(a);
    const ly = cy + (r + 18) * Math.sin(a);
    const anchor = Math.cos(a) < -0.2 ? 'end' : Math.cos(a) > 0.2 ? 'start' : 'middle';
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle"
              font-size="10" fill="${GRAY}" font-family="Inter,'Noto Sans JP',sans-serif">${d.subject}</text>`;
  }).join('');

  const polyA = data.map((d, i) => { const p = pt(i, d.A); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
  const polyB = data.map((d, i) => { const p = pt(i, d.B); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

  const legX = W - 175;
  const legY = 20;
  const trunc = (s: string, max = 16) => s.length > max ? s.slice(0, max) + '…' : s;

  return `<div style="margin-bottom:20px;">`
    + `<div style="font-size:9px;font-weight:500;letter-spacing:0.18em;color:${GRAY};text-transform:uppercase;margin-bottom:10px;font-family:Inter,'Helvetica Neue',sans-serif;">PERFORMANCE RADAR  0–100</div>`
    + `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">`
    + gridPolygons + axisLines + axisLabels
    + `<polygon points="${polyB}" fill="${GRAY}" fill-opacity="0.10" stroke="${GRAY}" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="4 2"/>`
    + `<polygon points="${polyA}" fill="${BLACK}" fill-opacity="0.08" stroke="${BLACK}" stroke-width="2" stroke-linejoin="round"/>`
    + `<rect x="${legX}" y="${legY}" width="10" height="10" fill="${BLACK}" fill-opacity="0.7"/>`
    + `<text x="${legX + 14}" y="${legY + 8}" font-size="10" fill="${GRAY}" font-family="Inter,sans-serif">A: ${trunc(nameA)}</text>`
    + `<rect x="${legX}" y="${legY + 18}" width="10" height="10" fill="none" stroke="${GRAY}" stroke-width="1.5"/>`
    + `<text x="${legX + 14}" y="${legY + 26}" font-size="10" fill="${GRAY}" font-family="Inter,sans-serif">B: ${trunc(nameB)}</text>`
    + `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${GRAY}" font-family="Inter,sans-serif">各指標を 0–100 に正規化したスコア</text>`
    + `</svg></div>`;
}
