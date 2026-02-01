

import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/finance/settings", label: "Vue d'ensemble" },
  { href: "/finance/settings/devise", label: "Devise & formats" },
  { href: "/finance/settings/tva", label: "TVA & fiscalité" },
  { href: "/finance/settings/categories", label: "Catégories" },
  { href: "/finance/settings/flux", label: "Flux de paiement" },
  { href: "/finance/settings/notifications", label: "Notifications & exports" },
  { href: "/finance/settings/integrations", label: "Intégrations" },
];

function isActive(href: string, pathname: string) {
  if (href === "/finance/settings" && pathname === "/finance/settings") return true;
  return pathname.startsWith(href) && href !== "/finance/settings";
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Paramètres</p>
        <h1 className="text-3xl font-semibold">Centre de configuration</h1>
        <p className="text-sm text-indigo-100/80">
          Naviguez par rubrique : devises, TVA, catégories, notifications et intégrations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-lg">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                  "border border-transparent hover:border-white/15 hover:bg-white/5",
                  isActive(item.href, pathname)
                    ? "border-white/25 bg-white/10 text-white"
                    : "text-indigo-100/80"
                )}
              >
                <span>{item.label}</span>
                {isActive(item.href, pathname) && (
                  <span className="text-xs rounded-full bg-indigo-500/20 px-2 py-0.5 text-indigo-100">Actif</span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
