import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiAuthedOrNull } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { AccountNav } from "./account-nav";

export const metadata: Metadata = { title: { default: "Mon compte", template: "%s · Mon compte" }, robots: { index: false } };

export default async function AccountLayout({ children }: LayoutProps<"/compte">) {
  const user = await apiAuthedOrNull<User>("/me");
  if (!user) redirect("/connexion?next=/compte");
  const firstName = user.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-24 md:px-8 md:pt-12">
      <header className="flex flex-col gap-1 border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-normal tracking-title md:text-4xl">Mon compte</h1>
        <p className="text-ink-muted">
          {firstName ? `Bonjour ${firstName}` : "Bonjour"} · <span className="break-all">{user.email}</span>
        </p>
      </header>
      <div className="grid gap-8 pt-6 lg:grid-cols-12 lg:gap-12 lg:pt-10">
        <div className="lg:col-span-3">
          <AccountNav isStaff={user.role !== "CUSTOMER"} />
        </div>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
