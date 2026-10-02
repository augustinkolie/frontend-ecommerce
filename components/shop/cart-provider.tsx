"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api/browser";
import type { Cart } from "@/lib/api/types";

type CartContext = {
  cart: Cart | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  setCart: (cart: Cart) => void;
};

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await api<Cart>("/cart"));
    } catch {
      /* panier indisponible : on garde l'état précédent */
    }
  }, []);

  // Chargement initial du panier : l'état est mis à jour dans le callback de la requête.
  useEffect(() => {
    api<Cart>("/cart").then(setCart).catch(() => {});
  }, []);

  const run = useCallback(async (fn: () => Promise<Cart>) => {
    setPending(true);
    setError(null);
    try {
      setCart(await fn());
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const value = useMemo<CartContext>(
    () => ({
      cart,
      open,
      setOpen,
      pending,
      error,
      refresh,
      setCart,
      add: async (variantId, quantity = 1) => {
        const ok = await run(() => api<Cart>("/cart/items", { method: "POST", json: { variantId, quantity } }));
        if (ok) setOpen(true);
        return ok;
      },
      update: async (itemId, quantity) => {
        await run(() => api<Cart>(`/cart/items/${itemId}`, { method: "PATCH", json: { quantity } }));
      },
      remove: async (itemId) => {
        await run(() => api<Cart>(`/cart/items/${itemId}`, { method: "DELETE" }));
      },
      applyCoupon: async (code) => {
        setPending(true);
        try {
          setCart(await api<Cart>("/cart/coupon", { method: "POST", json: { code } }));
          return null;
        } catch (err) {
          return errorMessage(err);
        } finally {
          setPending(false);
        }
      },
      removeCoupon: async () => {
        await run(() => api<Cart>("/cart/coupon", { method: "DELETE" }));
      },
    }),
    [cart, open, pending, error, refresh, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Panier, ou null hors boutique (guide de style). */
export function useOptionalCart() {
  return useContext(Ctx);
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart hors de CartProvider");
  return ctx;
}
