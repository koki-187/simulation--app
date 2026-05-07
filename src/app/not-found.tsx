import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full card text-center space-y-5">
        <div className="text-6xl font-bold text-navy-200">404</div>
        <h1 className="text-xl font-bold text-neutral-900">ページが見つかりません</h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/" className="btn-primary w-full text-center">
            ホームへ戻る
          </Link>
          <Link href="/cashflow" className="btn-ghost w-full text-center">
            収支シミュレーションへ
          </Link>
        </div>
      </div>
    </div>
  );
}
