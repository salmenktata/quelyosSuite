"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BarChart3,
  FileText,
  Megaphone,
  Sparkles,
  LogIn,
  Briefcase,
  ShoppingCart,
  Users,
  Zap,
  DollarSign,
  MessageCircle,
  Book,
  TrendingUp,
  Building2,
  GraduationCap,
  Mail,
  Shield,
  Info,
  Wallet,
  Store,
  UserCircle,
  Boxes,
  UsersRound,
  Monitor,
  Layers,
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
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modulesDropdown, setModulesDropdown] = useState(false);
  const [financeDropdown, setFinanceDropdown] = useState(false);

  // Menu Finance - organisé par catégories
  const financePages = [
    // PRODUIT
    {
      category: "Produit",
      items: [
        {
          href: "/finance",
          label: "Présentation",
          icon: BarChart3,
          desc: "Vue d'ensemble",
        },
        {
          href: "/finance/features",
          label: "Fonctionnalités",
          icon: Zap,
          desc: "Toutes les features",
        },
        {
          href: "/finance/templates",
          label: "Templates Métiers",
          icon: Briefcase,
          desc: "Agences, Cabinets, Startups",
        },
      ],
    },
    // SOLUTIONS
    {
      category: "Solutions",
      items: [
        {
          href: "/finance/tpe",
          label: "Guide TPE",
          icon: GraduationCap,
          desc: "Pour les TPE",
        },
        {
          href: "/finance/compare",
          label: "Comparaison",
          icon: TrendingUp,
          desc: "vs Alternatives",
        },
      ],
    },
    // TARIFS & CLIENTS
    {
      category: "Tarifs & Clients",
      items: [
        {
          href: "/finance/pricing",
          label: "Tarifs",
          icon: DollarSign,
          desc: "Plans & pricing",
        },
        {
          href: "/finance/customers",
          label: "Témoignages",
          icon: Users,
          desc: "Retours clients",
        },
      ],
    },
    // DÉVELOPPEMENT
    {
      category: "Développement",
      items: [
        {
          href: "/finance/backlog",
          label: "Backlog Produit",
          icon: FileText,
          desc: "Features à venir",
        },
      ],
    },
    // RESSOURCES
    {
      category: "Ressources",
      items: [
        {
          href: "/finance/docs",
          label: "Documentation",
          icon: Book,
          desc: "Guides & tutoriels",
        },
        {
          href: "/finance/faq",
          label: "FAQ",
          icon: MessageCircle,
          desc: "Questions fréquentes",
        },
      ],
    },
    // ENTREPRISE
    {
      category: "Entreprise",
      items: [
        {
          href: "/finance/about",
          label: "À propos",
          icon: Building2,
          desc: "Notre mission",
        },
        {
          href: "/finance/roadmap",
          label: "Roadmap 2026",
          icon: TrendingUp,
          desc: "Vision & expansion",
        },
      ],
    },
  ];

  // Menu Marketing - organisé par catégories
  const marketingPages = [
    // PRODUIT
    {
      category: "Produit",
      items: [
        {
          href: "/marketing",
          label: "Présentation",
          icon: Megaphone,
          desc: "Vue d'ensemble",
        },
        {
          href: "/marketing/features",
          label: "Fonctionnalités",
          icon: Sparkles,
          desc: "Automatisation IA",
        },
      ],
    },
    // TARIFS & CLIENTS
    {
      category: "Tarifs & Clients",
      items: [
        {
          href: "/marketing/tarifs",
          label: "Tarifs",
          icon: DollarSign,
          desc: "Plans et pricing",
        },
        {
          href: "/marketing/contact",
          label: "Contact",
          icon: Mail,
          desc: "Nous contacter",
        },
      ],
    },
    // DÉVELOPPEMENT
    {
      category: "Développement",
      items: [
        {
          href: "/marketing/roadmap",
          label: "Roadmap 2026",
          icon: TrendingUp,
          desc: "Vision & expansion",
        },
        {
          href: "/marketing/backlog",
          label: "Backlog Produit",
          icon: FileText,
          desc: "Features à venir",
        },
      ],
    },
    // LÉGAL
    {
      category: "Légal",
      items: [
        {
          href: "/marketing/cgu",
          label: "CGU",
          icon: FileText,
          desc: "Conditions générales",
        },
        {
          href: "/marketing/confidentialite",
          label: "Confidentialité",
          icon: Shield,
          desc: "Politique RGPD",
        },
        {
          href: "/marketing/mentions-legales",
          label: "Mentions légales",
          icon: Info,
          desc: "Informations légales",
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <Container className="py-4">
        <div className="flex items-center justify-between">
          {/* Logo avec SVG */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logos/icon-suite.svg"
              alt="Quelyos Suite"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">Quelyos</h1>
              <p className="text-xs text-slate-400">Suite TPE/PME</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {/* Modules Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setModulesDropdown(true)}
              onMouseLeave={() => setModulesDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
              >
                <Layers className="h-4 w-4 text-indigo-400" />
                Modules
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${modulesDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {modulesDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[320px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="mb-3 border-b border-white/10 px-3 pb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Suite ERP complète
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
                  </div>
                </div>
              )}
            </div>

            {/* Finance Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setFinanceDropdown(true)}
              onMouseLeave={() => setFinanceDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  pathname.startsWith("/finance")
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                Finance
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${financeDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {financeDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[600px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="mb-3 border-b border-white/10 px-3 pb-2">
                      <Link
                        href="/finance"
                        className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        <Image
                          src="/logos/icon-finance.svg"
                          alt=""
                          width={20}
                          height={20}
                        />
                        Quelyos Finance
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {financePages.map((section, sectionIdx) => (
                        <div key={section.category}>
                          <div className="mb-2 px-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              {section.category}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {section.items.map((page) => {
                              const isExternal = "external" in page && page.external;
                              const LinkComponent = isExternal ? "a" : Link;
                              return (
                                <LinkComponent
                                  key={page.href}
                                  href={page.href}
                                  {...(isExternal
                                    ? { target: "_blank", rel: "noopener noreferrer" }
                                    : {})}
                                  className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                                >
                                  <page.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {page.label}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {page.desc}
                                    </p>
                                  </div>
                                </LinkComponent>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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

          {/* CTA Desktop - Bouton Connexion unique */}
          <div className="hidden items-center gap-3 lg:flex">
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
              {/* Modules Section Mobile */}
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-400">
                  <Layers className="h-4 w-4" />
                  Modules ERP
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
              </div>

              <Link
                href="/tarifs"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium ${pathname === "/tarifs" ? "bg-white/10 text-white" : "text-slate-300"}`}
              >
                Tarifs
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium ${pathname === "/contact" ? "bg-white/10 text-white" : "text-slate-300"}`}
              >
                Contact
              </Link>

              <div className="mt-4">
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
