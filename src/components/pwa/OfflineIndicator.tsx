'use client';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize from current state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-warn-500 text-white text-xs font-semibold py-2 px-4 shadow-md"
    >
      <span>📵</span>
      <span>オフラインモード — データは保存済みです。計算はオフラインでも動作します。</span>
    </div>
  );
}
