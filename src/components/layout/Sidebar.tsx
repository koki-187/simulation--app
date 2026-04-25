'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',              label: 'ダッシュボード',    icon: '📊' },
  { href: '/input',         label: '入力フォーム',      icon: '📝' },
  { href: '/amortization',  label: '返済スケジュール',   icon: '📅' },
  { href: '/cashflow',      label: 'キャッシュフロー',   icon: '💰' },
  { href: '/sale',          label: '売却シミュレーション', icon: '🏷️' },
  { href: '/tax',           label: '税金詳細',          icon: '🧾' },
  { href: '/banks',         label: 'ローン比較',         icon: '🏦' },
  { href: '/compare',       label: 'A/B比較',           icon: '⚖️' },
  { href: '/ratios',        label: '年収倍率・返済比率', icon: '📈' },
  { href: '/loan-compare',  label: '金融機関比較',       icon: '🏦' },
  { href: '/funding-plan',  label: '資金計画書',         icon: '📋' },
  { href: '/bank-db',       label: '金融機関DB',         icon: '🗄️' },
  { href: '/home-loan',    label: '住宅ローン137選',    icon: '🏡' },
  { href: '/prepayment',   label: '繰上げ返済',          icon: '⏩' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 h-screen sticky top-0 bg-navy-500 flex flex-col shrink-0 overflow-hidden">
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
            <div className="text-navy-100 text-xs mt-0.5">不動産投資シミュレーター</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              pathname === item.href
                ? 'bg-orange-500 text-white font-semibold'
                : 'text-navy-100 hover:bg-navy-600 hover:text-white'
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-navy-600 text-xs text-navy-100">
        <div>v3.0 — Multi OS</div>
        <div className="mt-0.5 text-navy-200">© 2026 TERASS Inc.</div>
      </div>
    </aside>
  );
}
