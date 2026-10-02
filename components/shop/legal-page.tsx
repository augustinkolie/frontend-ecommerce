import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetchOrNull } from "@/lib/api/client";
import type { LegalPage } from "@/lib/api/types";
import { SITE_URL } from "@/lib/shop";
import { Prose } from "./prose";

const load = (slug: string) => apiFetchOrNull<LegalPage>(`/pages/${slug}`, { tags: [`page:${slug}`], revalidate: 86400 });

export async function legalMetadata(slug: string): Promise<Metadata> {
  const page = await load(slug);
  return page ? { title: page.title, alternates: { canonical: `${SITE_URL}/${slug}` } } : {};
}

/** Pages légales : contenu éditable dans l'admin, rendu statique revalidé par tag. */
export async function LegalPageView({ slug }: { slug: string }) {
  const page = await load(slug);
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <h1 className="font-serif text-4xl font-normal tracking-title md:text-5xl">{page.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">Mis à jour le {new Date(page.updatedAt).toLocaleDateString("fr-FR")}</p>
      <div className="mt-8">
        <Prose source={page.body} />
      </div>
    </article>
  );
}
