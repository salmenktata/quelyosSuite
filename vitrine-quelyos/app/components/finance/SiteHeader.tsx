"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  Wallet,
  PieChart,
  TrendingUp,
  FileText,
  Users,
  Building2,
  Zap,
  Shield,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Target,
  Layers,
  Sparkles,
} from "lucide-react";

import config from "@/app/lib/config";
// Types pour les items de navigation
interface NavItem {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  badge?: string;
}

// Données de navigation structurées comme Linear
const featuresItems: NavItem[] = [
  {
    icon: BarChart3,
    label: "Tableau de bord",
    description: "Vue d'ensemble de vos finances",
    href: "/finance/features/dashboard",
  },
  {
    icon: Wallet,
    label: "Comptes & Transactions",
    description: "Gérez tous vos comptes bancaires",
    href: "/finance/features/accounts",
  },
  {
    icon: PieChart,
    label: "Budgets intelligents",
    description: "Planifiez et suivez vos dépenses",
    href: "/finance/features/budgets",
  },
  {
    icon: TrendingUp,
    label: "Prévisions IA",
    description: "Anticipez votre trésorerie",
    href: "/finance/features/forecast",
  },
  {
    icon: FileText,
    label: "Rapports & Exports",
    description: "Analyses détaillées et comptabilité",
    href: "/finance/features/reports",
  },
  {
    icon: Shield,
    label: "Sécurité",
    description: "Protection bancaire de vos données",
    href: "/finance/features/security",
  },
];

const solutionsItems: NavItem[] = [
  {
    icon: Building2,
    label: "TPE & Indépendants",
    description: "Solution complète pour les petites structures",
    href: "/finance/tpe",
    badge: "Populaire",
  },
  {
    icon: Users,
    label: "Cabinet Conseil",
    description: "Facturation et suivi projets clients",
    href: "/finance/templates/cabinet-conseil",
  },
  {
    icon: Lightbulb,
    label: "Agence Web",
    description: "Gestion financière créative",
    href: "/finance/templates/agence-web",
  },
  {
    icon: Zap,
    label: "Startup SaaS",
    description: "MRR, churn et métriques clés",
    href: "/finance/templates/startup-saas",
  },
];

const resourcesItems: NavItem[] = [
  {
    icon: BookOpen,
    label: "Documentation",
    description: "Guides et tutoriels",
    href: "/finance/docs",
  },
  {
    icon: Target,
    label: "Roadmap Produit",
    description: "Notre vision et prochaines fonctionnalités",
    href: "/finance/backlog",
  },
  {
    icon: Layers,
    label: "Templates",
    description: "Modèles prêts à l'emploi",
    href: "/finance/templates",
    badge: "Nouveau",
  },
  {
    icon: MessageSquare,
    label: "Support & Contact",
    description: "Centre d'aide et FAQ",
    href: "/finance/support",
    badge: "Nouveau",
  },
  {
    icon: HelpCircle,
    label: "FAQ",
    description: "Questions fréquentes",
    href: "/finance/faq",
  },
];

// Composant Dropdown avec animation
function NavDropdown({
  label,
  items,
  columns = 1,
}: {
  label: string;
  items: typeof featuresItems;
  columns?: 1 | 2;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          open
            ? "text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 top-full z-50 mt-2 rounded-xl border border-white/10 bg-slate-900/98 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl ${
              columns === 2 ? "w-[480px]" : "w-[280px]"
            }`}
          >
            <div className={columns === 2 ? "grid grid-cols-2 gap-1" : "space-y-1"}>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-400">
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {item.label}
                      </span>
                      {"badge" in item && item.badge && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FinanceSiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Effet scroll pour background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer mobile menu sur changement de route
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/finance" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Quelyos Finance</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            <NavDropdown label="Fonctionnalités" items={featuresItems} columns={2} />
            <NavDropdown label="Solutions" items={solutionsItems} />
            <Link
              href="/tarifs"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Tarifs
            </Link>
            <NavDropdown label="Ressources" items={resourcesItems} />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={config.finance.login}
              className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline-flex"
            >
              Connexion
            </Link>

            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span className="hidden sm:inline">Commencer</span>
              <span className="sm:hidden">Essai</span>
              <ArrowRight size={14} />
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              aria-controls="finance-mobile-menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-sm overflow-y-auto border-l border-white/10 bg-slate-950 p-6 lg:hidden"
              id="finance-mobile-menu"
            >
              <div className="mb-8 flex items-center justify-between">
                <Link href="/finance" className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-white">Quelyos Finance</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-6">
                {/* Fonctionnalités */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fonctionnalités
                  </p>
                  <div className="space-y-1">
                    {featuresItems.slice(0, 4).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <item.icon size={18} className="text-slate-500" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Solutions */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Solutions
                  </p>
                  <div className="space-y-1">
                    {solutionsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <item.icon size={18} className="text-slate-500" />
                        {item.label}
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Liens directs */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Liens
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/tarifs"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Tarifs
                    </Link>
                    <Link
                      href="/finance/templates"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Templates
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Nouveau
                      </span>
                    </Link>
                    <Link
                      href="/finance/backlog"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Roadmap
                    </Link>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3 border-t border-white/10 pt-6">
                  <Link
                    href={config.finance.register}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    Commencer gratuitement
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={config.finance.login}
                    className="flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
                  >
                    Se connecter
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
