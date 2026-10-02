import type { Family, OrderStatus, Role } from "@/lib/api/types";

export type Dashboard = {
  range: string;
  revenue: { today: number; week: number; month: number; range: number };
  ordersInRange: number;
  toProcess: number;
  averageOrder: number;
  conversionRate: number;
  topProducts: { productId: string; name: string; quantity: number }[];
  lowStock: { variantId: string; sku: string; productId: string; name: string; variant: string; available: number }[];
  series: { date: string; revenue: number; orders: number }[];
  recentOrders: { id: string; number: number; status: OrderStatus; total: number; currency: string; email: string; createdAt: string }[];
};

export type AdminOrderRow = {
  id: string;
  number: number;
  status: OrderStatus;
  email: string;
  customer: string;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  itemCount: number;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  email: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; country: string };
  internalNotes: string | null;
  reservedUntil: string | null;
  createdAt: string;
  items: { id: string; name: string; sku: string; attributes: { name: string; value: string }[]; unitPrice: number; quantity: number; variantId: string | null }[];
  payments: { id: string; provider: string; externalRef: string | null; amount: number; refundedAmount: number; status: string; createdAt: string }[];
  shipment: { carrier: string; trackingNumber: string | null; shippedAt: string | null; deliveredAt: string | null } | null;
  events: { id: string; type: string; message: string; internal: boolean; createdAt: string; author: { name: string | null; email: string } | null }[];
  user: { id: string; name: string | null; email: string; phone: string | null } | null;
  coupon: { code: string } | null;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  family: Family;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  category: string;
  imageUrl: string | null;
  variantCount: number;
  stock: number;
  lowStock: boolean;
  priceMin: number;
  priceMax: number;
  updatedAt: string;
};

export type AttributeValue = { id: string; typeId: string; value: string; hex: string | null; position: number; _count?: { variants: number } };
export type AttributeType = { id: string; code: string; name: string; families: Family[]; position: number; values: AttributeValue[] };

export type AdminVariant = {
  id?: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  stockReserved?: number;
  lowStockAlert: number;
  weightGrams: number | null;
  attributeValueIds: string[];
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  family: Family;
  categoryId: string;
  material: string | null;
  care: string | null;
  details: Record<string, string> | null;
  status: AdminProductRow["status"];
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  collections: { id: string; name: string }[];
  images: { id: string; url: string; alt: string; colorValueId: string | null; position: number }[];
  variants: AdminVariant[];
};

export type AdminCategory = { id: string; name: string; slug: string; parentId: string | null; position: number; image: string | null; productCount: number };
export type AdminCollection = { id: string; name: string; slug: string; type: "MANUAL" | "AUTO"; rules: Record<string, unknown> | null; productCount: number };

export type StockRow = { id: string; sku: string; productId: string; productName: string; variant: string; stock: number; reserved: number; available: number; lowStockAlert: number; level: "ok" | "low" | "out" };
export type Movement = { id: string; type: string; quantity: number; reason: string | null; createdAt: string; author: string; sku: string; productName: string; variant: string };

export type CustomerRow = { id: string; name: string | null; email: string; phone: string | null; blocked: boolean; createdAt: string; orderCount: number; totalSpent: number };

export type Coupon = { id: string; code: string; type: "PERCENT" | "AMOUNT" | "FREE_SHIPPING"; value: number; minimum: number | null; startsAt: string | null; endsAt: string | null; maxUses: number | null; usedCount: number };
export type Sale = { id: string; name: string; categoryId: string; percent: number; startsAt: string; endsAt: string; category: { name: string } };

export type AdminReview = { id: string; rating: number; text: string; reply: string | null; status: "PENDING" | "APPROVED" | "HIDDEN"; createdAt: string; user: { name: string | null; email: string }; product: { id: string; name: string; slug: string } };

export type StaffMember = { id: string; email: string; name: string | null; role: Exclude<Role, "CUSTOMER">; active: boolean; createdAt: string };
export type AuditEntry = { id: string; action: string; entityType: string; entityId: string; before: unknown; after: unknown; createdAt: string; author: { name: string | null; email: string } | null };

export type ShopSettings = {
  shopName: string;
  currency: string;
  locale: string;
  taxRate: number;
  pricesIncludeTax: boolean;
  paymentMethods: { code: string; label: string; enabled: boolean }[];
  contactEmail: string;
  contactPhone: string;
  address: string;
  freeShippingThreshold: number | null;
  emails: { abandonedCart: boolean; reviewRequest: boolean; backInStock: boolean };
};

export type AdminReturn = {
  id: string;
  status: "REQUESTED" | "ACCEPTED" | "REFUSED" | "RECEIVED" | "REFUNDED";
  reason: string;
  items: { orderItemId: string; quantity: number }[];
  createdAt: string;
  order: { id: string; number: number; items: { id: string; name: string; sku: string }[] };
  user: { name: string | null; email: string };
};

/** Point produit de la une : position en % de la photo (x de gauche à droite, y de haut en bas). */
export type HeroHotspotDraft = { productId: string; name: string; imageUrl: string | null; x: number; y: number };

export type AdminContentBlock = {
  id: string;
  slot: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  hotspots: HeroHotspotDraft[];
  position: number;
  active: boolean;
};
