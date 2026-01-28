import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ModuleId } from "@/config/modules";

// Couleurs et gradients par module - avec support light/dark mode
const MODULE_SETTINGS_THEME = {
  finance: {
    primary: "emerald",
    // Light mode: texte sombre, Dark mode: texte clair
    text: "text-emerald-700 dark:text-emerald-100/80",
    activeText: "text-emerald-800 dark:text-emerald-100",
    // Light mode: fond clair, Dark mode: fond semi-transparent
    badge: "bg-emerald-100 dark:bg-emerald-500/20",
    // Light mode: couleur primaire, Dark mode: couleur claire
    navActive: "border-emerald-200 dark:border-white/25 bg-emerald-50 dark:bg-white/10 text-emerald-800 dark:text-white",
    navHover: "hover:border-emerald-100 dark:hover:border-white/15 hover:bg-emerald-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-indigo-500/10 dark:bg-indigo-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-purple-500/10 dark:bg-purple-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-emerald-500/10 dark:bg-emerald-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  store: {
    primary: "indigo",
    text: "text-indigo-700 dark:text-indigo-100/80",
    activeText: "text-indigo-800 dark:text-indigo-100",
    badge: "bg-indigo-100 dark:bg-indigo-500/20",
    navActive: "border-indigo-200 dark:border-white/25 bg-indigo-50 dark:bg-white/10 text-indigo-800 dark:text-white",
    navHover: "hover:border-indigo-100 dark:hover:border-white/15 hover:bg-indigo-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-indigo-500/10 dark:bg-indigo-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-blue-500/10 dark:bg-blue-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-cyan-500/10 dark:bg-cyan-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  stock: {
    primary: "orange",
    text: "text-orange-700 dark:text-orange-100/80",
    activeText: "text-orange-800 dark:text-orange-100",
    badge: "bg-orange-100 dark:bg-orange-500/20",
    navActive: "border-orange-200 dark:border-white/25 bg-orange-50 dark:bg-white/10 text-orange-800 dark:text-white",
    navHover: "hover:border-orange-100 dark:hover:border-white/15 hover:bg-orange-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-orange-500/10 dark:bg-orange-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-amber-500/10 dark:bg-amber-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-yellow-500/10 dark:bg-yellow-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  crm: {
    primary: "violet",
    text: "text-violet-700 dark:text-violet-100/80",
    activeText: "text-violet-800 dark:text-violet-100",
    badge: "bg-violet-100 dark:bg-violet-500/20",
    navActive: "border-violet-200 dark:border-white/25 bg-violet-50 dark:bg-white/10 text-violet-800 dark:text-white",
    navHover: "hover:border-violet-100 dark:hover:border-white/15 hover:bg-violet-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-violet-500/10 dark:bg-violet-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-purple-500/10 dark:bg-purple-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  marketing: {
    primary: "pink",
    text: "text-pink-700 dark:text-pink-100/80",
    activeText: "text-pink-800 dark:text-pink-100",
    badge: "bg-pink-100 dark:bg-pink-500/20",
    navActive: "border-pink-200 dark:border-white/25 bg-pink-50 dark:bg-white/10 text-pink-800 dark:text-white",
    navHover: "hover:border-pink-100 dark:hover:border-white/15 hover:bg-pink-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-pink-500/10 dark:bg-pink-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-rose-500/10 dark:bg-rose-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  hr: {
    primary: "cyan",
    text: "text-cyan-700 dark:text-cyan-100/80",
    activeText: "text-cyan-800 dark:text-cyan-100",
    badge: "bg-cyan-100 dark:bg-cyan-500/20",
    navActive: "border-cyan-200 dark:border-white/25 bg-cyan-50 dark:bg-white/10 text-cyan-800 dark:text-white",
    navHover: "hover:border-cyan-100 dark:hover:border-white/15 hover:bg-cyan-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-cyan-500/10 dark:bg-cyan-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-teal-500/10 dark:bg-teal-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-sky-500/10 dark:bg-sky-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
  home: {
    primary: "gray",
    text: "text-gray-600 dark:text-gray-100/80",
    activeText: "text-gray-800 dark:text-gray-100",
    badge: "bg-gray-100 dark:bg-gray-500/20",
    navActive: "border-gray-200 dark:border-white/25 bg-gray-50 dark:bg-white/10 text-gray-800 dark:text-white",
    navHover: "hover:border-gray-100 dark:hover:border-white/15 hover:bg-gray-50/50 dark:hover:bg-white/5",
    gradients: [
      { color: "bg-gray-500/10 dark:bg-gray-500/20", position: "-left-40 top-0", size: "h-[500px] w-[500px]" },
      { color: "bg-slate-500/10 dark:bg-slate-500/20", position: "-right-40 top-1/3", size: "h-[400px] w-[400px]" },
      { color: "bg-zinc-500/10 dark:bg-zinc-500/20", position: "bottom-0 left-1/3", size: "h-[350px] w-[350px]" },
    ],
  },
} as const;

export interface NavItem {
  href: string;
  label: string;
}

export interface ModuleSettingsLayoutProps {
  moduleId: ModuleId;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  children: ReactNode;
}

function isActive(href: string, pathname: string, basePath: string) {
  if (href === basePath && pathname === basePath) return true;
  return pathname.startsWith(href) && href !== basePath;
}

export function ModuleSettingsLayout({
  moduleId,
  navItems,
  title,
  subtitle,
  children,
}: ModuleSettingsLayoutProps) {
  const { pathname } = useLocation();
  const theme = MODULE_SETTINGS_THEME[moduleId];
  const basePath = navItems[0]?.href || "";

  return (
    <div className="relative space-y-6 text-gray-900 dark:text-white">
      {/* Background effects - visible uniquement en dark mode pour éviter le bruit visuel en light */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:block hidden">
        {theme.gradients.map((gradient, index) => (
          <div
            key={index}
            className={cn(
              "absolute rounded-full blur-[120px]",
              gradient.color,
              gradient.position,
              gradient.size
            )}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <p className={cn("text-xs uppercase tracking-[0.25em]", theme.text)}>
          Paramètres
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className={cn("text-sm", theme.text)}>{subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 backdrop-blur-xl shadow-sm dark:shadow-lg">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                  "border border-transparent",
                  theme.navHover,
                  isActive(item.href, pathname, basePath)
                    ? theme.navActive
                    : theme.text
                )}
              >
                <span>{item.label}</span>
                {isActive(item.href, pathname, basePath) && (
                  <span className={cn("text-xs rounded-full px-2 py-0.5", theme.badge, theme.activeText)}>
                    Actif
                  </span>
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

export default ModuleSettingsLayout;
