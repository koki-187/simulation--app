import { clsx } from 'clsx';
import { ReactNode } from 'react';

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
}

export function StatBox({ label, value, unit, sub, positive, negative, warn, icon, large }: StatBoxProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
        {icon}
        {label}
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
    </div>
  );
}
