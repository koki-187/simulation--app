'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'mas-install-dismissed-until';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Lazy initializer: compute iOS visibility once from browser APIs at mount.
  // 'ios' = show iOS instructions; 'android' = show install button (set by event); null = hidden.
  const [installKind, setInstallKind] = useState<'ios' | 'android' | null>(() => {
    if (typeof window === 'undefined') return null;
    // standaloneモードで動作中なら非表示
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return null;
    // 30日クールダウン中なら非表示
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return null;
    // iOS判定（iPadOS 13+ のフォールバック検出含む）
    const ua = navigator.userAgent;
    const isIpadOS = /MacIntel/.test(navigator.platform) && navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/i.test(ua) || isIpadOS;
    if (ios) {
      // iOSはSafari上でのみ表示（Chromeなどは除外）
      const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
      return isSafari ? 'ios' : null;
    }
    return null; // Android/PC: set by beforeinstallprompt event below
  });

  useEffect(() => {
    // イベントリスナーのみ登録（setState は全てコールバック内で呼ぶ）
    const onInstalled = () => setInstallKind(null);
    window.addEventListener('appinstalled', onInstalled);

    // Android / PC: beforeinstallpromptを待つ
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallKind('android');
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallKind(null);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // 30日後まで非表示
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setInstallKind(null);
  };

  if (!installKind) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C2B4A] border-t border-[#2D4070] shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              MAS をアプリとしてインストール
            </p>
            {installKind === 'ios' ? (
              <p className="text-[#93A8CC] text-xs mt-1 leading-relaxed">
                Safari の共有ボタン（□↑）→「ホーム画面に追加」をタップしてください
              </p>
            ) : (
              <p className="text-[#93A8CC] text-xs mt-1">
                オフラインでもご利用いただけます
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {installKind === 'android' && (
              <button
                onClick={handleInstall}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                インストール
              </button>
            )}
            <button
              onClick={handleDismiss}
              aria-label="閉じる"
              className="text-[#93A8CC] hover:text-white text-lg leading-none p-1 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
