"use client";

import { cn } from "@/lib/cn";

export type ColorOption = { value: string; label: string; hex: string; available: boolean };

/**
 * Pastille ronde de 24 px, anneau de 2 px quand sélectionnée.
 * La couleur vient des données produit (AttributeValue.hex), pas de l'interface :
 * elle est donc passée en style en ligne, jamais en classe.
 */
export function ColorSwatches({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: ColorOption[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">
        {legend}
        {current && <span className="ml-2 font-normal text-ink-muted">{current.label}</span>}
      </legend>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              title={opt.label}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full",
                "has-focus-visible:outline-2 has-focus-visible:outline-focus",
                opt.available ? "cursor-pointer" : "cursor-not-allowed opacity-40",
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
              <span className="sr-only">
                {opt.label}
                {!opt.available && " (épuisé)"}
              </span>
              <span
                aria-hidden
                style={{ backgroundColor: opt.hex }}
                className={cn(
                  "size-6 rounded-full border border-line",
                  selected && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
                )}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
