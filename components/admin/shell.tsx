"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogOut, Menu, Search, Store } from "lucide-react";
import { Drawer } from "@/components/ui/dialog";
import { api } from "@/lib/api/browser";
import type { User } from "@/lib/api/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import { CommandPalette } from "./command-palette";
import { ConfirmProvider } from "./confirm";
import { ADMIN_NAV } from "./nav";
import { LogoMark } from "@/components/shop/logo";
import { ToastProvider } from "./toast";

const UserCtx = createContext<User | null>(null);
/** Utilisateur connecté (rôle, permissions) dans l'admin. */
export const useAdminUser = () => useContext(UserCtx)!;

const ROLE_LABEL: Record<string, string> = { OWNER: "Propriétaire", MANAGER: "Gestionnaire", SUPPORT: "Service client", STOCK: "Magasinier" };

function NavLinks({ permissions, onNavigate }: { permissions: string[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1 p-2">
      {ADMIN_NAV.filter((n) => permissions.includes(n.permission)).map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-9 items-center gap-3 rounded-sm px-3 text-sm", active ? "bg-accent text-on-ink" : "text-ink-muted hover:bg-surface-alt hover:text-ink")}
            >
              <Icon aria-hidden size={20} strokeWidth={1.5} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ user, children }: { user: User; children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false } } }));
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const router = useRouter();

  // Palette admin : classe sur <html> (les modales sont rendues dans <body>).
  // Le mode sombre est commun au site (lib/theme) : il n'est pas retiré en quittant l'admin.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("admin");
    return () => html.classList.remove("admin");
  }, []);

  const iconBtn = "inline-flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-surface-alt hover:text-ink";

  return (
    <UserCtx.Provider value={user}>
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ConfirmProvider>
          <div className="flex min-h-dvh bg-bg font-sans text-sm text-ink">
            <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
              <Link href="/admin" className="flex h-14 items-center gap-2 border-b border-line px-4 font-semibold"><LogoMark className="size-6" />Leppi · Admin</Link>
              <nav aria-label="Administration" className="flex-1 overflow-y-auto">
                <NavLinks permissions={user.permissions} />
              </nav>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface px-4">
                <button type="button" className={cn(iconBtn, "lg:hidden")} aria-label="Menu" onClick={() => setMenu(true)}>
                  <Menu aria-hidden size={20} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setPalette(true)}
                  className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-sm border border-line bg-bg px-3 text-left text-ink-muted hover:border-ink-muted"
                >
                  <Search aria-hidden size={16} strokeWidth={1.5} />
                  <span className="flex-1 truncate">Aller à une commande, un produit, un client…</span>
                  <kbd className="hidden rounded-sm border border-line px-1 text-xs sm:inline">Ctrl K</kbd>
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <Link href="/" className={iconBtn} aria-label="Voir la boutique" target="_blank">
                    <Store aria-hidden size={20} strokeWidth={1.5} />
                  </Link>
                  <ThemeToggle className={iconBtn} />
                  <span className="hidden px-2 text-right text-xs leading-tight md:block">
                    {user.name ?? user.email}
                    <br />
                    <span className="text-ink-muted">{ROLE_LABEL[user.role] ?? user.role}</span>
                  </span>
                  <button
                    type="button"
                    className={iconBtn}
                    aria-label="Se déconnecter"
                    onClick={async () => {
                      await api("/auth/logout", { method: "POST" }).catch(() => {});
                      router.push("/connexion");
                      router.refresh();
                    }}
                  >
                    <LogOut aria-hidden size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </header>
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </div>
          <Drawer open={menu} onOpenChange={setMenu} side="left" title="Leppi · Admin" description="Navigation">
            <nav aria-label="Administration">
              <NavLinks permissions={user.permissions} onNavigate={() => setMenu(false)} />
            </nav>
          </Drawer>
          <CommandPalette permissions={user.permissions} open={palette} onOpenChange={setPalette} />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
    </UserCtx.Provider>
  );
}
