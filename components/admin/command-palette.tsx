"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { useApi, useDebounced } from "@/lib/admin/hooks";
import { cn } from "@/lib/cn";
import { ADMIN_NAV } from "./nav";

type Results = {
  orders: { id: string; number: number; email: string; status: string }[];
  products: { id: string; name: string; status: string }[];
  customers: { id: string; name: string | null; email: string }[];
};

/** Palette Ctrl/Cmd + K : aller à une commande, un produit, un client ou une page. */
export function CommandPalette({ permissions, open, onOpenChange }: { permissions: string[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const term = useDebounced(q.trim(), 200);
  const { data } = useApi<Results>(term ? `/admin/search?q=${encodeURIComponent(term)}` : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const items = useMemo(() => {
    const pages = ADMIN_NAV.filter((n) => permissions.includes(n.permission) && n.label.toLowerCase().includes(q.trim().toLowerCase())).map((n) => ({
      group: "Pages",
      label: n.label,
      hint: "",
      href: n.href,
    }));
    return [
      ...(data?.orders ?? []).map((o) => ({ group: "Commandes", label: `Commande n° ${o.number}`, hint: o.email, href: `/admin/commandes/${o.id}` })),
      ...(data?.products ?? []).map((p) => ({ group: "Produits", label: p.name, hint: p.status, href: `/admin/produits/${p.id}` })),
      ...(data?.customers ?? []).map((c) => ({ group: "Clients", label: c.name ?? c.email, hint: c.email, href: `/admin/clients/${c.id}` })),
      ...pages,
    ];
  }, [data, permissions, q]);


  const go = (href: string) => {
    onOpenChange(false);
    setQ("");
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim/40" />
        <Dialog.Content className="fixed top-24 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded border border-line bg-surface text-ink">
          <Dialog.Title className="sr-only">Aller à…</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search aria-hidden size={20} strokeWidth={1.5} className="text-ink-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && items[active]) {
                  go(items[active].href);
                }
              }}
              placeholder="N° de commande, produit, SKU, client…"
              aria-label="Rechercher"
              aria-controls="palette-results"
              className="h-12 flex-1 bg-transparent text-sm focus-visible:outline-none"
            />
            <kbd className="rounded-sm border border-line px-1 text-xs text-ink-muted">Échap</kbd>
          </div>
          <ul id="palette-results" role="listbox" className="max-h-96 overflow-y-auto p-1" style={{ boxShadow: "none" }}>
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-muted">Aucun résultat</li>}
            {items.map((it, i) => (
              <li key={`${it.group}-${it.href}`} role="option" aria-selected={i === active}>
                {(i === 0 || items[i - 1]!.group !== it.group) && <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-caps text-ink-muted uppercase">{it.group}</p>}
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(it.href)}
                  className={cn("flex h-10 w-full items-center justify-between gap-4 rounded-sm px-3 text-left text-sm", i === active && "bg-surface-alt")}
                >
                  <span className="truncate">{it.label}</span>
                  <span className="truncate text-xs text-ink-muted">{it.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
