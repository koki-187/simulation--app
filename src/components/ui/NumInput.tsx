'use client';
interface NumInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  note?: string;
  fmt?: 'currency' | 'percent' | 'number' | 'years';
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
}

const FMT: Record<string, (v: number) => string> = {
  currency: (v) => '¥' + v.toLocaleString('ja-JP'),
  percent: (v) => (v * 100).toFixed(2) + '%',
  number: (v) => v.toLocaleString('ja-JP'),
  years: (v) => v + '年',
};

export function NumInput({ label, value, onChange, unit, note, fmt = 'number', min, max, step = 1, readOnly }: NumInputProps) {
  const displayValue = fmt === 'percent' ? value * 100 : value;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value.replace(/,/g, '')) || 0;
    onChange(fmt === 'percent' ? raw / 100 : raw);
  };
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="label-cell flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {readOnly ? (
          <span className="text-right font-mono text-sm text-navy-500 font-semibold min-w-[120px]">
            {FMT[fmt](value)}
          </span>
        ) : (
          <input
            type="number"
            value={displayValue}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            className="input-cell w-32 text-right"
          />
        )}
        {unit && <span className="text-xs text-neutral-400 w-8">{unit}</span>}
      </div>
      {note && <span className="text-xs text-neutral-400 ml-1 italic">{note}</span>}
    </div>
  );
}
