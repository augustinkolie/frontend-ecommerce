/**
 * Pagination numérotée : tailles proposées, numéros affichés, lecture de `?page=` / `?par=`.
 * Sans directive client : utilisable dans les pages serveur comme dans les composants.
 */

/** Grille boutique (multiples des 4 colonnes) et tableaux admin. La 3e valeur est la taille par défaut. */
export const SHOP_PAGE_SIZES = [8, 12, 24, 48] as const;
export const ADMIN_PAGE_SIZES = [5, 10, 25, 50, 100] as const;
/** Listes de « Mon compte » (commandes, retours). */
export const ACCOUNT_PAGE_SIZES = [5, 10, 20, 50] as const;

export const defaultPageSize = (sizes: readonly number[]) => sizes[Math.min(2, sizes.length - 1)]!;

/** Numéros affichés : 1 … 4 5 6 … 20 (au plus 7 entrées). */
export function pageItems(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  return [
    1,
    ...(start > 2 ? (["…"] as const) : []),
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ...(end < pageCount - 1 ? (["…"] as const) : []),
    pageCount,
  ];
}

/** Lit `?page=` et `?par=` en bornant les valeurs. */
export function readPageParams(sp: Record<string, string | string[] | undefined>, sizes: readonly number[]) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const par = Number(one(sp.par));
  const page = Number(one(sp.page));
  return {
    pageSize: sizes.includes(par) ? par : defaultPageSize(sizes),
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, 10000) : 1,
  };
}

/** Découpe locale d'une liste déjà chargée (listes courtes de l'admin et du compte). */
export function slicePage<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount, total: items.length };
}
