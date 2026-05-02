'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration(): null {
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
        const registration = await navigator.serviceWorker.register('/sw.js');

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version installed; activate immediately.
              newWorker.postMessage({ type: 'SKIP_WAITING' });
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

  return null;
}
