"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Megaphone,
  LogIn,
  Wallet,
  Store,
  UserCircle,
  Boxes,
  UsersRound,
  Monitor,
  Layers,
  Sparkles,
  ArrowRight,
  Compass,
  UtensilsCrossed,
  ShoppingBag,
  Globe,
  Briefcase,
  Heart,
  Hammer,
  Building2,
  Users,
  Wrench,
  Factory,
  Home,
  GraduationCap,
  Truck,
} from "lucide-react";
import config from "../lib/config";
import Container from "./Container";

// Modules pour le dropdown
const modulesNav = [
  { id: "finance", name: "Finance", tagline: "Trésorerie & Prévisions IA", icon: Wallet, href: "/finance", color: "text-emerald-400" },
  { id: "store", name: "Boutique", tagline: "E-commerce complet", icon: Store, href: "/ecommerce", color: "text-indigo-400" },
  { id: "crm", name: "CRM", tagline: "Clients & Pipeline", icon: UserCircle, href: "/crm", color: "text-violet-400" },
  { id: "stock", name: "Stock", tagline: "Inventaire multi-sites", icon: Boxes, href: "/stock", color: "text-orange-400" },
  { id: "hr", name: "RH", tagline: "Gestion du personnel", icon: UsersRound, href: "/hr", color: "text-cyan-400" },
  { id: "pos", name: "Point de Vente", tagline: "Caisse & Click & Collect", icon: Monitor, href: "/pos", color: "text-teal-400" },
  { id: "marketing", name: "Marketing", tagline: "Campagnes Email & SMS", icon: Megaphone, href: "/marketing", color: "text-pink-400" },
  { id: "gmao", name: "GMAO", tagline: "Maintenance & Équipements", icon: Wrench, href: "/gmao", color: "text-slate-400" },
];

// Solutions métier par secteur pour le mega menu
const solutionsNav = {
  commerce: [
    { id: "restaurant", name: "Quelyos Resto", tagline: "Restauration complète", icon: UtensilsCrossed, href: "/solutions/restaurant", color: "text-orange-400" },
    { id: "commerce", name: "Quelyos Boutique", tagline: "Commerce omnicanal", icon: ShoppingBag, href: "/solutions/commerce", color: "text-pink-400" },
    { id: "ecommerce", name: "Quelyos Store", tagline: "Vente en ligne", icon: Globe, href: "/solutions/ecommerce", color: "text-indigo-400" },
    { id: "hotellerie", name: "Quelyos Hotel", tagline: "Hôtellerie & hébergement", icon: Building2, href: "/solutions/hotellerie", color: "text-cyan-400" },
  ],
  services: [
    { id: "services", name: "Quelyos Pro", tagline: "Services B2B & agences", icon: Briefcase, href: "/solutions/services", color: "text-blue-400" },
    { id: "sante", name: "Quelyos Care", tagline: "Santé & bien-être", icon: Heart, href: "/solutions/sante", color: "text-red-400" },
    { id: "immobilier", name: "Quelyos Immo", tagline: "Immobilier & gestion", icon: Home, href: "/solutions/immobilier", color: "text-violet-400" },
    { id: "education", name: "Quelyos Edu", tagline: "Formation & éducation", icon: GraduationCap, href: "/solutions/education", color: "text-blue-400" },
  ],
  metiers: [
    { id: "btp", name: "Quelyos Build", tagline: "BTP & artisanat", icon: Hammer, href: "/solutions/btp", color: "text-amber-400" },
    { id: "industrie", name: "Quelyos Industrie", tagline: "PME industrielles", icon: Factory, href: "/solutions/industrie", color: "text-slate-400" },
    { id: "logistique", name: "Quelyos Logistique", tagline: "Transport & entreposage", icon: Truck, href: "/solutions/logistique", color: "text-teal-400" },
    { id: "associations", name: "Quelyos Club", tagline: "Vie associative", icon: Users, href: "/solutions/associations", color: "text-green-400" },
  ]
};

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modulesDropdown, setModulesDropdown] = useState(false);
  const [solutionsDropdown, setSolutionsDropdown] = useState(false);


  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <Container className="py-4">
        <div className="flex items-center justify-between">
          {/* Logo avec Sparkles */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quelyos</h1>
              <p className="text-xs text-slate-400">Suite TPE/PME</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {/* Solutions métier Mega Menu (PREMIER) */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsDropdown(true)}
              onMouseLeave={() => setSolutionsDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
              >
                <Compass className="h-4 w-4 text-cyan-400" />
                Solutions métier
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${solutionsDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {solutionsDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[740px] rounded-xl border border-white/10 bg-slate-800/95 p-4 shadow-xl backdrop-blur-xl">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Colonne Commerce */}
                      <div>
                        <p className="mb-3 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Commerce
                        </p>
                        <div className="space-y-1">
                          {solutionsNav.commerce.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                            >
                              <item.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.color}`} />
                              <div>
                                <p className="text-sm font-medium text-white">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.tagline}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                      {/* Colonne Services */}
                      <div>
                        <p className="mb-3 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Services
                        </p>
                        <div className="space-y-1">
                          {solutionsNav.services.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                            >
                              <item.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.color}`} />
                              <div>
                                <p className="text-sm font-medium text-white">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.tagline}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                      {/* Colonne Industrie & Terrain */}
                      <div>
                        <p className="mb-3 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Industrie & Terrain
                        </p>
                        <div className="space-y-1">
                          {solutionsNav.metiers.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                            >
                              <item.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.color}`} />
                              <div>
                                <p className="text-sm font-medium text-white">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.tagline}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <Link
                        href="/solutions"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Découvrir toutes les solutions métier
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/tarifs"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                pathname === "/tarifs"
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tarifs
            </Link>

            {/* Solutions individuelles Dropdown (SECOND) */}
            <div
              className="relative"
              onMouseEnter={() => setModulesDropdown(true)}
              onMouseLeave={() => setModulesDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
              >
                <Layers className="h-4 w-4 text-indigo-400" />
                Solutions
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${modulesDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {modulesDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[320px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="mb-3 border-b border-white/10 px-3 pb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Solutions individuelles
                      </p>
                    </div>
                    <div className="space-y-1">
                      {modulesNav.map((mod) => (
                        <Link
                          key={mod.id}
                          href={mod.href}
                          className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                        >
                          <mod.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${mod.color}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{mod.name}</p>
                            <p className="text-xs text-slate-400">{mod.tagline}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <Link
                        href="/modules"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Voir toutes les solutions
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                pathname === "/contact"
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* CTA Desktop */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-sm font-medium text-fuchsia-400 transition-all hover:bg-fuchsia-500/20"
            >
              <Sparkles className="h-4 w-4" />
              Essai gratuit
            </Link>
            <a
              href={config.finance.login}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              <LogIn className="h-4 w-4" />
              Connexion
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="main-mobile-menu"
            className="mt-4 border-t border-white/10 pt-4 lg:hidden"
          >
            <nav className="flex flex-col gap-2">
              {/* Solutions métier Section Mobile (PREMIER) */}
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-400">
                  <Compass className="h-4 w-4" />
                  Solutions métier
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Commerce</p>
                    <div className="grid grid-cols-1 gap-2">
                      {solutionsNav.commerce.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                        >
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Services</p>
                    <div className="grid grid-cols-1 gap-2">
                      {solutionsNav.services.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                        >
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Industrie & Terrain</p>
                    <div className="grid grid-cols-1 gap-2">
                      {solutionsNav.metiers.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                        >
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  href="/solutions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-cyan-400"
                >
                  <ArrowRight className="h-4 w-4" />
                  Découvrir toutes les solutions métier
                </Link>
              </div>

              <Link
                href="/tarifs"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium ${pathname === "/tarifs" ? "bg-white/10 text-white" : "text-slate-300"}`}
              >
                Tarifs
              </Link>

              {/* Solutions individuelles Mobile (SECOND) */}
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-400">
                  <Layers className="h-4 w-4" />
                  Solutions individuelles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {modulesNav.map((mod) => (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                    >
                      <mod.icon className={`h-4 w-4 ${mod.color}`} />
                      {mod.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/modules"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-400"
                >
                  <ArrowRight className="h-4 w-4" />
                  Voir toutes les solutions
                </Link>
              </div>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium ${pathname === "/contact" ? "bg-white/10 text-white" : "text-slate-300"}`}
              >
                Contact
              </Link>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-sm font-medium text-fuchsia-400"
                >
                  <Sparkles className="h-4 w-4" />
                  Essai gratuit
                </Link>
                <a
                  href={config.finance.login}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-medium text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion
                </a>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
