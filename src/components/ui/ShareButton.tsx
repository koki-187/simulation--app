'use client';
import { useState, useEffect, useRef } from 'react';
import { useSimStore } from '@/store/simulatorStore';
import { useShallow } from 'zustand/react/shallow';
import { encodeShareUrl, decodeShareUrl } from '@/lib/shareUrl';

export function ShareButton({ pattern }: { pattern?: 'A' | 'B' | 'both' }) {
  const { inputA, inputB, setInputA, setInputB } = useSimStore(
    useShallow(s => ({ inputA: s.inputA, inputB: s.inputB, setInputA: s.setInputA, setInputB: s.setInputB }))
  );
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // On mount: check for ?share= param and restore state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (!shareParam) return;
    const payload = decodeShareUrl(shareParam);
    if (!payload) return;
    if (payload.a) setInputA(payload.a);
    if (payload.b) setInputB(payload.b);
    // Remove the share param from URL without reload
    params.delete('share');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [setInputA, setInputB]);

  async function handleShare() {
    const url = encodeShareUrl(
      inputA,
      pattern === 'both' || pattern === 'B' ? inputB : undefined
    );
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('以下のURLをコピーしてください:', url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition-colors"
      title="このシミュレーションのURLをコピーして共有"
    >
      {copied ? (
        <><span>✅</span><span>コピー完了</span></>
      ) : (
        <><span>🔗</span><span>URLを共有</span></>
      )}
    </button>
  );
}
