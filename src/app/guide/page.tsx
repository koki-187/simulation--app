'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout';

// ─────────────────────────────────────────────
// SVG Mockup Components
// ─────────────────────────────────────────────

function InvestmentInputMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      {/* Background */}
      <rect width="480" height="300" fill="#F3F4F6" />
      {/* Header bar */}
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">📝 入力フォーム</text>
      {/* A/B tabs */}
      <rect x="380" y="6" width="44" height="24" rx="4" fill="#E8632A" />
      <text x="402" y="22" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">A</text>
      <rect x="428" y="6" width="44" height="24" rx="4" fill="#374151" />
      <text x="450" y="22" fill="#9CA3AF" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">B</text>

      {/* Left panel */}
      <rect x="8" y="44" width="220" height="248" rx="6" fill="white" />
      {/* Section: 物件情報 */}
      <rect x="14" y="50" width="208" height="18" rx="3" fill="#EEF2FF" />
      <text x="18" y="63" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">物件情報</text>
      <text x="14" y="84" fill="#6B7280" fontSize="8" fontFamily="sans-serif">物件名</text>
      <rect x="14" y="88" width="208" height="14" rx="3" fill="#F3F4F6" />
      <text x="14" y="116" fill="#6B7280" fontSize="8" fontFamily="sans-serif">物件価格</text>
      <rect x="14" y="120" width="208" height="14" rx="3" fill="#F3F4F6" />
      <text x="14" y="148" fill="#6B7280" fontSize="8" fontFamily="sans-serif">家賃収入（月）</text>
      <rect x="14" y="152" width="208" height="14" rx="3" fill="#F3F4F6" />

      {/* Section: ローン条件 */}
      <rect x="14" y="174" width="208" height="18" rx="3" fill="#EEF2FF" />
      <text x="18" y="187" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">ローン条件</text>
      <text x="14" y="206" fill="#6B7280" fontSize="8" fontFamily="sans-serif">金利 (%)</text>
      <rect x="14" y="210" width="95" height="14" rx="3" fill="#F3F4F6" />
      <text x="120" y="206" fill="#6B7280" fontSize="8" fontFamily="sans-serif">期間 (年)</text>
      <rect x="120" y="210" width="102" height="14" rx="3" fill="#F3F4F6" />

      {/* Section: 運営計画 */}
      <rect x="14" y="232" width="208" height="18" rx="3" fill="#EEF2FF" />
      <text x="18" y="245" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">運営計画</text>
      <text x="14" y="264" fill="#6B7280" fontSize="8" fontFamily="sans-serif">管理費率 (%)</text>
      <rect x="14" y="268" width="95" height="14" rx="3" fill="#F3F4F6" />
      <text x="120" y="264" fill="#6B7280" fontSize="8" fontFamily="sans-serif">空室率 (%)</text>
      <rect x="120" y="268" width="102" height="14" rx="3" fill="#F3F4F6" />

      {/* Right panel */}
      <rect x="236" y="44" width="236" height="248" rx="6" fill="white" />
      <text x="244" y="60" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">シミュレーション概要</text>
      {/* Mini KPI cards */}
      <rect x="244" y="66" width="104" height="50" rx="4" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="252" y="80" fill="#6B7280" fontSize="7" fontFamily="sans-serif">月返済額</text>
      <text x="252" y="102" fill="#EF4444" fontSize="14" fontWeight="bold" fontFamily="sans-serif">¥89,000</text>
      <rect x="356" y="66" width="104" height="50" rx="4" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="364" y="80" fill="#6B7280" fontSize="7" fontFamily="sans-serif">実質利回り</text>
      <text x="364" y="102" fill="#22C55E" fontSize="14" fontWeight="bold" fontFamily="sans-serif">4.2%</text>
      {/* Dummy chart area */}
      <rect x="244" y="124" width="216" height="120" rx="4" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="352" y="180" fill="#9CA3AF" fontSize="8" fontFamily="sans-serif" textAnchor="middle">年次CF推移プレビュー</text>
      {/* Mini bars */}
      <rect x="258" y="200" width="12" height="24" rx="1" fill="#1C2B4A" opacity="0.3" />
      <rect x="276" y="188" width="12" height="36" rx="1" fill="#1C2B4A" opacity="0.4" />
      <rect x="294" y="192" width="12" height="32" rx="1" fill="#E8632A" opacity="0.5" />
      <rect x="312" y="180" width="12" height="44" rx="1" fill="#E8632A" opacity="0.6" />
      <rect x="330" y="172" width="12" height="52" rx="1" fill="#E8632A" opacity="0.7" />
      <rect x="348" y="160" width="12" height="64" rx="1" fill="#E8632A" opacity="0.8" />
      <rect x="366" y="148" width="12" height="76" rx="1" fill="#22C55E" opacity="0.7" />
      <rect x="384" y="140" width="12" height="84" rx="1" fill="#22C55E" opacity="0.8" />
      <line x1="244" y1="224" x2="460" y2="224" stroke="#E5E7EB" strokeWidth="0.5" />
      {/* Calculate button */}
      <rect x="244" y="252" width="216" height="28" rx="5" fill="#E8632A" />
      <text x="352" y="270" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">シミュレーション実行</text>
    </svg>
  );
}

function DashboardMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      <rect width="480" height="300" fill="#F3F4F6" />
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">📊 ダッシュボード</text>
      <text x="380" y="23" fill="#93C5FD" fontSize="9" fontFamily="sans-serif">Pattern A / B</text>

      {/* 4 KPI cards */}
      {/* Card 1: 月返済額 */}
      <rect x="8" y="44" width="108" height="64" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="60" fill="#6B7280" fontSize="8" fontFamily="sans-serif">月返済額</text>
      <text x="16" y="80" fill="#EF4444" fontSize="16" fontWeight="bold" fontFamily="sans-serif">¥89,000</text>
      <text x="16" y="96" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">/ 月</text>

      {/* Card 2: 実質利回り */}
      <rect x="124" y="44" width="108" height="64" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="132" y="60" fill="#6B7280" fontSize="8" fontFamily="sans-serif">実質利回り</text>
      <text x="132" y="80" fill="#22C55E" fontSize="16" fontWeight="bold" fontFamily="sans-serif">4.2%</text>
      <text x="132" y="96" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">年間</text>

      {/* Card 3: 税引後CF */}
      <rect x="240" y="44" width="108" height="64" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="248" y="60" fill="#6B7280" fontSize="8" fontFamily="sans-serif">税引後CF</text>
      <text x="248" y="80" fill="#22C55E" fontSize="16" fontWeight="bold" fontFamily="sans-serif">¥32,000</text>
      <text x="248" y="96" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">/ 月</text>

      {/* Card 4: CAGR */}
      <rect x="356" y="44" width="116" height="64" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="364" y="60" fill="#6B7280" fontSize="8" fontFamily="sans-serif">CAGR</text>
      <text x="364" y="80" fill="#1C2B4A" fontSize="16" fontWeight="bold" fontFamily="sans-serif">6.1%</text>
      <text x="364" y="96" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">年平均成長率</text>

      {/* Area Chart */}
      <rect x="8" y="116" width="464" height="140" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="132" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">累計キャッシュフロー（万円）</text>
      {/* Grid lines */}
      <line x1="16" y1="148" x2="464" y2="148" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="168" x2="464" y2="168" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="188" x2="464" y2="188" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="208" x2="464" y2="208" stroke="#F3F4F6" strokeWidth="1" />
      {/* Baseline */}
      <line x1="16" y1="228" x2="464" y2="228" stroke="#E5E7EB" strokeWidth="1" />
      {/* Area A fill (navy) */}
      <path d="M24 228 L68 220 L112 210 L156 195 L200 175 L244 155 L288 140 L332 128 L376 118 L420 110 L456 105 L456 228 Z" fill="#EEF2FF" opacity="0.8" />
      <path d="M24 228 L68 220 L112 210 L156 195 L200 175 L244 155 L288 140 L332 128 L376 118 L420 110 L456 105" fill="none" stroke="#1C2B4A" strokeWidth="2" />
      {/* Area B fill (orange) */}
      <path d="M24 228 L68 222 L112 218 L156 210 L200 198 L244 182 L288 168 L332 155 L376 145 L420 136 L456 130 L456 228 Z" fill="#FFF5F0" opacity="0.8" />
      <path d="M24 228 L68 222 L112 218 L156 210 L200 198 L244 182 L288 168 L332 155 L376 145 L420 136 L456 130" fill="none" stroke="#E8632A" strokeWidth="2" />
      {/* Legend */}
      <rect x="330" y="120" width="8" height="4" fill="#1C2B4A" />
      <text x="342" y="126" fill="#6B7280" fontSize="7" fontFamily="sans-serif">A 累計CF</text>
      <rect x="390" y="120" width="8" height="4" fill="#E8632A" />
      <text x="402" y="126" fill="#6B7280" fontSize="7" fontFamily="sans-serif">B 累計CF</text>
      {/* Zero reference line label */}
      <text x="8" y="232" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">0</text>
      <line x1="16" y1="228" x2="456" y2="228" stroke="#667085" strokeWidth="0.5" strokeDasharray="3 3" />
    </svg>
  );
}

function RefinanceMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      <rect width="480" height="300" fill="#F3F4F6" />
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">🔄 借り換えシミュレーター</text>

      {/* Left input panel */}
      <rect x="8" y="44" width="168" height="188" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="60" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">現在のローン</text>
      <text x="16" y="76" fill="#6B7280" fontSize="7" fontFamily="sans-serif">残債（万円）</text>
      <rect x="16" y="80" width="152" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="90" fill="#111827" fontSize="8" fontFamily="sans-serif">3,500</text>
      <text x="16" y="108" fill="#6B7280" fontSize="7" fontFamily="sans-serif">現在金利 (%)</text>
      <rect x="16" y="112" width="152" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="122" fill="#111827" fontSize="8" fontFamily="sans-serif">1.200</text>
      <text x="16" y="140" fill="#6B7280" fontSize="7" fontFamily="sans-serif">残期間 (年)</text>
      <rect x="16" y="144" width="152" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="154" fill="#111827" fontSize="8" fontFamily="sans-serif">22</text>
      {/* 3 condition check */}
      <rect x="16" y="168" width="152" height="56" rx="4" fill="#F0FDF4" stroke="#22C55E" strokeWidth="0.5" />
      <text x="24" y="182" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">✅ 借り換え推奨</text>
      <text x="24" y="196" fill="#6B7280" fontSize="7" fontFamily="sans-serif">✅ 金利差: 0.35%</text>
      <text x="24" y="208" fill="#6B7280" fontSize="7" fontFamily="sans-serif">✅ 残期間: 22年</text>
      <text x="24" y="220" fill="#6B7280" fontSize="7" fontFamily="sans-serif">✅ 残債: 3,500万</text>

      {/* Right: Bank comparison table */}
      <rect x="184" y="44" width="288" height="188" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="192" y="60" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">銀行別比較</text>
      {/* Table header */}
      <rect x="184" y="64" width="288" height="18" fill="#F3F4F6" />
      <text x="192" y="76" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">銀行名</text>
      <text x="278" y="76" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">金利</text>
      <text x="320" y="76" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">月削減額</text>
      <text x="378" y="76" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">評価</text>

      {/* Row 1 - Winner */}
      <rect x="184" y="82" width="288" height="28" fill="#F0FDF4" />
      <rect x="188" y="87" width="18" height="13" rx="2" fill="#F59E0B" />
      <text x="197" y="97" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">🏆</text>
      <text x="210" y="97" fill="#111827" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">PayPay銀行</text>
      <text x="278" y="97" fill="#22C55E" fontSize="8" fontWeight="bold" fontFamily="sans-serif">0.850%</text>
      <text x="320" y="97" fill="#22C55E" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">▼¥6,200</text>
      <text x="378" y="97" fill="#F59E0B" fontSize="9" fontFamily="sans-serif">★★★★★</text>

      {/* Row 2 */}
      <rect x="184" y="110" width="288" height="24" fill="white" />
      <text x="192" y="125" fill="#111827" fontSize="7.5" fontFamily="sans-serif">auじぶん銀行</text>
      <text x="278" y="125" fill="#1C2B4A" fontSize="7.5" fontFamily="sans-serif">0.930%</text>
      <text x="320" y="125" fill="#22C55E" fontSize="7.5" fontFamily="sans-serif">▼¥5,100</text>
      <text x="378" y="125" fill="#F59E0B" fontSize="9" fontFamily="sans-serif">★★★★</text>

      {/* Row 3 */}
      <rect x="184" y="134" width="288" height="24" fill="#F9FAFB" />
      <text x="192" y="149" fill="#111827" fontSize="7.5" fontFamily="sans-serif">住信SBI銀行</text>
      <text x="278" y="149" fill="#1C2B4A" fontSize="7.5" fontFamily="sans-serif">0.950%</text>
      <text x="320" y="149" fill="#22C55E" fontSize="7.5" fontFamily="sans-serif">▼¥4,800</text>
      <text x="378" y="149" fill="#F59E0B" fontSize="9" fontFamily="sans-serif">★★★★</text>

      {/* Bottom mini chart */}
      <rect x="184" y="166" width="288" height="60" rx="4" fill="#F9FAFB" />
      <text x="192" y="180" fill="#6B7280" fontSize="7" fontFamily="sans-serif">累計節約額推移</text>
      <path d="M192 218 L220 210 L252 200 L284 186 L316 170 L348 155 L380 138 L412 122 L444 108 L460 102" fill="none" stroke="#22C55E" strokeWidth="2" />
      <path d="M192 218 L220 210 L252 200 L284 186 L316 170 L348 155 L380 138 L412 122 L444 108 L460 102 L460 218 Z" fill="#F0FDF4" opacity="0.7" />
    </svg>
  );
}

function HomeLoanMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      <rect width="480" height="300" fill="#F3F4F6" />
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">🏠 住宅ローン計算機</text>

      {/* Left input panel */}
      <rect x="8" y="44" width="192" height="248" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="60" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">物件・ローン条件</text>
      <text x="16" y="78" fill="#6B7280" fontSize="7" fontFamily="sans-serif">物件価格（万円）</text>
      <rect x="16" y="82" width="176" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="92" fill="#111827" fontSize="8" fontFamily="sans-serif">5,000</text>
      <text x="16" y="110" fill="#6B7280" fontSize="7" fontFamily="sans-serif">頭金（万円）</text>
      <rect x="16" y="114" width="176" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="124" fill="#111827" fontSize="8" fontFamily="sans-serif">500</text>
      <text x="16" y="142" fill="#6B7280" fontSize="7" fontFamily="sans-serif">金利 (%)</text>
      {/* Slider mock */}
      <rect x="16" y="146" width="176" height="8" rx="4" fill="#E5E7EB" />
      <rect x="16" y="146" width="80" height="8" rx="4" fill="#E8632A" />
      <circle cx="96" cy="150" r="6" fill="white" stroke="#E8632A" strokeWidth="2" />
      <text x="100" y="142" fill="#E8632A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">0.85%</text>

      <text x="16" y="170" fill="#6B7280" fontSize="7" fontFamily="sans-serif">借入期間（年）</text>
      <rect x="16" y="174" width="176" height="8" rx="4" fill="#E5E7EB" />
      <rect x="16" y="174" width="130" height="8" rx="4" fill="#1C2B4A" />
      <circle cx="146" cy="178" r="6" fill="white" stroke="#1C2B4A" strokeWidth="2" />
      <text x="150" y="170" fill="#1C2B4A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">35年</text>
      <text x="16" y="202" fill="#6B7280" fontSize="7" fontFamily="sans-serif">年収（万円）</text>
      <rect x="16" y="206" width="176" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="216" fill="#111827" fontSize="8" fontFamily="sans-serif">800</text>

      {/* Right panels */}
      {/* Monthly payment card */}
      <rect x="208" y="44" width="264" height="72" rx="6" fill="#1C2B4A" />
      <text x="220" y="62" fill="#93C5FD" fontSize="8" fontFamily="sans-serif">月々の返済額</text>
      <text x="220" y="92" fill="white" fontSize="26" fontWeight="bold" fontFamily="sans-serif">¥121,000</text>
      <text x="400" y="92" fill="#93C5FD" fontSize="9" fontFamily="sans-serif">/ 月</text>
      <text x="220" y="108" fill="#64748B" fontSize="7" fontFamily="sans-serif">総支払: ¥50,799,868 ｜ 利息: ¥749,868</text>

      {/* 住宅ローン控除 mini table */}
      <rect x="208" y="124" width="264" height="96" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="216" y="140" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">住宅ローン控除（13年）</text>
      <rect x="208" y="144" width="264" height="16" fill="#EEF2FF" />
      <text x="216" y="155" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">年度</text>
      <text x="280" y="155" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">年末残高</text>
      <text x="360" y="155" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">控除額</text>
      <text x="216" y="172" fill="#111827" fontSize="7" fontFamily="sans-serif">1年目</text>
      <text x="280" y="172" fill="#6B7280" fontSize="7" fontFamily="sans-serif">4,481万</text>
      <text x="360" y="172" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">31.4万</text>
      <text x="216" y="186" fill="#111827" fontSize="7" fontFamily="sans-serif">2年目</text>
      <text x="280" y="186" fill="#6B7280" fontSize="7" fontFamily="sans-serif">4,347万</text>
      <text x="360" y="186" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">30.4万</text>
      <text x="216" y="200" fill="#111827" fontSize="7" fontFamily="sans-serif">3年目</text>
      <text x="280" y="200" fill="#6B7280" fontSize="7" fontFamily="sans-serif">4,210万</text>
      <text x="360" y="200" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">29.5万</text>
      <text x="216" y="214" fill="#6B7280" fontSize="7" fontFamily="sans-serif">...13年合計</text>
      <text x="360" y="214" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">373万</text>

      {/* Risk scenarios */}
      <rect x="208" y="228" width="264" height="60" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="216" y="244" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">金利上昇リスク（+0〜+2%）</text>
      {[
        { label: '+0%', value: '¥121,000', color: '#22C55E', x: 216 },
        { label: '+0.5%', value: '¥128,500', color: '#84CC16', x: 264 },
        { label: '+1.0%', value: '¥136,200', color: '#F59E0B', x: 312 },
        { label: '+1.5%', value: '¥144,100', color: '#F97316', x: 360 },
        { label: '+2.0%', value: '¥152,300', color: '#EF4444', x: 408 },
      ].map((s) => (
        <g key={s.label}>
          <rect x={s.x} y="250" width="40" height="30" rx="3" fill={s.color} opacity="0.15" stroke={s.color} strokeWidth="0.5" />
          <text x={s.x + 20} y="263" fill={s.color} fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">{s.label}</text>
          <text x={s.x + 20} y="274" fill={s.color} fontSize="5.5" fontFamily="sans-serif" textAnchor="middle">{s.value}</text>
        </g>
      ))}
    </svg>
  );
}

function CashflowMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      <rect width="480" height="300" fill="#F3F4F6" />
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">💰 キャッシュフロー分析</text>

      {/* Bar chart area */}
      <rect x="8" y="44" width="464" height="130" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="60" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">年次CF推移（万円）</text>
      {/* Grid lines */}
      <line x1="16" y1="80" x2="464" y2="80" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="100" x2="464" y2="100" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="120" x2="464" y2="120" stroke="#F3F4F6" strokeWidth="1" />
      <line x1="16" y1="140" x2="464" y2="140" stroke="#E5E7EB" strokeWidth="1" />
      <text x="8" y="144" fill="#9CA3AF" fontSize="6" fontFamily="sans-serif">0</text>
      {/* Bars: 5 years sample */}
      {[
        { x: 40, h: 30, label: '1年', color: '#1C2B4A' },
        { x: 120, h: 42, label: '5年', color: '#E8632A' },
        { x: 200, h: 55, label: '10年', color: '#E8632A' },
        { x: 280, h: 70, label: '15年', color: '#E8632A' },
        { x: 360, h: 82, label: '20年', color: '#22C55E' },
        { x: 420, h: 90, label: '25年', color: '#22C55E' },
      ].map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={140 - b.h} width="32" height={b.h} rx="2" fill={b.color} opacity="0.8" />
          <text x={b.x + 16} y="155" fill="#6B7280" fontSize="7" fontFamily="sans-serif" textAnchor="middle">{b.label}</text>
        </g>
      ))}

      {/* Table area */}
      <rect x="8" y="182" width="464" height="110" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <rect x="8" y="182" width="464" height="22" rx="6" fill="#1C2B4A" />
      <text x="16" y="197" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">年次キャッシュフロー詳細</text>
      {/* Table header */}
      <rect x="8" y="204" width="464" height="16" fill="#F9FAFB" />
      {['年', '家賃収入', '運営CF', 'ローン返済', '税引後CF', '累計CF'].map((h, i) => (
        <text key={h} x={16 + i * 74} y="215" fill="#6B7280" fontSize="7" fontWeight="bold" fontFamily="sans-serif">{h}</text>
      ))}
      {/* Table rows */}
      {[
        { year: '1', rent: '¥1,200,000', opCF: '¥984,000', loan: '¥900,000', atCF: '-¥15,000', cum: '-¥15,000', highlight: false },
        { year: '5', rent: '¥1,176,000', opCF: '¥964,320', loan: '¥900,000', atCF: '¥64,320', cum: '¥248,000', highlight: false },
        { year: '8', rent: '¥1,164,240', opCF: '¥954,677', loan: '¥900,000', atCF: '¥54,677', cum: '¥0', highlight: true },
        { year: '10', rent: '¥1,152,598', opCF: '¥945,130', loan: '¥900,000', atCF: '¥45,130', cum: '¥120,000', highlight: false },
        { year: '15', rent: '¥1,117,745', opCF: '¥916,551', loan: '¥900,000', atCF: '¥16,551', cum: '¥340,000', highlight: false },
        { year: '20', rent: '¥1,082,892', opCF: '¥887,972', loan: '¥900,000', atCF: '¥87,972', cum: '¥680,000', highlight: false },
      ].map((r, i) => (
        <g key={r.year}>
          <rect x="8" y={220 + i * 12} width="464" height="12"
            fill={r.highlight ? '#FFF7ED' : i % 2 === 0 ? 'white' : '#F9FAFB'}
            stroke={r.highlight ? '#E8632A' : 'none'}
            strokeWidth="0.5"
          />
          <text x="16" y={229 + i * 12} fill="#111827" fontSize="6.5" fontFamily="sans-serif">{r.year}</text>
          <text x="60" y={229 + i * 12} fill="#6B7280" fontSize="6.5" fontFamily="sans-serif">{r.rent}</text>
          <text x="134" y={229 + i * 12} fill="#6B7280" fontSize="6.5" fontFamily="sans-serif">{r.opCF}</text>
          <text x="208" y={229 + i * 12} fill="#6B7280" fontSize="6.5" fontFamily="sans-serif">{r.loan}</text>
          <text x="282" y={229 + i * 12}
            fill={r.atCF.startsWith('-') ? '#EF4444' : '#22C55E'}
            fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">{r.atCF}</text>
          <text x="356" y={229 + i * 12}
            fill={r.cum.startsWith('-') ? '#EF4444' : r.highlight ? '#E8632A' : '#22C55E'}
            fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">{r.cum}</text>
        </g>
      ))}
    </svg>
  );
}

function FundingPlanMockup() {
  return (
    <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-md border border-neutral-200">
      <rect width="480" height="300" fill="#F3F4F6" />
      <rect width="480" height="36" fill="#1C2B4A" />
      <text x="12" y="23" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">📋 資金計画書</text>

      {/* Left form panel */}
      <rect x="8" y="44" width="200" height="248" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="16" y="62" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">物件・顧客情報</text>
      <text x="16" y="78" fill="#6B7280" fontSize="7" fontFamily="sans-serif">物件名</text>
      <rect x="16" y="82" width="184" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="92" fill="#111827" fontSize="8" fontFamily="sans-serif">渋谷区神南マンション</text>
      <text x="16" y="108" fill="#6B7280" fontSize="7" fontFamily="sans-serif">所在地</text>
      <rect x="16" y="112" width="184" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="122" fill="#111827" fontSize="8" fontFamily="sans-serif">東京都渋谷区神南1-1-1</text>
      <text x="16" y="138" fill="#6B7280" fontSize="7" fontFamily="sans-serif">物件価格（万円）</text>
      <rect x="16" y="142" width="184" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="152" fill="#111827" fontSize="8" fontFamily="sans-serif">8,500</text>
      <text x="16" y="168" fill="#6B7280" fontSize="7" fontFamily="sans-serif">金融機関</text>
      <rect x="16" y="172" width="184" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="182" fill="#111827" fontSize="8" fontFamily="sans-serif">三菱UFJ銀行</text>
      <text x="16" y="198" fill="#6B7280" fontSize="7" fontFamily="sans-serif">顧客名</text>
      <rect x="16" y="202" width="184" height="14" rx="3" fill="#F3F4F6" />
      <text x="20" y="212" fill="#111827" fontSize="8" fontFamily="sans-serif">山田 太郎 様</text>
      {/* PDF button */}
      <rect x="16" y="230" width="184" height="28" rx="5" fill="#E8632A" />
      <text x="108" y="248" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">📄 PDF出力</text>
      <text x="108" y="264" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif" textAnchor="middle">A4縦フォーマット</text>

      {/* Right PDF preview */}
      <rect x="216" y="44" width="256" height="248" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="224" y="62" fill="#1C2B4A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PDF プレビュー</text>
      {/* Simulated A4 page */}
      <rect x="228" y="68" width="236" height="216" rx="3" fill="white" stroke="#D1D5DB" strokeWidth="1" />
      <rect x="228" y="68" width="236" height="26" fill="#1C2B4A" />
      <text x="346" y="86" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">TERASS 資金計画書</text>
      {/* Divider lines */}
      <line x1="236" y1="102" x2="456" y2="102" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="236" y="116" fill="#6B7280" fontSize="7" fontFamily="sans-serif">物件名</text>
      <text x="280" y="116" fill="#111827" fontSize="7" fontFamily="sans-serif">渋谷区神南マンション</text>
      <line x1="236" y1="120" x2="456" y2="120" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="236" y="134" fill="#6B7280" fontSize="7" fontFamily="sans-serif">物件価格</text>
      <text x="280" y="134" fill="#111827" fontSize="7" fontFamily="sans-serif">85,000,000円</text>
      <line x1="236" y1="138" x2="456" y2="138" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="236" y="152" fill="#6B7280" fontSize="7" fontFamily="sans-serif">月返済額</text>
      <text x="280" y="152" fill="#EF4444" fontSize="7" fontWeight="bold" fontFamily="sans-serif">¥213,000</text>
      <line x1="236" y1="156" x2="456" y2="156" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="236" y="170" fill="#6B7280" fontSize="7" fontFamily="sans-serif">実質利回り</text>
      <text x="280" y="170" fill="#22C55E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">3.8%</text>
      <line x1="236" y1="174" x2="456" y2="174" stroke="#E5E7EB" strokeWidth="0.5" />
      {/* Mini chart in PDF */}
      <rect x="236" y="180" width="212" height="60" rx="2" fill="#F9FAFB" />
      <text x="342" y="194" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif" textAnchor="middle">キャッシュフロー概要</text>
      <rect x="244" y="206" width="16" height="24" rx="1" fill="#1C2B4A" opacity="0.4" />
      <rect x="268" y="198" width="16" height="32" rx="1" fill="#E8632A" opacity="0.5" />
      <rect x="292" y="190" width="16" height="40" rx="1" fill="#E8632A" opacity="0.6" />
      <rect x="316" y="182" width="16" height="48" rx="1" fill="#22C55E" opacity="0.6" />
      <rect x="340" y="174" width="16" height="56" rx="1" fill="#22C55E" opacity="0.7" />
      <text x="236" y="256" fill="#9CA3AF" fontSize="6" fontFamily="sans-serif">※ 本書は試算であり、保証するものではありません</text>
      <text x="236" y="266" fill="#9CA3AF" fontSize="6" fontFamily="sans-serif">TERASS 不動産シミュレーター</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MockupKey = 'investment-input' | 'dashboard' | 'refinance' | 'home-loan' | 'cashflow' | 'funding-plan';

interface Step {
  label: string;
  href: string;
}

interface KeyPoint {
  text: string;
}

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  steps: Step[];
  mockup: MockupKey;
  keyPoints: KeyPoint[];
  linkHref: string;
  linkLabel: string;
}

interface Persona {
  id: string;
  icon: string;
  label: string;
  scenarios: Scenario[];
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const PERSONAS: Persona[] = [
  {
    id: 'investor',
    icon: '🏢',
    label: '投資家',
    scenarios: [
      {
        id: 'inv-a',
        title: '2つの物件を比べて最適な投資先を選ぶ',
        subtitle: '物件比較シミュレーション',
        steps: [
          { label: '物件A・Bの情報を入力', href: '/input' },
          { label: '収益指標を一覧確認', href: '/' },
          { label: 'レーダーチャートで最終判断', href: '/compare' },
        ],
        mockup: 'dashboard',
        keyPoints: [
          { text: 'A/Bパターンで2物件を同時シミュレーション' },
          { text: '表面利回り・実質利回り・税引後CFなど7指標を自動計算' },
          { text: 'レーダーチャートで視覚的に優劣を比較' },
        ],
        linkHref: '/input',
        linkLabel: '入力フォームを開く',
      },
      {
        id: 'inv-b',
        title: '購入から売却まで30年の全収支を把握する',
        subtitle: '30年収益・税金・売却 総合分析',
        steps: [
          { label: 'CF30年を確認', href: '/cashflow' },
          { label: '毎年の税負担を把握', href: '/tax' },
          { label: '出口戦略を検討', href: '/sale' },
        ],
        mockup: 'cashflow',
        keyPoints: [
          { text: '30年間の年次キャッシュフローを一覧表示' },
          { text: '不動産所得税・譲渡所得税を自動計算' },
          { text: '保有5〜50年×楽観/標準/悲観の売却シミュレーション' },
        ],
        linkHref: '/cashflow',
        linkLabel: 'CFページを開く',
      },
    ],
  },
  {
    id: 'home-buyer',
    icon: '🏠',
    label: 'マイホーム購入',
    scenarios: [
      {
        id: 'home-a',
        title: '金利・控除・繰上返済で最適な返済プランを立てる',
        subtitle: '住宅ローン返済計画と税金メリット',
        steps: [
          { label: '物件価格・金利・期間を入力', href: '/home-sim' },
          { label: '住宅ローン控除額を確認', href: '/home-sim' },
          { label: '繰上返済で節約利息を試算', href: '/prepayment' },
        ],
        mockup: 'home-loan',
        keyPoints: [
          { text: '住宅ローン控除（年間最大0.7%×13年）を自動計算' },
          { text: '金利上昇+0%〜+2%の5段階リスクシミュレーション' },
          { text: '繰上返済の「期間短縮型」と「返済額軽減型」を比較' },
        ],
        linkHref: '/home-sim',
        linkLabel: '住宅ローン計算機を開く',
      },
    ],
  },
  {
    id: 'refinancer',
    icon: '🔄',
    label: '借り換え検討',
    scenarios: [
      {
        id: 'refi-a',
        title: '11行を一括比較して最適な借り換え先を見つける',
        subtitle: '借り換えで月の負担を減らす',
        steps: [
          { label: '残債・金利・残期間を入力', href: '/refinance' },
          { label: '銀行名入力で手数料自動設定', href: '/refinance' },
          { label: '月削減額・損益分岐を比較', href: '/refinance' },
        ],
        mockup: 'refinance',
        keyPoints: [
          { text: '3条件チェック（金利差0.3%・残期間10年・残債1,000万）で即判定' },
          { text: '11銀行の月削減額・総節約額・損益分岐を一覧比較' },
          { text: '金利上昇+0.3%/+0.5%のリスクシナリオも同時確認' },
        ],
        linkHref: '/refinance',
        linkLabel: '借り換えページを開く',
      },
    ],
  },
  {
    id: 'agent',
    icon: '👔',
    label: 'エージェント',
    scenarios: [
      {
        id: 'agent-a',
        title: '物件情報を入力してA4資金計画書PDFを即出力する',
        subtitle: 'クライアントへの提案資料を作成する',
        steps: [
          { label: '物件・顧客情報を入力', href: '/funding-plan' },
          { label: '収支計画が自動計算', href: '/funding-plan' },
          { label: 'A4提案書をPDF出力', href: '/funding-plan' },
        ],
        mockup: 'funding-plan',
        keyPoints: [
          { text: '物件情報から収支計画まで全てフォームで入力するだけ' },
          { text: '金融機関名は入力候補からサジェスト' },
          { text: 'A4縦レイアウトのプロフェッショナルな提案書を即生成' },
        ],
        linkHref: '/funding-plan',
        linkLabel: '資金計画書を開く',
      },
      {
        id: 'agent-b',
        title: '年収倍率・返済比率・DSCRで融資可否を事前判断する',
        subtitle: '融資審査の健全性を事前チェックする',
        steps: [
          { label: '物件情報と年収を入力', href: '/input' },
          { label: '融資審査5項目をチェック', href: '/ratios' },
          { label: '条件に合う金融機関を検索', href: '/bank-db' },
        ],
        mockup: 'dashboard',
        keyPoints: [
          { text: '年収倍率・返済比率・DSCR・損益分岐賃料を一括計算' },
          { text: '融資健全性チェックリスト5項目（✅/❌）で即判定' },
          { text: '投資用金融機関DBでタイプ・構造・エリアで検索' },
        ],
        linkHref: '/ratios',
        linkLabel: '審査指標ページを開く',
      },
    ],
  },
];

const QUICK_START_LINKS = [
  { href: '/input', icon: '📝', label: '入力フォーム', desc: '物件・ローン・運営情報を入力' },
  { href: '/', icon: '📊', label: 'ダッシュボード', desc: '収益指標の総合サマリー' },
  { href: '/cashflow', icon: '💰', label: 'キャッシュフロー', desc: '30年間の年次収支一覧' },
  { href: '/sale', icon: '🏷️', label: '売却シミュレーション', desc: '出口戦略の楽観/標準/悲観' },
  { href: '/tax', icon: '🧾', label: '税金詳細', desc: '所得税・譲渡税の自動計算' },
  { href: '/compare', icon: '⚖️', label: 'A/B比較', desc: 'レーダーチャートで物件比較' },
  { href: '/home-sim', icon: '🏠', label: '住宅ローン計算機', desc: '月返済額・控除・リスク分析' },
  { href: '/refinance', icon: '🔄', label: '借り換え比較', desc: '11銀行の一括比較シミュレーション' },
  { href: '/ratios', icon: '📈', label: '年収倍率・返済比率', desc: '融資健全性チェックリスト' },
  { href: '/funding-plan', icon: '📋', label: '資金計画書', desc: 'A4提案書のPDF即時出力' },
  { href: '/bank-db', icon: '🗄️', label: '金融機関DB', desc: 'タイプ・構造・エリアで検索' },
  { href: '/prepayment', icon: '⏩', label: '繰上げ返済', desc: '期間短縮型・返済額軽減型の比較' },
];

// ─────────────────────────────────────────────
// Mockup renderer
// ─────────────────────────────────────────────
function MockupRenderer({ mockup }: { mockup: MockupKey }) {
  switch (mockup) {
    case 'investment-input': return <InvestmentInputMockup />;
    case 'dashboard': return <DashboardMockup />;
    case 'refinance': return <RefinanceMockup />;
    case 'home-loan': return <HomeLoanMockup />;
    case 'cashflow': return <CashflowMockup />;
    case 'funding-plan': return <FundingPlanMockup />;
    default: return <DashboardMockup />;
  }
}

// ─────────────────────────────────────────────
// Scenario Card
// ─────────────────────────────────────────────
function ScenarioCard({ scenario, index, personaLabel }: { scenario: Scenario; index: number; personaLabel: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="bg-navy-500 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">
            {index}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                {scenario.subtitle}
              </span>
              <span className="bg-navy-400/40 text-navy-100 text-[10px] px-2 py-0.5 rounded-full border border-navy-400/30">
                {personaLabel}
              </span>
            </div>
            <h3 className="text-white font-bold text-base leading-snug">{scenario.title}</h3>
          </div>
        </div>
      </div>

      {/* Step Flow */}
      <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-start justify-center gap-1 flex-wrap">
          {scenario.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-1">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-[10px] text-neutral-600 mt-1 text-center max-w-[80px] leading-tight">{step.label}</span>
                <span className="text-[9px] text-neutral-400 font-mono">{step.href}</span>
              </div>
              {i < scenario.steps.length - 1 && (
                <span className="text-orange-300 text-base mt-1 flex-shrink-0">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content: mockup + explanation */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Mockup — 5:7 ratio (left: 5 cols) */}
        <div className="lg:col-span-2">
          <MockupRenderer mockup={scenario.mockup} />
        </div>

        {/* Steps explanation — right: 7 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="space-y-3">
            {scenario.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-navy-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-800 leading-tight">{step.label}</div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">{step.href}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Points */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">キーポイント</div>
            <ul className="space-y-2">
              {scenario.keyPoints.map((kp, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✅</span>
                  <span>{kp.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 flex justify-end">
        <Link
          href={scenario.linkHref}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          {scenario.linkLabel}
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function GuidePage() {
  const [activePersona, setActivePersona] = useState<string>('investor');

  const currentPersona = PERSONAS.find(p => p.id === activePersona) ?? PERSONAS[0];

  return (
    <AppShell>
      {/* Page Header */}
      <div className="bg-navy-500 text-white px-6 py-5">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>📖</span>
          <span>使い方ガイド</span>
        </h1>
        <p className="text-navy-100 text-sm mt-1">
          あなたの利用シーンに合わせて機能を使いこなしましょう
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Persona Tab Bar */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {PERSONAS.map(persona => (
              <button
                key={persona.id}
                onClick={() => setActivePersona(persona.id)}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                  activePersona === persona.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-neutral-500 border border-neutral-200 hover:border-orange-300 hover:text-orange-600',
                ].join(' ')}
              >
                <span>{persona.icon}</span>
                <span>{persona.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="space-y-6">
          {currentPersona.scenarios.map((scenario, i) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              index={i + 1}
              personaLabel={`${currentPersona.icon} ${currentPersona.label}`}
            />
          ))}
        </div>

        {/* Quick Start Section */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-navy-500 px-5 py-3">
            <h2 className="text-white font-bold text-sm">⚡ クイックスタート — 全ページ一覧</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {QUICK_START_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-1 p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-orange-300 hover:bg-orange-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{link.icon}</span>
                  <span className="text-xs font-bold text-neutral-800 group-hover:text-orange-600 transition-colors leading-tight">{link.label}</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight pl-0.5">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
