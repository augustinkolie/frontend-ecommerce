import { ApiRequestError, type ApiError } from "./errors";

/** Appel depuis le navigateur, via le BFF /api (cookies httpOnly gérés par le serveur). */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
  });
  const body = (await res.json().catch(() => null)) as { data?: T; error?: ApiError } | null;
  if (!res.ok || !body || body.error) {
    throw new ApiRequestError(res.status, body?.error ?? { code: "UNKNOWN", message: "Une erreur est survenue, réessayez." });
  }
  return body.data as T;
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError) return err.error.message;
  return "Une erreur est survenue, réessayez.";
}

export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiRequestError) || !err.error.fields) return {};
  return Object.fromEntries(Object.entries(err.error.fields).map(([k, v]) => [k, v[0] ?? ""]));
}
