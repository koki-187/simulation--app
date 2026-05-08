'use client';
/**
 * PDF Preview — MAS Monochrome Design System
 * Shows each PDF section at A4 scale for visual inspection.
 * Accessible at /pdf-preview (dev only).
 */
import { useMemo } from 'react';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import {
  coverHtml,
  cashflowSectionHtml,
  amortizationSectionHtml,
  saleSectionHtml,
  taxSectionHtml,
  ratiosSectionHtml,
  fundingPlanSectionHtml,
} from '@/lib/pdf/sectionHtml';

const PAGES = [
  { key: 'cover',        label: 'Cover',              orientation: 'portrait'  as const },
  { key: 'cashflow',     label: 'Cash Flow Analysis', orientation: 'landscape' as const },
  { key: 'amortization', label: 'Repayment Schedule', orientation: 'portrait'  as const },
  { key: 'sale',         label: 'Sale Simulation',    orientation: 'portrait'  as const },
  { key: 'tax',          label: 'Tax Analysis',       orientation: 'portrait'  as const },
  { key: 'ratios',       label: 'Financial Health',   orientation: 'portrait'  as const },
  { key: 'funding',      label: 'Funding Plan',       orientation: 'portrait'  as const },
];

const SCALE = 0.72; // scale factor for viewport display

export default function PdfPreviewPage() {
  const { resultA } = useSimStore(
    useShallow(s => ({ resultA: s.resultA }))
  );

  const htmlMap = useMemo(() => ({
    cover:        coverHtml(resultA, 'パターン A'),
    cashflow:     cashflowSectionHtml(resultA, 'パターン A'),
    amortization: amortizationSectionHtml(resultA, 'パターン A'),
    sale:         saleSectionHtml(resultA, 'パターン A'),
    tax:          taxSectionHtml(resultA, 'パターン A'),
    ratios:       ratiosSectionHtml(resultA, 'パターン A'),
    funding:      fundingPlanSectionHtml(resultA, 'パターン A'),
  }), [resultA]);

  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', padding: '32px 24px', fontFamily: 'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 300, letterSpacing: '0.1em' }}>MAS  PDF PREVIEW</div>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: '0.2em', marginTop: 4 }}>
            MONOCHROME DESIGN SYSTEM  v2.0 — {PAGES.length} PAGES
          </div>
        </div>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em' }}>
          Scale: {Math.round(SCALE * 100)}%
        </div>
      </div>

      {/* Pages */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
        {PAGES.map((page, idx) => {
          const isLand = page.orientation === 'landscape';
          const pageW  = isLand ? 1122 : 794;
          const pageH  = isLand ? 794  : 1123;
          const dispW  = Math.round(pageW * SCALE);
          const dispH  = Math.round(pageH * SCALE);
          const html   = htmlMap[page.key as keyof typeof htmlMap];

          return (
            <div key={page.key}>
              {/* Page label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 10, maxWidth: dispW,
              }}>
                <div style={{
                  background: '#333', color: '#888', fontSize: 9,
                  fontWeight: 500, letterSpacing: '0.2em',
                  padding: '3px 8px', fontFamily: 'Inter,sans-serif',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ color: '#888', fontSize: 11, letterSpacing: '0.15em', fontFamily: 'Inter,sans-serif' }}>
                  {page.label.toUpperCase()}
                </div>
                <div style={{ color: '#555', fontSize: 9, letterSpacing: '0.12em', marginLeft: 'auto' }}>
                  {isLand ? 'A4 LANDSCAPE' : 'A4 PORTRAIT'}
                </div>
              </div>

              {/* A4 frame */}
              <div style={{
                width: dispW,
                height: dispH,
                background: '#fff',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
              }}>
                <div
                  style={{
                    width: pageW,
                    height: pageH,
                    transformOrigin: 'top left',
                    transform: `scale(${SCALE})`,
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>

              {/* Dimension label */}
              <div style={{
                color: '#333', fontSize: 9, letterSpacing: '0.15em',
                marginTop: 6, fontFamily: 'Inter,sans-serif', textAlign: 'right',
                maxWidth: dispW,
              }}>
                {pageW} × {pageH} px  /  {isLand ? '297 × 210' : '210 × 297'} mm
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#333', fontSize: 9, letterSpacing: '0.2em', marginTop: 60, paddingBottom: 32 }}>
        MAS DESIGN SYSTEM — FOR INTERNAL USE ONLY
      </div>
    </div>
  );
}
