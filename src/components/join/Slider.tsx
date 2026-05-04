'use client';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
  note?: string;
}

export default function Slider({ label, min, max, value, onChange, formatValue, note }: SliderProps) {
  const fillPct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          {label}
        </label>
        <span className="font-cormorant font-semibold text-2xl text-primary">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="join-slider w-full"
        style={{ '--fill-pct': `${fillPct}%` } as React.CSSProperties}
      />

      {note && (
        <p className="text-xs text-primary/40 italic">{note}</p>
      )}
    </div>
  );
}
