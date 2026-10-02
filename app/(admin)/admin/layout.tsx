import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { apiAuthedOrNull } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

/** Layout admin : réservé à l'équipe ; chaque rôle ne voit que ses modules. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await apiAuthedOrNull<User>("/me");
  if (!user) redirect("/connexion?next=/admin");
  if (user.role === "CUSTOMER") redirect("/compte");
  return <AdminShell user={user}>{children}</AdminShell>;
}
