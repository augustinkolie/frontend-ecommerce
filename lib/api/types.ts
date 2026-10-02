/**
 * Types des réponses de l'API, générés depuis la spec OpenAPI du backend
 * (`npm run generate:api` → schema.d.ts) : jamais recopiés à la main.
 */
import type { components } from "./schema";

type S = components["schemas"];

export type Family = S["ProductCard"]["family"];
export type OrderStatus = S["PublicOrder"]["status"];
export type Role = S["User"]["role"];

export type ProductCard = S["ProductCard"];
export type Facet = S["Facet"];
export type ProductList = S["ProductList"];
export type CategoryNode = S["CategoryNode"];
export type ProductDetail = S["ProductDetail"];
export type StockLevel = S["StockLevel"];
export type Review = S["Review"];
export type CartLine = S["CartLine"];
export type Cart = S["Cart"];
export type ShippingZone = S["ShippingZone"];
export type PublicSettings = S["PublicSettings"];
export type User = S["User"];
export type Address = S["Address"];
export type ContentBlock = S["ContentBlock"];
export type HomeContent = S["HomeContent"];
export type HeroProduct = S["HeroProduct"];
export type LegalPage = S["LegalPage"];
export type PublicOrder = S["PublicOrder"];

export type Page<T> = { items: T[]; nextCursor: string | null; total?: number; page?: number; pageCount?: number };

/* Réponses du compte client : décrites sommairement dans la spec, typées ici. */

export type OrderItem = { id: string; name: string; sku: string; attributes: { code: string; name: string; value: string }[]; unitPrice: number; quantity: number; variantId: string | null };

export type CustomerOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; country: string };
  createdAt: string;
  items: (OrderItem & { variant?: { product: { slug: string; images: { url: string }[] } } | null })[];
  shipment: { carrier: string; trackingNumber: string | null; shippedAt: string | null; deliveredAt: string | null } | null;
  events?: { id: string; message: string; createdAt: string }[];
  returns?: { id: string; status: string }[];
};

export type ReturnRequest = { id: string; status: string; reason: string; createdAt: string; order: { number: number } };
