'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { memo } from 'react';

type NavItem =
  | { type: 'link'; href: string; label: string; icon: string }
  | { type: 'section'; label: string };

const NAV: NavItem[] = [
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
];

export const Sidebar = memo(function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="w-56 h-screen bg-navy-500 flex flex-col shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-600">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/terass-logo.png"
            alt="TERASS"
            className="h-7 w-auto object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-white font-bold text-xl tracking-widest leading-tight">TERASS</div>
            <div className="text-navy-100 text-xs mt-0.5">不動産シミュレーター</div>
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
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-navy-100 hover:bg-navy-600 hover:text-white'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
});
