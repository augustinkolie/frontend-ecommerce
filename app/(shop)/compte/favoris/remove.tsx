"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/browser";

export function RemoveFavorite({ productId }: { productId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="h-11 self-start text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      onClick={async () => {
        await api(`/me/wishlist/${productId}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Retirer des favoris
    </button>
  );
}
