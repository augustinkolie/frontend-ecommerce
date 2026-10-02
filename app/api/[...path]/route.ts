import type { NextRequest } from "next/server";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1";

/** En-têtes transmis au backend. */
const FORWARD = ["content-type", "cookie", "idempotency-key", "accept"];

/**
 * BFF : le navigateur n'appelle que le frontend. Chaque appel /api/* est relayé
 * vers le backend avec les cookies httpOnly ; les Set-Cookie de l'API sont renvoyés tels quels.
 */
async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = new URL(`${API_URL}/${path.map(encodeURIComponent).join("/")}`);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  for (const h of FORWARD) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("x-forwarded-for", request.headers.get("x-forwarded-for") ?? "127.0.0.1");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const res = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "cache-control"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  for (const c of res.headers.getSetCookie()) out.append("set-cookie", c);
  return new Response(res.body, { status: res.status, headers: out });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
