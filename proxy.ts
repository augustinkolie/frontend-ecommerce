import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1";

/**
 * Jeton d'accès expiré (cookie `at` absent) mais refresh token présent :
 * on renouvelle la session avant le rendu, pour que les Server Components
 * voient l'utilisateur connecté, et on transmet les nouveaux cookies au navigateur.
 */
export async function proxy(request: NextRequest) {
  const hasAccess = request.cookies.has("at");
  const hasRefresh = request.cookies.has("rt");
  if (hasAccess || !hasRefresh) return NextResponse.next();

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      cache: "no-store",
    });
    const setCookies = res.headers.getSetCookie();
    if (!res.ok || setCookies.length === 0) {
      const out = NextResponse.next();
      out.cookies.delete("rt");
      return out;
    }

    // Cookies à jour pour le rendu de cette requête…
    const fresh = new Map(request.cookies.getAll().map((c) => [c.name, c.value]));
    for (const sc of setCookies) {
      const [pair] = sc.split(";");
      const [name, ...value] = pair!.split("=");
      fresh.set(name!.trim(), decodeURIComponent(value.join("=")));
    }
    const headers = new Headers(request.headers);
    headers.set("cookie", [...fresh].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; "));
    const out = NextResponse.next({ request: { headers } });
    // …et pour le navigateur.
    for (const sc of setCookies) out.headers.append("set-cookie", sc);
    return out;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/revalidate|.*\\.(?:png|jpg|svg|webp|avif|ico)$).*)"],
};
