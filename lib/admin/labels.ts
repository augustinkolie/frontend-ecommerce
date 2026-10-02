import type { BadgeTone } from "@/components/ui/badge";
import type { AdminProductRow } from "./types";

export const PRODUCT_STATUS: Record<AdminProductRow["status"], { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  PUBLISHED: { label: "Publié", tone: "success" },
  SCHEDULED: { label: "Programmé", tone: "focus" },
  ARCHIVED: { label: "Archivé", tone: "ink" },
};

export const FAMILY: Record<string, string> = { LINEN: "Linge de maison", CLOTHING: "Vêtements", TSHIRT: "T-shirts", SHOES: "Chaussures" };

export const ROLE_LABEL: Record<string, string> = { OWNER: "Propriétaire", MANAGER: "Gestionnaire", SUPPORT: "Service client", STOCK: "Magasinier" };

/** Attributs descriptifs proposés par famille (modifiables librement). */
export const DETAIL_PRESETS: Record<string, string[]> = {
  LINEN: ["Grammage", "Fils/cm²", "Tissage"],
  CLOTHING: ["Coupe", "Mannequin"],
  TSHIRT: ["Grammage", "Col", "Coupe"],
  SHOES: ["Dessus", "Semelle", "Largeur"],
};
