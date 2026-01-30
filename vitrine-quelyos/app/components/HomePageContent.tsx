"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Wallet,
  Store,
  UserCircle,
  Boxes,
  UsersRound,
  Monitor,
  Megaphone,
  ArrowRight,
  Sparkles,
  Shield,
  Server,
  Layers,
  RefreshCw,
  Code,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import Footer from "./Footer";
import Container from "./Container";
import Header from "./Header";

const modules = [
  {
    id: "home",
    name: "Dashboard",
    tagline: "Vue unifiée",
    description: "Tableau de bord consolidé avec KPIs temps réel de tous vos modules.",
    features: ["KPIs consolidés", "Alertes", "Raccourcis", "Analytics global"],
    status: "production",
    color: "slate",
    icon: LayoutDashboard,
    href: "/modules",
  },
  {
    id: "finance",
    name: "Finance",
    tagline: "Trésorerie & Prévisions IA 90j",
    description: "Pilotez votre trésorerie avec l'IA. Précision 85-90% sur 90 jours.",
    features: ["Prévisions IA 85-90%", "Multi-comptes", "Rapports PDF", "Export FEC"],
    status: "production",
    color: "emerald",
    icon: Wallet,
    href: "/finance",
  },
  {
    id: "store",
    name: "Boutique",
    tagline: "E-commerce omnicanal",
    description: "Catalogue, commandes, promotions. Synchronisation Stock automatique.",
    features: ["Catalogue produits", "Commandes", "Promotions", "Sync Stock auto"],
    status: "production",
    color: "indigo",
    icon: Store,
    href: "/ecommerce",
  },
  {
    id: "crm",
    name: "CRM",
    tagline: "Pipeline & Facturation",
    description: "Pipeline ventes, fiches 360°, devis → factures en un clic.",
    features: ["Pipeline ventes", "Fiches 360°", "Devis → Factures", "Sync Finance"],
    status: "production",
    color: "violet",
    icon: UserCircle,
    href: "/crm",
  },
  {
    id: "stock",
    name: "Stock",
    tagline: "Multi-entrepôts temps réel",
    description: "Gestion multi-sites, alertes seuils, valorisation FIFO/LIFO.",
    features: ["Multi-sites", "Alertes stock", "Valorisation", "Scan codes-barres"],
    status: "production",
    color: "orange",
    icon: Boxes,
    href: "/stock",
  },
  {
    id: "hr",
    name: "RH",
    tagline: "SIRH complet",
    description: "Gestion employés, congés, pointage, évaluations annuelles.",
    features: ["Employés", "Congés", "Pointage", "Évaluations"],
    status: "production",
    color: "cyan",
    icon: UsersRound,
    href: "/hr",
  },
  {
    id: "pos",
    name: "Point de Vente",
    tagline: "Caisse moderne",
    description: "Terminal tactile, Click & Collect, mode rush, écran cuisine.",
    features: ["Terminal tactile", "Click & Collect", "Mode Rush", "Écran cuisine"],
    status: "production",
    color: "teal",
    icon: Monitor,
    href: "/pos",
  },
  {
    id: "marketing",
    name: "Marketing",
    tagline: "Email & SMS",
    description: "Campagnes multicanal, templates, segmentation audiences.",
    features: ["Campagnes", "Templates", "Audiences", "Analytics"],
    status: "production",
    color: "pink",
    icon: Megaphone,
    href: "/marketing",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  slate: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30", gradient: "from-slate-500 to-slate-600" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", gradient: "from-emerald-500 to-emerald-600" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30", gradient: "from-indigo-500 to-indigo-600" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30", gradient: "from-violet-500 to-violet-600" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", gradient: "from-orange-500 to-orange-600" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", gradient: "from-cyan-500 to-cyan-600" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30", gradient: "from-teal-500 to-teal-600" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30", gradient: "from-pink-500 to-pink-600" },
};

const secteurs = [
  { emoji: "🏪", name: "Commerce & Retail", desc: "Boutiques, e-commerce, click & collect", modules: ["Boutique", "Stock", "POS", "CRM"] },
  { emoji: "🍽️", name: "Restauration", desc: "Restaurants, traiteurs, food trucks", modules: ["POS", "Stock", "Finance", "Marketing"] },
  { emoji: "🔧", name: "Services B2B", desc: "Agences, conseil, prestataires", modules: ["CRM", "Finance", "Marketing", "RH"] },
  { emoji: "🏭", name: "Artisans & Production", desc: "Ateliers, fabrication, BTP", modules: ["Stock", "CRM", "Finance", "RH"] },
];

export default function HomePageContent() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-32">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
                <MapPin className="h-4 w-4" />
                Suite ERP française • 8 modules intégrés
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                Pilotez toute votre entreprise{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  depuis une seule plateforme
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
                IA intégrée pour vos prévisions, données synchronisées entre modules.
                Finance, Commerce, CRM, Stock, RH, POS, Marketing — tout en un.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  8 modules
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  +250 fonctionnalités
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Code className="h-4 w-4 text-emerald-400" />
                  API REST complète
                </span>
              </div>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
                >
                  Essai gratuit 30 jours
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
                >
                  Voir les tarifs
                </Link>
              </div>
            </m.div>
          </Container>
        </section>

        {/* Modules */}
        <section id="modules" className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                8 modules intégrés, données synchronisées
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Une vente = stock mis à jour + revenu Finance + fiche client enrichie. Automatique.
              </p>
            </m.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {modules.map((mod, index) => {
                const colors = colorClasses[mod.color];
                return (
                  <m.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative overflow-hidden rounded-xl border ${colors.border} bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-opacity-70 hover:shadow-lg`}
                  >
                    <div className="relative">
                      <div className={`mb-4 inline-flex rounded-xl ${colors.bg} p-3`}>
                        <mod.icon className={`h-8 w-8 ${colors.text}`} />
                      </div>
                      <h3 className="mb-1 text-xl font-bold text-white">
                        {mod.name}
                      </h3>
                      <p className={`mb-3 text-sm font-medium ${colors.text}`}>
                        {mod.tagline}
                      </p>
                      <p className="mb-4 text-sm text-slate-400">
                        {mod.description}
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {mod.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <Link
                          href={mod.href}
                          className={`inline-flex items-center gap-1 text-sm font-medium ${colors.text} transition-all hover:underline`}
                        >
                          En savoir plus
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`h-2 w-2 rounded-full ${mod.status === "production" ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`} />
                          {mod.status === "production" ? "Disponible" : "Beta"}
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Différenciateurs */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ce qui nous différencie
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Une suite pensée pour les TPE/PME françaises
              </p>
            </m.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Layers, title: "8 modules = 1 abonnement", desc: "Finance, Vente, Stock, CRM, RH, POS, Marketing — tout inclus sans frais cachés.", color: "text-indigo-400" },
                { icon: Sparkles, title: "IA intégrée", desc: "Prévisions trésorerie 90j, détection anomalies, scoring leads. Machine Learning natif.", color: "text-purple-400" },
                { icon: RefreshCw, title: "Données synchronisées", desc: "Une vente = stock mis à jour + revenu en Finance + fiche client enrichie. Automatique.", color: "text-emerald-400" },
                { icon: Shield, title: "Made in France", desc: "Hébergement France, RGPD natif, support francophone. Pas de transfert US.", color: "text-blue-400" },
                { icon: Code, title: "API REST complète", desc: "Intégrez Quelyos à vos outils. Export illimité, vos données vous appartiennent.", color: "text-cyan-400" },
                { icon: Server, title: "SaaS multi-tenant", desc: "Zéro maintenance, mises à jour auto, accessible partout. Instance dédiée isolée.", color: "text-orange-400" },
              ].map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm"
                >
                  <item.icon className={`mb-4 h-8 w-8 ${item.color}`} />
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Secteurs d'activité */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Adapté à votre secteur
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Des modules recommandés selon votre activité
              </p>
            </m.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {secteurs.map((secteur, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:bg-slate-900/70"
                >
                  <span className="mb-3 block text-4xl">{secteur.emoji}</span>
                  <h3 className="mb-1 text-lg font-semibold text-white">{secteur.name}</h3>
                  <p className="mb-4 text-sm text-slate-400">{secteur.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {secteur.modules.map((mod) => (
                      <span
                        key={mod}
                        className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Stats */}
        <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
          <Container>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { label: "Modules intégrés", value: "8", icon: Layers },
                { label: "Fonctionnalités", value: "+250", icon: Sparkles },
                { label: "Prévisions IA", value: "90j", icon: RefreshCw },
                { label: "Hébergement", value: "France", icon: MapPin },
              ].map((stat, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA final */}
        <section className="relative py-20">
          <Container narrow>
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <Sparkles className="mx-auto mb-6 h-12 w-12 text-indigo-400" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Simplifiez votre gestion dès aujourd&apos;hui
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                30 jours d&apos;essai gratuit, sans engagement. Toutes les fonctionnalités incluses.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                >
                  Essai gratuit 30 jours
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
                >
                  Voir les tarifs
                </Link>
              </div>
            </m.div>
          </Container>
        </section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
