"use client";

import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const overlay = "fixed inset-0 z-40 bg-scrim/40 data-[state=open]:animate-fade-in";

function CloseButton() {
  return (
    <RadixDialog.Close
      className="inline-flex size-11 items-center justify-center rounded-sm text-ink hover:bg-surface-alt"
      aria-label="Fermer"
    >
      <X aria-hidden size={20} strokeWidth={1.5} />
    </RadixDialog.Close>
  );
}

type Props = {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Tiroir : côté d'ouverture. */
  side?: "right" | "left";
  /** Modale large (éditeurs avec aperçu d'image). */
  wide?: boolean;
};

/** Modale centrée, rayon 4 px, bordure fine, sans ombre côté boutique. */
export function Modal({ trigger, title, description, children, footer, open, onOpenChange, wide = false }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-dvh w-full -translate-x-1/2 -translate-y-1/2 flex-col",
            wide ? "max-w-4xl" : "max-w-lg",
            "rounded border border-line bg-surface data-[state=open]:animate-modal-in",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line py-2 pr-2 pl-6">
            <div className="flex flex-col gap-1 py-2">
              <RadixDialog.Title className="text-lg font-semibold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-sm text-ink-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <CloseButton />
          </header>
          <div className="overflow-y-auto p-6">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Tiroir latéral (panier à droite, menu mobile à gauche). */
export function Drawer({ trigger, title, description, children, footer, open, onOpenChange, side = "right" }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content
          className={cn(
            "fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-surface",
            side === "right"
              ? "right-0 border-l border-line data-[state=open]:animate-drawer-in"
              : "left-0 border-r border-line data-[state=open]:animate-drawer-in-left",
          )}
        >
          <header className="flex items-center justify-between border-b border-line py-2 pr-2 pl-6">
            <RadixDialog.Title className="text-lg font-semibold">{title}</RadixDialog.Title>
            <CloseButton />
          </header>
          {description && (
            <RadixDialog.Description className="sr-only">{description}</RadixDialog.Description>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <footer className="border-t border-line p-6">{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
