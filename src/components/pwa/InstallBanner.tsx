'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'mas-install-dismissed-until';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // standaloneモードで動作中なら非表示
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // 30日クールダウン中なら非表示
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

    // iOS判定（iPadOS 13+ のフォールバック検出含む）
    const ua = navigator.userAgent;
    const isIpadOS =
      typeof navigator !== 'undefined' &&
      /MacIntel/.test(navigator.platform) &&
      navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/i.test(ua) || isIpadOS;
    setIsIOS(ios);

    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    if (ios) {
      // iOSはSafari上でのみ表示（Chromeなどは除外）
      const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
      if (isSafari) {
        setVisible(true);
      }
      return () => window.removeEventListener('appinstalled', onInstalled);
    } else {
      // Android / PC: beforeinstallpromptを待つ
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // 30日後まで非表示
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C2B4A] border-t border-[#2D4070] shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              MAS をアプリとしてインストール
            </p>
            {isIOS ? (
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
            {!isIOS && (
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
