'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring if integrated
    console.error('[MAS] Uncaught error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full card text-center space-y-5">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-neutral-900">エラーが発生しました</h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          予期しないエラーが発生しました。<br />
          データは保存されています。もう一度お試しください。
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 font-mono">
            エラーID: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="btn-primary w-full"
          >
            再試行する
          </button>
          <a
            href="/"
            className="btn-ghost w-full text-center"
          >
            ホームへ戻る
          </a>
        </div>
      </div>
    </div>
  );
}
