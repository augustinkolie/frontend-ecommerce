"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-16 md:px-8">
      <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Erreur</p>
      <h1 className="font-serif text-4xl font-normal tracking-title">Un problème est survenu</h1>
      <p className="max-w-prose text-lg text-ink-muted">La page n&apos;a pas pu être chargée. Réessayez dans un instant.</p>
      <div className="flex items-center gap-6 pt-2">
        <Button variant="secondary" onClick={reset}>Réessayer</Button>
        <Link href="/" className="text-base font-medium underline underline-offset-4">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
