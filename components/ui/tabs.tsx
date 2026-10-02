"use client";

import type { ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

/** Onglets soulignés (fiche produit : description, entretien, avis). */
export function Tabs({
  items,
  defaultValue,
}: {
  items: { value: string; label: string; content: ReactNode }[];
  defaultValue?: string;
}) {
  return (
    <RadixTabs.Root defaultValue={defaultValue ?? items[0]?.value}>
      <RadixTabs.List className="flex gap-6 border-b border-line">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="-mb-px h-11 border-b-2 border-transparent text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-6 text-base">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
