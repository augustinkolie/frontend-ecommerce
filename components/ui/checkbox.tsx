"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

export function Checkbox({
  id,
  label,
  count,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  /** Compteur de facette (filtres). */
  count?: number;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        disabled={disabled}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-ink bg-surface data-[state=checked]:bg-ink disabled:opacity-40"
      >
        <RadixCheckbox.Indicator>
          <Check aria-hidden size={16} strokeWidth={2} className="text-on-ink" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="flex flex-1 cursor-pointer justify-between gap-2 text-sm">
        <span>{label}</span>
        {count !== undefined && <span className="text-ink-muted tabular-nums">{count}</span>}
      </label>
    </div>
  );
}
