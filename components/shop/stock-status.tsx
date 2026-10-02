import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Disponibilité d'une variante, en texte seul sous le sélecteur de taille. */
export function StockStatus({ stock, lowThreshold = 3 }: { stock: number; lowThreshold?: number }) {
  const state =
    stock <= 0
      ? { icon: X, text: "Épuisé", cls: "text-danger" }
      : stock <= lowThreshold
        ? { icon: Clock, text: `Plus que ${stock} en stock`, cls: "text-warning" }
        : { icon: Check, text: "En stock, expédié sous 48 h", cls: "text-success" };
  const Icon = state.icon;

  return (
    <p className={cn("flex items-center gap-2 text-sm", state.cls)}>
      <Icon aria-hidden size={16} strokeWidth={1.5} />
      {state.text}
    </p>
  );
}
