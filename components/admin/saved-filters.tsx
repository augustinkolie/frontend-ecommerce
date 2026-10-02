"use client";

import { useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
import { storage } from "@/lib/admin/hooks";

type Saved = { name: string; value: Record<string, string> };

/** Filtres enregistrables d'une liste (mémorisés sur ce poste). */
export function SavedFilters({ id, current, onApply }: { id: string; current: Record<string, string>; onApply: (v: Record<string, string>) => void }) {
  const key = `filters:${id}`;
  const [saved, setSaved] = useState<Saved[]>([]);
  useEffect(() => {
    // Lecture du stockage local au montage : synchronisation avec un système externe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(storage.get<Saved[]>(key, []));
  }, [key]);
  const persist = (next: Saved[]) => {
    setSaved(next);
    storage.set(key, next);
  };
  const hasFilters = Object.values(current).some(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {saved.map((s) => (
        <span key={s.name} className="inline-flex h-9 items-center rounded-sm border border-line bg-surface">
          <button type="button" className="h-full px-2 text-sm hover:bg-surface-alt" onClick={() => onApply(s.value)}>{s.name}</button>
          <button type="button" aria-label={`Supprimer le filtre ${s.name}`} className="inline-flex h-full w-7 items-center justify-center text-ink-muted hover:text-ink" onClick={() => persist(saved.filter((x) => x.name !== s.name))}>
            <X aria-hidden size={12} strokeWidth={1.5} />
          </button>
        </span>
      ))}
      {hasFilters && (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-sm px-2 text-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
          onClick={() => {
            const name = prompt("Nom du filtre enregistré");
            if (name) persist([...saved.filter((x) => x.name !== name), { name, value: current }]);
          }}
        >
          <Bookmark aria-hidden size={16} strokeWidth={1.5} />
          Enregistrer le filtre
        </button>
      )}
    </div>
  );
}
