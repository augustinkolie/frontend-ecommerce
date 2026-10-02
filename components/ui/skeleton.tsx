import { cn } from "@/lib/cn";

/** Squelette de chargement : couleur unie, dimensions exactes fournies par l'appelant. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-line", className)} />;
}
