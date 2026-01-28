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
  Mail,
  Zap,
  Shield,
  Users,
  Server,
  Database,
  Layers,
} from "lucide-react";
import Footer from "./Footer";
import Container from "./Container";
import Header from "./Header";

const modules = [
  {
    id: "finance",
    name: "Finance",
    tagline: "Trésorerie & Prévisions IA",
    description: "Pilotez votre trésorerie à 90 jours avec l'IA. Budgets, reporting, multi-comptes.",
    features: ["Prévisions IA", "Budgets", "Rapports PDF", "Multi-comptes"],
    status: "production",
    color: "emerald",
    icon: Wallet,
    href: "/finance",
  },
  {
    id: "store",
    name: "Boutique",
    tagline: "E-commerce complet",
    description: "Gérez votre catalogue, commandes, promotions et avis clients.",
    features: ["Catalogue produits", "Commandes", "Promos", "Avis clients"],
    status: "production",
    color: "indigo",
    icon: Store,
    href: "/ecommerce",
  },
  {
    id: "crm",
    name: "CRM",
    tagline: "Clients & Pipeline",
    description: "Suivez vos opportunités, gérez vos clients, facturez simplement.",
    features: ["Pipeline ventes", "Fiches clients", "Facturation", "Paiements"],
    status: "production",
    color: "violet",
    icon: UserCircle,
    href: "/crm",
  },
  {
    id: "stock",
    name: "Stock",
    tagline: "Inventaire multi-sites",
    description: "Mouvements, transferts, réapprovisionnement automatique.",
    features: ["Multi-entrepôts", "Mouvements", "Valorisation", "Alertes"],
    status: "production",
    color: "orange",
    icon: Boxes,
    href: "/stock",
  },
  {
    id: "hr",
    name: "RH",
    tagline: "Gestion du personnel",
    description: "Employés, contrats, congés, présences, évaluations.",
    features: ["Employés", "Congés", "Présences", "Évaluations"],
    status: "production",
    color: "cyan",
    icon: UsersRound,
    href: "/hr",
  },
  {
    id: "pos",
    name: "Point de Vente",
    tagline: "Caisse & Click & Collect",
    description: "Terminal de caisse moderne, mode rush, écran cuisine.",
    features: ["Terminal", "Click & Collect", "Sessions", "Analytics"],
    status: "production",
    color: "teal",
    icon: Monitor,
    href: "/pos",
  },
  {
    id: "marketing",
    name: "Marketing",
    tagline: "Campagnes Email & SMS",
    description: "Créez et envoyez vos campagnes marketing facilement.",
    features: ["Email", "SMS", "Templates", "Audiences"],
    status: "beta",
    color: "pink",
    icon: Megaphone,
    href: "/marketing",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", gradient: "from-emerald-500 to-emerald-600" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30", gradient: "from-indigo-500 to-indigo-600" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30", gradient: "from-violet-500 to-violet-600" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", gradient: "from-orange-500 to-orange-600" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", gradient: "from-cyan-500 to-cyan-600" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30", gradient: "from-teal-500 to-teal-600" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30", gradient: "from-pink-500 to-pink-600" },
};

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
                <Sparkles className="h-4 w-4" />
                Suite ERP complète pour PME
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                L&apos;ERP moderne qui{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  simplifie votre gestion
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
                Finance, Commerce, CRM, Stock, RH, Point de vente — tous vos outils
                métier réunis en une seule plateforme. Conçu en France. Pensé pour les PME.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="#modules"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
                >
                  <Layers className="h-5 w-5" />
                  Découvrir les modules
                </Link>
                <Link
                  href="/finance/register"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
                >
                  Essai gratuit
                  <ArrowRight className="h-5 w-5" />
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
                Tous vos outils métier en un seul endroit
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                7 modules intégrés pour gérer l&apos;ensemble de votre activité
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

        {/* Pourquoi Quelyos */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Pourquoi choisir Quelyos ?
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Une suite pensée pour les TPE/PME qui veulent se concentrer sur leur métier
              </p>
            </m.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Layers, title: "Tout-en-un", desc: "Un seul outil au lieu de 5 abonnements séparés. Finance, vente, stock, RH, marketing.", color: "text-indigo-400" },
                { icon: Zap, title: "Simple & rapide", desc: "Prise en main en 10 minutes, pas besoin de formation. Interface moderne.", color: "text-yellow-400" },
                { icon: Shield, title: "Données sécurisées", desc: "Hébergement France, RGPD compliant, chiffrement bout-en-bout.", color: "text-emerald-400" },
                { icon: Database, title: "Open Data", desc: "Vos données vous appartiennent. API REST ouverte, export illimité.", color: "text-cyan-400" },
                { icon: Users, title: "Support humain", desc: "Accompagnement personnalisé pour chaque client. Pas de chatbot.", color: "text-blue-400" },
                { icon: Server, title: "Multi-tenant SaaS", desc: "Architecture moderne, mises à jour automatiques, zéro maintenance.", color: "text-purple-400" },
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

        {/* Stats */}
        <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
          <Container>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { label: "Modules intégrés", value: "8", icon: Layers },
                { label: "Fonctionnalités", value: "+200", icon: Sparkles },
                { label: "API REST", value: "100%", icon: Server },
                { label: "Multi-tenant", value: "SaaS", icon: Database },
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

        {/* CTA Contact */}
        <section className="relative py-20">
          <Container narrow>
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <Mail className="mx-auto mb-6 h-12 w-12 text-indigo-400" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Prêt à simplifier votre gestion ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Contactez-nous pour une démo gratuite ou commencez directement avec l&apos;essai gratuit.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                >
                  <Mail className="h-5 w-5" />
                  Nous contacter
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
