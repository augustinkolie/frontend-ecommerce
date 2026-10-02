import type { Family } from "./api/types";

export type SizeTable = { title: string; note: string; columns: string[]; rows: string[][] };

/** Guides des tailles par famille (en centimètres). */
export const SIZE_GUIDES: Record<Family, SizeTable> = {
  CLOTHING: {
    title: "Vêtements",
    note: "Mesures du corps, en centimètres. Entre deux tailles, prenez la plus grande pour un tombé ample.",
    columns: ["Taille", "Poitrine", "Taille", "Hanches"],
    rows: [
      ["XS", "80–84", "62–66", "86–90"],
      ["S", "88–92", "70–74", "94–98"],
      ["M", "96–100", "78–82", "102–106"],
      ["L", "104–108", "86–90", "110–114"],
      ["XL", "112–116", "94–98", "118–122"],
      ["XXL", "120–124", "102–106", "126–130"],
    ],
  },
  TSHIRT: {
    title: "T-shirts",
    note: "Mesures du vêtement à plat, en centimètres. Coupe oversize : prenez votre taille habituelle.",
    columns: ["Taille", "Largeur de poitrine", "Longueur dos"],
    rows: [
      ["XS", "46", "66"],
      ["S", "49", "68"],
      ["M", "52", "70"],
      ["L", "55", "72"],
      ["XL", "58", "74"],
      ["XXL", "61", "76"],
    ],
  },
  SHOES: {
    title: "Chaussures",
    note: "Mesurez votre pied du talon à l'orteil le plus long, en fin de journée.",
    columns: ["Pointure EU", "Longueur du pied (cm)", "UK", "US"],
    rows: [
      ["36", "22,5", "3,5", "5"], ["37", "23,2", "4", "6"], ["38", "23,9", "5", "7"], ["39", "24,6", "6", "8"],
      ["40", "25,3", "6,5", "8,5"], ["41", "26", "7,5", "9"], ["42", "26,7", "8", "10"], ["43", "27,4", "9", "11"],
      ["44", "28,1", "10", "12"], ["45", "28,8", "10,5", "12,5"], ["46", "29,5", "11,5", "13"],
    ],
  },
  LINEN: {
    title: "Linge de maison",
    note: "Choisissez la dimension de votre matelas ; pour une housse de couette, celle de votre couette.",
    columns: ["Dimension", "Lit", "Housse de couette conseillée", "Bonnet (drap housse)"],
    rows: [
      ["90×190", "1 personne", "140×200", "30 cm"],
      ["140×190", "2 personnes", "220×240", "30 cm"],
      ["160×200", "Queen", "240×260", "30 cm"],
      ["180×200", "King", "260×240", "30 cm"],
    ],
  },
};
