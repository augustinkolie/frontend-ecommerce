import "server-only";
import { cache } from "react";
import { apiFetch } from "./api/client";
import type { CategoryNode, PublicSettings } from "./api/types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Paramètres publics (nom, devise, zones, paiements), mis en cache et revalidés par tag. */
export const getSettings = cache(() => apiFetch<PublicSettings>("/settings", { tags: ["settings"], revalidate: 3600 }));

export const getCategories = cache(() => apiFetch<CategoryNode[]>("/categories", { tags: ["catalog", "categories"], revalidate: 3600 }));

export function findCategory(roots: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const n of roots) {
    if (n.slug === slug) return n;
    const found = findCategory(n.children, slug);
    if (found) return found;
  }
  return undefined;
}

export const categoryHref = (c: { path: string[] }) => `/c/${c.path.join("/")}`;
