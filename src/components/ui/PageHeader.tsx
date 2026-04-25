import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  pattern?: 'A' | 'B';
}

export function PageHeader({ title, subtitle, actions, pattern }: PageHeaderProps) {
  return (
    <div className="bg-navy-500 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {pattern && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${pattern === 'A' ? 'bg-orange-500' : 'bg-orange-300 text-navy-500'}`}>
            Pattern {pattern}
          </span>
        )}
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-navy-100 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
