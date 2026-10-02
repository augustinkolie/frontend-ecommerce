"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/errors";

export function PageHeader({ title, description, back, actions }: { title: string; description?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {back && <Link href={back.href} className="text-xs text-ink-muted hover:underline">← {back.label}</Link>}
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-line bg-surface ${className ?? ""}`}>
      {(title || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-4 border-b border-line px-4">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded border border-line bg-surface p-3" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const forbidden = error instanceof ApiRequestError && error.status === 403;
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded border border-line bg-surface p-6">
      <CircleAlert aria-hidden size={20} strokeWidth={1.5} className="text-danger" />
      <p className="font-semibold">{forbidden ? "Accès refusé" : "Chargement impossible"}</p>
      <p className="text-ink-muted">
        {forbidden ? "Votre rôle ne donne pas accès à ce module." : error instanceof ApiRequestError ? error.error.message : "Vérifiez votre connexion et réessayez."}
      </p>
      {retry && !forbidden && <Button size="admin" variant="secondary" onClick={retry}>Réessayer</Button>}
    </div>
  );
}

export function EmptyBlock({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded border border-line bg-surface p-8">
      <p className="font-semibold">{title}</p>
      {description && <p className="text-ink-muted">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/** Chargement / erreur / contenu, pour chaque écran. */
export function QueryState<T>({ query, children, skeleton }: { query: { data?: T; error: unknown; isLoading: boolean; refetch: () => unknown }; children: (data: T) => ReactNode; skeleton?: ReactNode }) {
  if (query.isLoading) return <>{skeleton ?? <TableSkeleton />}</>;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (query.data === undefined) return null;
  return <>{children(query.data)}</>;
}
