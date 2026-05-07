'use client';

import { useState } from 'react';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import type { BatchSection } from '@/lib/pdf/batchExport';
import {
  coverHtml,
  cashflowSectionHtml,
  amortizationSectionHtml,
  saleSectionHtml,
  taxSectionHtml,
  ratiosSectionHtml,
  fundingPlanSectionHtml,
} from '@/lib/pdf/sectionHtml';

interface BatchPrintModalProps {
  open: boolean;
  onClose: () => void;
}

type SectionKey = 'cover' | 'cashflow' | 'amortization' | 'sale' | 'tax' | 'ratios' | 'funding';
type PatternChoice = 'A' | 'B' | 'both';

const SECTION_DEFS: { key: SectionKey; label: string; category: string }[] = [
  { key: 'cover',        label: 'カバーページ',       category: '収益ローン' },
  { key: 'cashflow',     label: 'CF分析',             category: '収益ローン' },
  { key: 'amortization', label: '返済スケジュール',   category: '収益ローン' },
  { key: 'sale',         label: '売却シミュレーション', category: '収益ローン' },
  { key: 'tax',          label: '税金詳細',            category: '収益ローン' },
  { key: 'ratios',       label: '年収倍率・返済比率', category: '収益ローン' },
  { key: 'funding',      label: '資金計画書',          category: '共通' },
];

export function BatchPrintModal({ open, onClose }: BatchPrintModalProps) {
  const { resultA, resultB } = useSimStore(
    useShallow(s => ({ resultA: s.resultA, resultB: s.resultB }))
  );

  const [selectedSections, setSelectedSections] = useState<Set<SectionKey>>(
    new Set(['cover', 'cashflow', 'amortization', 'sale', 'ratios'])
  );
  const [pattern, setPattern] = useState<PatternChoice>('both');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });

  if (!open) return null;

  function toggleSection(key: SectionKey) {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedSections(new Set(SECTION_DEFS.map(s => s.key)));
  }

  function selectNone() {
    setSelectedSections(new Set());
  }

  function buildSections(): BatchSection[] {
    const sections: BatchSection[] = [];

    const patterns: { result: typeof resultA; label: string }[] = [];
    if (pattern === 'A' || pattern === 'both') {
      patterns.push({ result: resultA, label: 'パターンA' });
    }
    if ((pattern === 'B' || pattern === 'both') && resultB) {
      patterns.push({ result: resultB, label: 'パターンB' });
    }

    for (const { result, label } of patterns) {
      for (const def of SECTION_DEFS) {
        if (!selectedSections.has(def.key)) continue;

        switch (def.key) {
          case 'cover':
            sections.push({
              label: `カバー — ${label}`,
              html: coverHtml(result.input.propertyName, label),
              orientation: 'portrait',
            });
            break;
          case 'cashflow':
            sections.push({
              label: `CF分析 — ${label}`,
              html: cashflowSectionHtml(result, label),
              orientation: 'landscape',
            });
            break;
          case 'amortization':
            sections.push({
              label: `返済スケジュール — ${label}`,
              html: amortizationSectionHtml(result, label),
              orientation: 'portrait',
            });
            break;
          case 'sale':
            sections.push({
              label: `売却シミュレーション — ${label}`,
              html: saleSectionHtml(result, label),
              orientation: 'portrait',
            });
            break;
          case 'tax':
            sections.push({
              label: `税金詳細 — ${label}`,
              html: taxSectionHtml(result, label),
              orientation: 'portrait',
            });
            break;
          case 'ratios':
            sections.push({
              label: `年収倍率・返済比率 — ${label}`,
              html: ratiosSectionHtml(result, label),
              orientation: 'portrait',
            });
            break;
          case 'funding':
            // funding is shared — only add once per pattern
            sections.push({
              label: `資金計画書 — ${label}`,
              html: fundingPlanSectionHtml(result, label),
              orientation: 'portrait',
            });
            break;
        }
      }
    }

    return sections;
  }

  async function handleGenerate() {
    if (selectedSections.size === 0) {
      alert('出力するセクションを選択してください。');
      return;
    }

    setGenerating(true);
    try {
      const { batchExportPdf } = await import('@/lib/pdf/batchExport');
      const sections = buildSections();
      const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '');
      const filename = `MAS_${resultA.input.propertyName}_${dateStr}.pdf`;
      await batchExportPdf(sections, filename, (done, total, label) => {
        setProgress({ done, total, label });
      });
      // 完了を視認できるよう短いディレイ
      setProgress({ done: sections.length, total: sections.length, label: '✅ 完了' });
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      onClose();
    } catch (e) {
      console.error(e);
      alert('PDF生成でエラーが発生しました。');
    } finally {
      setGenerating(false);
      setProgress({ done: 0, total: 0, label: '' });
    }
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const categories = ['収益ローン', '共通'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={!generating ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-navy-500 text-white px-5 py-4 flex items-center justify-between">
          <div className="font-bold text-base">📄 一括PDF出力</div>
          {!generating && (
            <button
              onClick={onClose}
              className="text-navy-100 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Pattern selection */}
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-2">パターン選択</div>
            <div className="flex gap-2">
              {(['A', 'B', 'both'] as const).map(p => (
                <label
                  key={p}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    pattern === p
                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="pattern"
                    value={p}
                    checked={pattern === p}
                    onChange={() => setPattern(p)}
                    className="sr-only"
                  />
                  {p === 'both' ? '両方を出力' : `パターン${p}`}
                </label>
              ))}
            </div>
          </div>

          {/* Section selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-neutral-700">出力セクション</div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  全選択
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                >
                  全解除
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {categories.map(cat => {
                const defs = SECTION_DEFS.filter(s => s.category === cat);
                return (
                  <div key={cat}>
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      {cat}
                    </div>
                    <div className="space-y-1">
                      {defs.map(def => (
                        <label
                          key={def.key}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSections.has(def.key)}
                            onChange={() => toggleSection(def.key)}
                            className="w-4 h-4 rounded accent-orange-500"
                          />
                          <span className="text-sm text-neutral-700">{def.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="text-sm text-neutral-600">
                生成中: <span className="font-medium">{progress.label}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-neutral-400 text-right">
                {progress.done} / {progress.total}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || selectedSections.size === 0}
            className="px-4 py-2 text-sm font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin">⏳</span>
                生成中...
              </>
            ) : (
              <>PDF生成 🚀</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
