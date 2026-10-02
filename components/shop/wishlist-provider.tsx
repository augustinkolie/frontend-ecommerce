"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api/browser";
import { ApiRequestError } from "@/lib/api/errors";
import type { ProductCard } from "@/lib/api/types";

type WishlistContext = {
  has: (productId: string) => boolean;
  /** Ajoute ou retire ; visiteur non connecté : renvoyé vers la connexion. */
  toggle: (productId: string) => Promise<void>;
  pendingId: string | null;
};

const Ctx = createContext<WishlistContext | null>(null);

/** Favoris du client connecté, partagés par toutes les cartes produit (un seul appel au chargement). */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Chargement initial : l'état est mis à jour dans le callback de la requête (visiteur : 401 ignoré).
  useEffect(() => {
    api<ProductCard[]>("/me/wishlist")
      .then((items) => setIds(new Set(items.map((p) => p.id))))
      .catch(() => {});
  }, []);

  const toggle = useCallback(
    async (productId: string) => {
      const wished = ids.has(productId);
      setPendingId(productId);
      // Mise à jour optimiste, annulée en cas d'échec.
      setIds((s) => {
        const n = new Set(s);
        if (wished) n.delete(productId);
        else n.add(productId);
        return n;
      });
      try {
        if (wished) await api(`/me/wishlist/${productId}`, { method: "DELETE" });
        else await api("/me/wishlist", { method: "POST", json: { productId } });
        router.refresh();
      } catch (err) {
        setIds((s) => {
          const n = new Set(s);
          if (wished) n.add(productId);
          else n.delete(productId);
          return n;
        });
        if (err instanceof ApiRequestError && err.status === 401) router.push(`/connexion?next=${encodeURIComponent(pathname)}`);
      } finally {
        setPendingId(null);
      }
    },
    [ids, router, pathname],
  );

  const value = useMemo(() => ({ has: (id: string) => ids.has(id), toggle, pendingId }), [ids, toggle, pendingId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Favoris, ou null hors boutique (guide de style). */
export function useWishlist() {
  return useContext(Ctx);
}
