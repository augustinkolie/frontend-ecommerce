import { revalidateTag } from "next/cache";
import { z } from "zod";

/**
 * Appelé par le backend quand l'admin modifie une donnée du catalogue.
 * Corps : { tags: ["product:<id>", "catalog"], immediate? }, en-tête x-revalidate-secret.
 * `immediate` (seed, imports) expire le cache tout de suite au lieu de le servir
 * une dernière fois pendant le rafraîchissement.
 */
const bodySchema = z.object({ tags: z.array(z.string().min(1).max(256)).min(1).max(50), immediate: z.boolean().optional() });

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: { code: "UNAUTHORIZED", message: "Secret invalide" } }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Corps invalide" } },
      { status: 400 },
    );
  }

  const profile = parsed.data.immediate ? { expire: 0 } : "max";
  for (const tag of parsed.data.tags) revalidateTag(tag, profile);
  return Response.json({ data: { revalidated: parsed.data.tags } });
}
