'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RELOAD_PAGE') {
        window.location.reload();
      }
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.addEventListener('message', onMessage);

    void register();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <>
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-navy-500 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <span>🔄 アプリが更新されました</span>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            今すぐ更新
          </button>
        </div>
      )}
    </>
  );
}
