'use client';
import { useSimStore } from '@/store/simulatorStore';
import { clsx } from 'clsx';

export function PatternToggle() {
  const { activePattern, setActivePattern } = useSimStore();
  const opts = [
    { v: 'A' as const,       label: 'Pattern A' },
    { v: 'B' as const,       label: 'Pattern B' },
    { v: 'compare' as const, label: 'A/B比較' },
  ];
  return (
    <div className="flex gap-1 bg-navy-50 rounded-lg p-1">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => setActivePattern(o.v)}
          className={clsx(
            'px-3 py-1.5 rounded text-sm font-medium transition-colors',
            activePattern === o.v
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
