"use client";

import { cn } from "@/lib/cn";

export type SizeOption = { value: string; label: string; available: boolean };

/**
 * Cases carrées de 44 px, bordure fine.
 * Taille épuisée : barrée en diagonale, non cliquable.
 */
export function SizeSelector({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: SizeOption[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">
        {legend}
        {value && <span className="ml-2 font-normal text-ink-muted">{value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              className={cn(
                "relative inline-flex h-11 min-w-11 items-center justify-center overflow-hidden rounded-sm border px-2 text-sm tabular-nums",
                "transition-colors duration-150 ease-out has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                selected
                  ? "cursor-pointer border-ink bg-ink text-on-ink"
                  : opt.available
                    ? "cursor-pointer border-line bg-surface hover:border-ink"
                    : "cursor-not-allowed border-line bg-surface-alt text-ink-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                disabled={!opt.available}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
              {!opt.available && (
                <>
                  <span className="sr-only"> (épuisé)</span>
                  <svg
                    aria-hidden
                    className="absolute inset-0 size-full text-ink-muted"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </svg>
                </>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
