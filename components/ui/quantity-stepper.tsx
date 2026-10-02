"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantité",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const btn =
    "inline-flex size-11 items-center justify-center text-ink hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center self-start rounded-sm border border-line bg-surface">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuer">
        <Minus aria-hidden size={20} strokeWidth={1.5} />
      </button>
      <output aria-live="polite" className="w-10 text-center text-sm tabular-nums">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Augmenter">
        <Plus aria-hidden size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}
