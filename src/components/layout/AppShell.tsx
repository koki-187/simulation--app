'use client';
import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '@/components/ui';
import { BatchPrintModal } from '@/components/BatchPrintModal';
import { InstallBanner } from '@/components/pwa/InstallBanner';

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onBatchPrint={() => setBatchPrintOpen(true)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto md:ml-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-navy-500 text-white px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-navy-600 transition-colors"
            aria-label="メニューを開く"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mas-logo-horizontal.png"
            alt="TERASS"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const fallback = el.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <span className="hidden font-bold text-sm">TERASS 不動産投資シミュレーター</span>
        </div>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <BatchPrintModal
        open={batchPrintOpen}
        onClose={() => setBatchPrintOpen(false)}
      />
      <InstallBanner />
    </div>
  );
}
