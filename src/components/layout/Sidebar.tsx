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
  { href: '/banks',         label: '金融機関比較',       icon: '🏦' },
  { href: '/compare',       label: 'A/B比較',           icon: '⚖️' },
  { href: '/ratios',        label: '年収倍率・返済比率', icon: '📈' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-navy-500 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-600">
        <div className="text-orange-500 font-bold text-lg leading-tight">TERASS</div>
        <div className="text-navy-100 text-xs mt-0.5">不動産投資シミュレーター</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
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
