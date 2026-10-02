"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** N'affiche pas son contenu sur les pages dont l'adresse commence par l'un des préfixes (ex. pied de page masqué dans « Mon compte »). */
export function HideOn({ prefixes, children }: { prefixes: string[]; children: ReactNode }) {
  const pathname = usePathname();
  if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
