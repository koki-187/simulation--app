'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { memo } from 'react';

type NavItem =
  | { type: 'link'; href: string; label: string; icon: string }
  | { type: 'section'; label: string };

const NAV: NavItem[] = [
  // ── はじめに ──────────────────────────────────
  { type: 'section', label: 'はじめに' },
  { type: 'link', href: '/guide',       label: '使い方ガイド',        icon: '📖' },

  // ── 収益用ローン ──────────────────────────────
  { type: 'section', label: '収益用ローン' },
  { type: 'link', href: '/',             label: 'ダッシュボード',      icon: '📊' },
  { type: 'link', href: '/input',        label: '入力フォーム',        icon: '📝' },
  { type: 'link', href: '/amortization', label: '返済スケジュール',    icon: '📅' },
  { type: 'link', href: '/cashflow',     label: 'キャッシュフロー',    icon: '💰' },
  { type: 'link', href: '/sale',         label: '売却シミュレーション', icon: '🏷️' },
  { type: 'link', href: '/tax',          label: '税金詳細',            icon: '🧾' },
  { type: 'link', href: '/compare',      label: 'A/B比較',            icon: '⚖️' },
  { type: 'link', href: '/ratios',       label: '年収倍率・返済比率',  icon: '📈' },
  { type: 'link', href: '/bank-db',      label: '金融機関DB',          icon: '🗄️' },

  // ── 住宅ローン ────────────────────────────────
  { type: 'section', label: '住宅ローン' },
  { type: 'link', href: '/home-sim',     label: '住宅ローン計算機',    icon: '🏠' },
  { type: 'link', href: '/home-loan',    label: '金融機関137選',       icon: '🏡' },
  { type: 'link', href: '/prepayment',   label: '繰上げ返済',          icon: '⏩' },
  { type: 'link', href: '/refinance',    label: '借り換え比較',        icon: '🔄' },
  { type: 'link', href: '/partner-banks',label: '提携銀行ガイド',      icon: '🤝' },

  // ── 共通ツール ────────────────────────────────
  { type: 'section', label: '共通ツール' },
  { type: 'link', href: '/banks',        label: 'ローン比較',          icon: '🏦' },
  { type: 'link', href: '/loan-compare', label: '金融機関比較',        icon: '⚖️' },
  { type: 'link', href: '/funding-plan', label: '資金計画書',          icon: '📋' },
  { type: 'link', href: '/install',     label: 'アプリインストール',   icon: '📲' },
];

export const Sidebar = memo(function Sidebar({
  onClose,
  onBatchPrint,
}: {
  onClose?: () => void;
  onBatchPrint?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className="w-56 h-screen bg-navy-500 flex flex-col shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-600">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mas-logo.png"
            alt="MAS"
            className="h-7 w-auto object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-white font-bold text-xl tracking-widest leading-tight">MAS</div>
            <div className="text-navy-100 text-xs mt-0.5">My Agent Simulation</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={`section-${idx}`} className="mx-3 mt-5 mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-navy-400" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400 whitespace-nowrap px-1">
                    {item.label}
                  </span>
                  <div className="h-px flex-1 bg-navy-400" />
                </div>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors border-l-2',
                pathname === item.href
                  ? 'bg-orange-500 text-white font-semibold border-orange-300'
                  : 'text-navy-100 hover:bg-navy-600 hover:text-white border-transparent'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 一括PDF出力ボタン */}
      <div className="px-3 py-3 border-t border-navy-600">
        <button
          onClick={() => onBatchPrint?.()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
        >
          <span>📄</span>
          <span>一括PDF出力</span>
        </button>
      </div>
    </aside>
  );
});
