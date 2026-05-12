import { clsx } from 'clsx';
import { memo, ReactNode, useState } from 'react';

interface StatBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
  warn?: boolean;
  icon?: ReactNode;
  large?: boolean;
  tooltip?: string;
}

export const StatBox = memo(function StatBox({ label, value, unit, sub, positive, negative, warn, icon, large, tooltip }: StatBoxProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative overflow-visible bg-white rounded-xl border border-neutral-100 shadow-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
        {icon}
        {label}
        {tooltip && (
          <button
            type="button"
            onClick={() => setShowTooltip(v => !v)}
            onBlur={() => setShowTooltip(false)}
            className="ml-1 text-neutral-300 hover:text-neutral-500 transition-colors text-[10px] leading-none rounded-full border border-neutral-200 w-4 h-4 flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
            aria-label={`${label}の説明`}
          >?</button>
        )}
      </div>
      <div className={clsx(
        'font-bold leading-tight',
        large ? 'text-2xl' : 'text-xl',
        positive && 'text-success-500',
        negative && 'text-danger-500',
        warn && 'text-warn-500',
        !positive && !negative && !warn && 'text-navy-500'
      )}>
        {typeof value === 'number' ? value.toLocaleString('ja-JP') : value}
        {unit && <span className="text-sm font-normal text-neutral-400 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-neutral-400">{sub}</div>}
      {showTooltip && tooltip && (
        <div className="mt-1 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-2 leading-relaxed shadow-sm">
          {tooltip}
        </div>
      )}
    </div>
  );
});
