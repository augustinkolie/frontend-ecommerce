import "server-only";
import { cookies } from "next/headers";
import { ApiRequestError, type ApiError } from "./errors";

/**
 * Client typé vers le backend, côté serveur. Le frontend n'accède jamais à la base :
 * tout passe par l'API (URL interne + clé de service pour les lectures publiques).
 */

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1";
const SERVICE_KEY = process.env.API_SERVICE_KEY ?? "";

type FetchOptions = RequestInit & {
  /** Tags de cache Next.js, ex. ["catalog", "product:drap"]. */
  tags?: string[];
  /** Durée ISR en secondes. */
  revalidate?: number | false;
};

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as { data?: T; error?: ApiError } | null;
  if (!res.ok || !body || body.error) {
    throw new ApiRequestError(res.status, body?.error ?? { code: "UNKNOWN", message: `Erreur API ${res.status}` });
  }
  return body.data as T;
}

/** Lecture publique mise en cache (catalogue, contenus) : revalidation par tag. */
export async function apiFetch<T>(path: string, { tags, revalidate = 300, headers, ...init }: FetchOptions = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(SERVICE_KEY ? { "x-service-key": SERVICE_KEY } : {}), ...headers },
    next: { tags, revalidate },
  });
  return parse<T>(res);
}

/** Lecture authentifiée (compte, commande) : cookies transmis, jamais de cache. */
export async function apiAuthed<T>(path: string, init: RequestInit = {}) {
  const jar = await cookies();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", cookie: jar.toString(), ...init.headers },
    cache: "no-store",
  });
  return parse<T>(res);
}

/** Variante qui renvoie null sur 401/404 au lieu de lever. */
export async function apiAuthedOrNull<T>(path: string) {
  try {
    return await apiAuthed<T>(path);
  } catch (err) {
    if (err instanceof ApiRequestError && [401, 403, 404].includes(err.status)) return null;
    throw err;
  }
}

export async function apiFetchOrNull<T>(path: string, opts?: FetchOptions) {
  try {
    return await apiFetch<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}
