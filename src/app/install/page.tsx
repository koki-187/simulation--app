'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';

type OS = 'ios' | 'android' | 'windows' | 'mac';

interface Tab {
  id: OS;
  label: string;
}

const TABS: Tab[] = [
  { id: 'ios',     label: '📱 iPhone / iPad' },
  { id: 'android', label: '🤖 Android' },
  { id: 'windows', label: '🪟 Windows' },
  { id: 'mac',     label: '🍎 Mac' },
];

interface Step {
  text: string;
  note?: string;
}

const STEPS: Record<OS, Step[]> = {
  ios: [
    { text: 'Safari で MAS のURL を開く' },
    { text: '画面下部の共有ボタン（□↑）をタップ' },
    { text: '「ホーム画面に追加」をタップ' },
    { text: '名前を確認して「追加」をタップ' },
    { text: 'ホーム画面に MAS アイコンが追加されます' },
  ],
  android: [
    { text: 'Chrome で MAS の URL を開く' },
    { text: '右上のメニュー（⋮）をタップ' },
    { text: '「ホーム画面に追加」または「アプリをインストール」をタップ' },
    { text: '「インストール」をタップ' },
    { text: 'ホーム画面またはアプリドロワーに MAS が追加されます' },
  ],
  windows: [
    { text: 'Chrome で MAS の URL を開く' },
    { text: 'アドレスバー右端のインストールアイコン（⊕）をクリック' },
    { text: '「インストール」をクリック' },
    { text: 'デスクトップとスタートメニューに MAS が追加されます', note: 'Edge でも URL バー右端の「+」アイコンから同様にインストール可能' },
  ],
  mac: [
    { text: 'Chrome で MAS の URL を開く' },
    { text: 'アドレスバー右端のインストールアイコン（⊕）をクリック' },
    { text: '「インストール」をクリック' },
    { text: 'Launchpad と Dock に MAS が追加されます' },
    { text: 'Safari (macOS 14 Sonoma以降): Safariを開き、メニューバーの「ファイル」→「Dockに追加」をクリック', note: 'macOS 14 Sonoma以降のSafariで利用可能' },
    { text: '「Dockに追加」ダイアログで名前を確認し「追加」をクリック。LaunchpadにMASが表示されます' },
  ],
};

const OS_SUBTITLE: Record<OS, string> = {
  ios:     'iOS Safari',
  android: 'Chrome',
  windows: 'Chrome / Edge',
  mac:     'Chrome / Safari (macOS 14+)',
};

const BENEFITS = [
  'オフラインでも利用可能',
  'ホーム画面から1タップで起動',
  'ブラウザのUIなしでアプリのように動作',
  'プッシュ通知に対応（将来対応予定）',
  '常に最新バージョンが自動更新',
];

export default function InstallPage() {
  const [activeTab, setActiveTab] = useState<OS>('ios');
  const steps = STEPS[activeTab];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1C2B4A] flex items-center gap-2">
            <span>📲</span>
            <span>MAS をインストール</span>
          </h1>
          <p className="mt-2 text-[#4A5B7A] text-sm leading-relaxed">
            アプリとして使うとオフラインでも利用でき、ホーム画面から素早くアクセスできます
          </p>
        </div>

        {/* OS Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                activeTab === tab.id
                  ? 'bg-[#1C2B4A] text-white border-[#1C2B4A]'
                  : 'bg-white text-[#4A5B7A] border-[#CBD5E1] hover:border-[#1C2B4A] hover:text-[#1C2B4A]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Steps Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
          <div className="bg-[#1C2B4A] px-5 py-3">
            <p className="text-white font-semibold text-sm">
              {TABS.find((t) => t.id === activeTab)?.label} — {OS_SUBTITLE[activeTab]}
            </p>
          </div>
          <ol className="divide-y divide-[#F1F5F9]">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4 px-5 py-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1C2B4A] text-sm leading-relaxed">{step.text}</p>
                  {step.note && (
                    <p className="mt-1 text-[#64748B] text-xs leading-relaxed">
                      ※ {step.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Benefits */}
        <div className="bg-[#F0F4FA] rounded-xl border border-[#D1DBF0] px-5 py-5">
          <h2 className="text-[#1C2B4A] font-bold text-sm mb-3">インストールするメリット</h2>
          <ul className="space-y-2">
            {BENEFITS.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
                <span className="text-green-500 font-bold shrink-0">✅</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
