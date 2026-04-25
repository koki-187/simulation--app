'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { HOME_LOAN_137, PREFERENCE_PRESETS, type HomeLoan137, type HomeLoan137Tag } from '@/lib/data/homeLoan137';

function yen(n: number) {
  return n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
}

type RateTypeFilter = 'all' | '変動' | '固定';
type SortBy = 'rate' | 'fee' | 'maxLoan' | 'monthly';

const TAG_COLORS: Record<HomeLoan137Tag, string> = {
  'がん100団信':    'bg-red-100 text-red-700',
  '三大疾病':       'bg-red-50 text-red-600',
  '全疾病団信':     'bg-pink-100 text-pink-700',
  'ペアローン':     'bg-purple-100 text-purple-700',
  '単身対応':       'bg-blue-100 text-blue-700',
  '狭小物件':       'bg-blue-50 text-blue-600',
  '外国籍OK':       'bg-green-100 text-green-700',
  '旧耐震OK':       'bg-yellow-100 text-yellow-700',
  '自営業OK':       'bg-orange-100 text-orange-700',
  '育休産休OK':     'bg-teal-100 text-teal-700',
  '借換え対応':     'bg-indigo-100 text-indigo-700',
  '50年ローン':     'bg-gray-100 text-gray-700',
  '諸費用込み':     'bg-emerald-100 text-emerald-700',
  'おまとめローン': 'bg-violet-100 text-violet-700',
  'リフォーム費用込': 'bg-amber-100 text-amber-700',
  '転職者OK':       'bg-cyan-100 text-cyan-700',
};

function RateArrow({ rate, prev }: { rate: number; prev: number | null }) {
  if (prev === null) return null;
  const diff = rate - prev;
  if (Math.abs(diff) < 0.0001) {
    return <span className="text-gray-400 text-xs">→ ±0</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-danger-500 text-xs font-semibold">
        ▲ +{diff.toFixed(3)}%
      </span>
    );
  }
  return (
    <span className="text-success-500 text-xs font-semibold">
      ▼ {diff.toFixed(3)}%
    </span>
  );
}

function TagPill({ tag }: { tag: HomeLoan137Tag }) {
  const cls = TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {tag}
    </span>
  );
}

function BankCard({
  bank,
  highlighted,
}: {
  bank: HomeLoan137;
  highlighted: boolean;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const visibleTags = bank.tags.slice(0, 4);
  const extraCount = bank.tags.length - 4;
  const rateColor =
    bank.rate < 0.7
      ? 'text-success-500'
      : bank.rate < 1.0
      ? 'text-navy-500'
      : bank.rate < 2.0
      ? 'text-orange-500'
      : 'text-danger-500';

  return (
    <div
      className={`bg-white rounded-xl border border-neutral-100 shadow-sm flex flex-col transition-shadow hover:shadow-md relative ${
        highlighted ? 'ring-2 ring-orange-400' : ''
      }`}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy-500 leading-tight line-clamp-2">
            {bank.name}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">No.{bank.no}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
            bank.rateType === '変動'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {bank.rateType}
        </span>
      </div>

      {/* Rate */}
      <div className="px-4 pb-2 flex items-end gap-2">
        <span className={`text-3xl font-extrabold leading-none ${rateColor}`}>
          {bank.rate.toFixed(3)}
          <span className="text-base font-bold">%</span>
        </span>
        <div className="mb-0.5">
          <RateArrow rate={bank.rate} prev={bank.prevMonthRate} />
        </div>
      </div>

      {/* Data rows */}
      <div className="px-4 pb-3 space-y-1.5 flex-1">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-500">月額返済</span>
          <span className="font-semibold text-navy-500">
            {yen(bank.monthlyPayment)}/月
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-neutral-500">手数料</span>
          <span className={`font-semibold ${bank.fee === 0 ? 'text-success-500' : 'text-navy-500'}`}>
            {bank.fee === 0 ? '無料' : yen(bank.fee)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-neutral-500">最大借入</span>
          <span className="font-semibold text-navy-500">
            {bank.maxLoan > 0 ? `${bank.maxLoan.toLocaleString('ja-JP')}万円` : '−'}
          </span>
        </div>
      </div>

      {/* Tags */}
      {bank.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
          {extraCount > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Features tooltip trigger */}
      <div className="px-4 pb-4 relative">
        <button
          type="button"
          className="text-xs text-neutral-400 hover:text-navy-500 underline underline-offset-2 transition-colors"
          onClick={() => setTooltipOpen((v) => !v)}
        >
          詳細を見る
        </button>
        {tooltipOpen && (
          <div
            className="absolute bottom-full left-0 right-0 mb-2 z-20 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs text-neutral-700 leading-relaxed max-h-40 overflow-y-auto"
            onClick={() => setTooltipOpen(false)}
          >
            {bank.features}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeLoanPage() {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [rateTypeFilter, setRateTypeFilter] = useState<RateTypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rate');

  const activePresetObj = useMemo(
    () => PREFERENCE_PRESETS.find((p) => p.id === activePreset) ?? null,
    [activePreset]
  );

  const filtered = useMemo(() => {
    let list: HomeLoan137[] = [...HOME_LOAN_137];

    // Preset filter
    if (activePresetObj) {
      list = list.filter(activePresetObj.filter);
    }

    // Rate type filter
    if (rateTypeFilter !== 'all') {
      list = list.filter((b) => b.rateType === rateTypeFilter);
    }

    // Text search
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.features.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rate':
        list.sort((a, b) => a.rate - b.rate);
        break;
      case 'fee':
        list.sort((a, b) => a.fee - b.fee);
        break;
      case 'maxLoan':
        list.sort((a, b) => b.maxLoan - a.maxLoan);
        break;
      case 'monthly':
        list.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
        break;
    }

    return list;
  }, [activePresetObj, rateTypeFilter, searchText, sortBy]);

  const isFiltering =
    activePreset !== null || searchText.trim() !== '' || rateTypeFilter !== 'all';

  // Stats for filtered results
  const stats = useMemo(() => {
    if (!isFiltering || filtered.length === 0) return null;
    const minRate = Math.min(...filtered.map((b) => b.rate));
    const maxMaxLoan = Math.max(...filtered.map((b) => b.maxLoan));
    const avgFee = Math.round(
      filtered.reduce((s, b) => s + b.fee, 0) / filtered.length
    );
    return { minRate, maxMaxLoan, avgFee };
  }, [filtered, isFiltering]);

  const handleClearAll = () => {
    setActivePreset(null);
    setSearchText('');
    setRateTypeFilter('all');
    setSortBy('rate');
  };

  return (
    <AppShell>
      {/* Header bar */}
      <div className="bg-navy-500 text-white px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">
              住宅ローン 金融機関比較 — 137機関完全収録
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">
              お客様の思考に合った銀行をワンタッチで検索
            </p>
          </div>
          <div className="shrink-0">
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              {filtered.length}件表示中
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5 max-w-screen-xl mx-auto">
        {/* Preset filter section */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-navy-500 mb-3">
            💡 ワンタッチ思考別フィルター
          </h2>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.desc}
                  onClick={() =>
                    setActivePreset(isActive ? null : preset.id)
                  }
                  className={`group relative flex flex-col items-center px-3 py-2 rounded-full border text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white border-neutral-200 text-navy-500 hover:border-orange-400 hover:text-orange-500'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span
                    className={`text-[10px] font-normal leading-tight mt-0.5 ${
                      isActive ? 'text-orange-100' : 'text-neutral-400 group-hover:text-orange-400'
                    }`}
                  >
                    {preset.desc}
                  </span>
                </button>
              );
            })}
            {activePreset !== null && (
              <button
                type="button"
                onClick={() => setActivePreset(null)}
                className="px-3 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 hover:bg-neutral-100 transition-colors font-medium"
              >
                すべて表示
              </button>
            )}
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Text search */}
            <div className="flex-1 min-w-48 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="銀行名・特徴で検索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            {/* Rate type segmented control */}
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden shrink-0">
              {(['all', '変動', '固定'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRateTypeFilter(type)}
                  className={`px-3 py-2 text-xs font-semibold border-r last:border-r-0 border-neutral-200 transition-colors ${
                    rateTypeFilter === type
                      ? 'bg-navy-500 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {type === 'all' ? '全て' : type}
                </button>
              ))}
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-xs border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-neutral-700 shrink-0"
            >
              <option value="rate">金利（低い順）</option>
              <option value="fee">手数料（低い順）</option>
              <option value="maxLoan">最大借入（高い順）</option>
              <option value="monthly">月額返済（低い順）</option>
            </select>

            {/* Clear all */}
            {isFiltering && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs px-3 py-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-danger-500 transition-colors shrink-0"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* Stats summary bar */}
        {stats && (
          <div className="bg-navy-500 text-white rounded-xl px-5 py-3 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-blue-200">最低金利</p>
              <p className="text-lg font-bold text-orange-300">
                {stats.minRate.toFixed(3)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-200">最大借入（最高）</p>
              <p className="text-lg font-bold">
                {stats.maxMaxLoan > 0
                  ? `${stats.maxMaxLoan.toLocaleString('ja-JP')}万円`
                  : '−'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-200">平均手数料</p>
              <p className="text-lg font-bold">
                {stats.avgFee === 0 ? '無料' : yen(stats.avgFee)}
              </p>
            </div>
            {activePresetObj && (
              <div className="ml-auto flex items-center">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {activePresetObj.label} 適用中
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bank cards grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-base font-bold text-navy-500 mb-1">
              条件に合う金融機関が見つかりませんでした
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              フィルターを変更するか、検索キーワードを見直してみてください
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              すべてのフィルターをクリア
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((bank) => (
              <BankCard
                key={bank.id}
                bank={bank}
                highlighted={
                  activePresetObj !== null && activePresetObj.filter(bank)
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
