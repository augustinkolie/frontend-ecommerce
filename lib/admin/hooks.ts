"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api/browser";
import type { Page } from "@/lib/api/types";
import { ADMIN_PAGE_SIZES, defaultPageSize, slicePage } from "@/lib/pagination";
import { useToast } from "@/components/admin/toast";

/** Lecture admin : la clé de cache est le chemin de l'API. */
export function useApi<T>(path: string | null, opts: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: [path],
    queryFn: () => api<T>(path!),
    enabled: !!path,
    refetchInterval: opts.refetchInterval,
  });
}

type MutateInput = { path: string; method?: "POST" | "PUT" | "PATCH" | "DELETE"; json?: unknown; body?: BodyInit; headers?: HeadersInit };

/** Écriture admin : invalide les préfixes donnés et affiche un retour. */
export function useApiMutation<T = unknown>(invalidate: string[] = [], success?: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ path, method = "POST", json, body, headers }: MutateInput) => api<T>(path, { method, json, body, headers }),
    onSuccess: () => {
      for (const prefix of invalidate) {
        void qc.invalidateQueries({ predicate: (q) => String((q.queryKey as QueryKey)[0] ?? "").startsWith(prefix) });
      }
      if (success) toast.show(success);
    },
    onError: (err) => toast.show(errorMessage(err), "danger"),
  });
}

/** Valeur différée (recherche dans les listes). */
export function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Alerte avant de quitter la page avec des modifications non enregistrées. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/** Petit stockage local tolérant (navigation privée, stockage bloqué). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* stockage indisponible */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* stockage indisponible */
    }
  },
};

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

/**
 * Liste paginée côté serveur (?page=&limit=) pour les tableaux admin.
 * La page revient à 1 quand les filtres (le chemin) changent ; la taille choisie est mémorisée par tableau.
 */
export function usePagedList<T>(path: string, id: string) {
  const [pageSize, setPageSizeState] = useState(() => defaultPageSize(ADMIN_PAGE_SIZES));
  const [state, setState] = useState({ path, page: 1 });
  // Filtres modifiés : retour en page 1 (ajusté pendant le rendu, sans effet).
  if (state.path !== path) setState({ path, page: 1 });
  const page = state.path === path ? state.page : 1;

  useEffect(() => {
    // Lecture du stockage local au montage : synchronisation avec un système externe.
    const saved = storage.get<number>(`pagesize:${id}`, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((ADMIN_PAGE_SIZES as readonly number[]).includes(saved)) setPageSizeState(saved);
  }, [id]);

  const url = `${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=${pageSize}`;
  const q = useQuery({ queryKey: [url], queryFn: () => api<Page<T>>(url), placeholderData: keepPreviousData });
  const total = q.data?.total ?? 0;
  const pageCount = q.data?.pageCount ?? Math.max(1, Math.ceil(total / pageSize));

  const setPage = (p: number) => setState({ path, page: Math.max(1, Math.min(p, pageCount)) });
  const setPageSize = (n: number) => {
    setPageSizeState(n);
    setState({ path, page: 1 });
    storage.set(`pagesize:${id}`, n);
  };

  return {
    ...q,
    items: q.data?.items ?? [],
    total: q.data?.total,
    /** Props à passer à <DataTable pagination> ou <Pagination>. */
    pagination: { page, pageCount, total, pageSize, pageSizes: ADMIN_PAGE_SIZES, onPageChange: setPage, onPageSizeChange: setPageSize },
  };
}

/** Pagination locale d'une liste déjà chargée en entier (retours, équipe…). */
export function useLocalPage<T>(all: T[], id: string) {
  const [pageSize, setPageSizeState] = useState(() => defaultPageSize(ADMIN_PAGE_SIZES));
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Lecture du stockage local au montage : synchronisation avec un système externe.
    const saved = storage.get<number>(`pagesize:${id}`, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((ADMIN_PAGE_SIZES as readonly number[]).includes(saved)) setPageSizeState(saved);
  }, [id]);

  const slice = slicePage(all, page, pageSize);
  return {
    items: slice.items,
    pagination: {
      page: slice.page,
      pageCount: slice.pageCount,
      total: slice.total,
      pageSize,
      pageSizes: ADMIN_PAGE_SIZES,
      onPageChange: setPage,
      onPageSizeChange: (n: number) => {
        setPageSizeState(n);
        setPage(1);
        storage.set(`pagesize:${id}`, n);
      },
    },
  };
}
