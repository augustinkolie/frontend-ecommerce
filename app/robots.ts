import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/compte", "/commande", "/panier", "/recherche", "/styleguide"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
