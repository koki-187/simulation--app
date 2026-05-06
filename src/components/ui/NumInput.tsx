'use client';
import { useRef, useState } from 'react';

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
  const [localValue, setLocalValue] = useState<string>('');
  const [focused, setFocused] = useState(false);
  // 空欄ブラー時に前の有効値へ戻すためのRef
  const prevValueRef = useRef<number>(value);

  const inputMode = step < 1 ? 'decimal' : 'numeric';

  const handleFocus = () => {
    prevValueRef.current = value;
    setLocalValue(String(displayValue));
    setFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const trimmed = localValue.replace(/,/g, '').trim();
    // 空欄 or 無効値 → 前の値を復元して onChange は呼ばない
    if (trimmed === '' || isNaN(Number(trimmed))) {
      onChange(prevValueRef.current);
      setFocused(false);
      return;
    }
    let raw = parseFloat(trimmed);
    if (min !== undefined) raw = Math.max(min, raw);
    if (max !== undefined) raw = Math.min(max, raw);
    onChange(fmt === 'percent' ? raw / 100 : raw);
    setFocused(false);
  };

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="label-cell flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {readOnly ? (
          <span
            aria-label={`${label}: ${FMT[fmt](value)}`}
            className="text-right font-mono text-sm text-navy-500 font-semibold min-w-[120px]"
          >
            {FMT[fmt](value)}
          </span>
        ) : (
          <input
            type="number"
            inputMode={inputMode}
            value={focused ? localValue : displayValue}
            onFocus={handleFocus}
            onChange={handleChange}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
            aria-label={label}
            className="input-cell w-32 text-right"
          />
        )}
        {unit && <span className="text-xs text-neutral-400 w-8">{unit}</span>}
      </div>
      {note && <span className="text-xs text-neutral-400 ml-1 italic">{note}</span>}
    </div>
  );
}
