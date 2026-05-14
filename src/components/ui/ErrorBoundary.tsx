'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; retryCount: number; errorId?: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err-${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MAS] ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { retryCount, error, errorId } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-navy-500">表示中にエラーが発生しました</h2>
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            {process.env.NODE_ENV === 'development'
              ? (error?.message ?? '不明なエラー')
              : '予期しないエラーが発生しました。ページを再読み込みしてください。'}
          </p>
          {errorId && (
            <p className="text-xs text-neutral-400">エラーID: {errorId}</p>
          )}
          {retryCount >= 3 ? (
            <>
              <p className="text-xs text-neutral-400">繰り返しエラーが発生しています</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">
                ページを再読み込み
              </button>
            </>
          ) : (
            <button
              onClick={() => this.setState(s => ({ hasError: false, error: undefined, retryCount: s.retryCount + 1 }))}
              className="btn-primary text-sm"
            >
              再試行
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
