import Link from "next/link";

/** 404 hors boutique (admin, styleguide). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
      <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Erreur 404</p>
      <h1 className="font-serif text-4xl font-normal tracking-title">Cette page n&apos;existe pas</h1>
      <Link href="/" className="text-base font-medium underline underline-offset-4">Retour à l&apos;accueil</Link>
    </main>
  );
}
