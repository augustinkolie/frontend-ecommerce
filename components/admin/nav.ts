import {
  Boxes,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Users,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; permission: string };

/** Modules de l'admin et permission requise (voir backend/src/lib/rbac.ts). */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart, permission: "orders" },
  { href: "/admin/produits", label: "Produits", icon: Package, permission: "products" },
  { href: "/admin/categories", label: "Catégories et collections", icon: Boxes, permission: "products" },
  { href: "/admin/attributs", label: "Attributs", icon: Tags, permission: "products" },
  { href: "/admin/stock", label: "Stock", icon: Warehouse, permission: "stock" },
  { href: "/admin/clients", label: "Clients", icon: Users, permission: "customers" },
  { href: "/admin/promotions", label: "Promotions", icon: Percent, permission: "promotions" },
  { href: "/admin/avis", label: "Avis", icon: Star, permission: "reviews" },
  { href: "/admin/contenu", label: "Contenu", icon: FileText, permission: "content" },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings, permission: "settings" },
  { href: "/admin/equipe", label: "Équipe", icon: UsersRound, permission: "team" },
  { href: "/admin/audit", label: "Journal d'audit", icon: History, permission: "team" },
];
