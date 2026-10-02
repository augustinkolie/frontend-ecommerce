"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

/** Suit la classe .dark de <html> (posée par le script du <head> ou par ce bouton). */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");

/** Bouton mode clair / sombre ; le choix est mémorisé et s'applique à tout le site. */
export function ThemeToggle({ className, iconSize = 20 }: { className?: string; iconSize?: number }) {
  // Côté serveur : clair par défaut ; l'état réel est lu dès l'hydratation.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <button
      type="button"
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-pressed={dark}
      className={cn("inline-flex items-center justify-center", className)}
    >
      {dark ? <Sun aria-hidden size={iconSize} strokeWidth={1.5} /> : <Moon aria-hidden size={iconSize} strokeWidth={1.5} />}
    </button>
  );
}
