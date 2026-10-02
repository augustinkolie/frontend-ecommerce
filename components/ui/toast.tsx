"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Notification éphémère : bandeau encre en bas d'écran, texte blanc,
 * une action facultative. Entrée en opacité + translation, 200 ms.
 */
export function Toast({
  open,
  onClose,
  message,
  action,
  duration = 4000,
  inline = false,
}: {
  open: boolean;
  onClose: () => void;
  message: ReactNode;
  action?: ReactNode;
  duration?: number;
  /** Affichage statique (styleguide), sans position fixe ni fermeture auto. */
  inline?: boolean;
}) {
  useEffect(() => {
    if (!open || inline) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [open, inline, duration, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-4 rounded-sm bg-ink py-1 pr-1 pl-4 text-sm text-on-ink",
        inline ? "w-full max-w-md" : "fixed inset-x-4 bottom-4 z-50 animate-modal-in md:right-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2",
      )}
    >
      <p className="flex-1 py-2">{message}</p>
      {action}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm hover:bg-ink-hover"
      >
        <X aria-hidden size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}
