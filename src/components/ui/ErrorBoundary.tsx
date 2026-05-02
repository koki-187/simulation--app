'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-navy-500">表示中にエラーが発生しました</h2>
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            {process.env.NODE_ENV === 'development'
              ? (this.state.error?.message ?? '不明なエラー')
              : '予期しないエラーが発生しました。ページを再読み込みしてください。'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn-primary text-sm"
          >
            再試行
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
