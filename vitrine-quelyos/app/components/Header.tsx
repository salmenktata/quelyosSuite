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
  Target,
  FileText,
  Code,
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
  Calendar,
} from "lucide-react";
import config from "../lib/config";
import Container from "./Container";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [financeDropdown, setFinanceDropdown] = useState(false);
  const [marketingDropdown, setMarketingDropdown] = useState(false);
  const [ecommerceDropdown, setEcommerceDropdown] = useState(false);

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
        {
          href: "/finance/backlog-technique",
          label: "Backlog Technique",
          icon: Code,
          desc: "Roadmap tech",
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
          href: "/finance/strategie",
          label: "Stratégie",
          icon: Target,
          desc: "Vision produit",
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
        {
          href: "/marketing/backlog-technique",
          label: "Backlog Technique",
          icon: Code,
          desc: "Roadmap tech",
        },
      ],
    },
    // ENTREPRISE
    {
      category: "Entreprise",
      items: [
        {
          href: "/marketing/strategie",
          label: "Stratégie",
          icon: Target,
          desc: "Notre vision",
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
            <Link
              href="/"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                pathname === "/"
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              Accueil
            </Link>

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

            {/* Marketing Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMarketingDropdown(true)}
              onMouseLeave={() => setMarketingDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  pathname.startsWith("/marketing")
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                Marketing
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${marketingDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {marketingDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[500px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="mb-3 border-b border-white/10 px-3 pb-2">
                      <Link
                        href="/marketing"
                        className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
                      >
                        <Image
                          src="/logos/icon-marketing.svg"
                          alt=""
                          width={20}
                          height={20}
                        />
                        Quelyos Marketing
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {marketingPages.map((section) => (
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
                                  <page.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-400" />
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
                    <div className="mt-3 border-t border-white/10 pt-2">
                      <span className="px-3 text-xs text-slate-500">
                        📌 MVP en développement • Lancement Q1 2026
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* E-Commerce Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setEcommerceDropdown(true)}
              onMouseLeave={() => setEcommerceDropdown(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  pathname.startsWith("/ecommerce")
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ShoppingCart className="h-4 w-4 text-amber-400" />
                E-Commerce
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${ecommerceDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {ecommerceDropdown && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[280px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl">
                    <div className="mb-3 border-b border-white/10 px-3 pb-2">
                      <Link
                        href="/ecommerce"
                        className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Quelyos E-Commerce
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/ecommerce"
                        className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Présentation</p>
                          <p className="text-xs text-slate-400">Vue d&apos;ensemble</p>
                        </div>
                      </Link>
                      <Link
                        href="/ecommerce/pricing"
                        className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Tarifs</p>
                          <p className="text-xs text-slate-400">Plans & pricing</p>
                        </div>
                      </Link>
                      <Link
                        href="/ecommerce/signup"
                        className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Créer ma boutique</p>
                          <p className="text-xs text-slate-400">14 jours gratuits</p>
                        </div>
                      </Link>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <Link
                        href="/ecommerce/signup?plan=pro"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-400"
                      >
                        <Zap className="h-4 w-4" />
                        Essai gratuit
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

          {/* CTA Desktop - Boutons Login */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={config.finance.login}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
            >
              <LogIn className="h-4 w-4" />
              Connexion Finance
            </a>
            <a
              href={config.marketing.login}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-orange-600 hover:to-amber-600"
            >
              <LogIn className="h-4 w-4" />
              Connexion Marketing
            </a>
            <a
              href={config.superadmin.login}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/50 bg-slate-800/50 text-slate-400 transition-all hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
              title="Super Admin"
            >
              <Shield className="h-4 w-4" />
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
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium ${pathname === "/" ? "bg-white/10 text-white" : "text-slate-300"}`}
              >
                Accueil
              </Link>

              {/* Finance Section Mobile */}
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <Image
                    src="/logos/icon-finance.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                  Finance
                </p>
                <div className="flex flex-col gap-3">
                  {financePages.slice(0, 3).map((section) => (
                    <div key={section.category}>
                      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {section.category}
                      </p>
                      <div className="flex flex-col gap-1 pl-6">
                        {section.items.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm text-slate-300 hover:text-white"
                          >
                            {page.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/finance"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    → Voir tout
                  </Link>
                </div>
              </div>

              {/* Marketing Section Mobile */}
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-400">
                  <Image
                    src="/logos/icon-marketing.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                  Marketing
                </p>
                <div className="flex flex-col gap-3">
                  {marketingPages.slice(0, 2).map((section) => (
                    <div key={section.category}>
                      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {section.category}
                      </p>
                      <div className="flex flex-col gap-1 pl-6">
                        {section.items.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm text-slate-300 hover:text-white"
                          >
                            {page.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/marketing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 text-xs text-orange-400 hover:text-orange-300"
                  >
                    → Voir tout
                  </Link>
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

              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={config.finance.login}
                  className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion Finance
                </a>
                <a
                  href={config.marketing.login}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-medium text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion Marketing
                </a>
                <a
                  href={config.superadmin.login}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-600/50 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-400"
                >
                  <Shield className="h-3 w-3" />
                  Super Admin
                </a>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
