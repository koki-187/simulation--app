import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Card({ children, className, noPad }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-card border border-neutral-100', !noPad && 'p-4', className)}>
      {children}
    </div>
  );
}

interface SectionProps { title: string; children: ReactNode; color?: 'orange' | 'navy'; }
export function Section({ title, children, color = 'orange' }: SectionProps) {
  return (
    <div className="mb-4">
      <div className={clsx('px-4 py-2 rounded-t-lg font-bold text-sm text-white mb-0', color === 'orange' ? 'bg-orange-500' : 'bg-navy-500')}>
        {title}
      </div>
      <div className="border border-t-0 border-neutral-200 rounded-b-lg p-4 bg-white">
        {children}
      </div>
    </div>
  );
}
