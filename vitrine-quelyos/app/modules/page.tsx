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
  Wrench,
  ArrowRight,
  CheckCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

const modules = [
  {
    id: "finance",
    name: "Finance",
    tagline: "Trésorerie & Prévisions IA",
    description: "Pilotez votre trésorerie à 90 jours avec l'IA. Budgets, reporting, rapports PDF, multi-comptes bancaires.",
    features: ["Prévisions IA à 85-90%", "Dashboard temps réel", "Budgets & alertes", "Import bancaire auto"],
    icon: Wallet,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-500/10 to-emerald-600/5",
    href: "/finance",
    status: "production",
  },
  {
    id: "store",
    name: "Boutique",
    tagline: "E-commerce complet",
    description: "Gérez votre catalogue produits, commandes, promotions et avis clients. Vente en ligne moderne.",
    features: ["Catalogue produits", "Gestion commandes", "Promotions", "Avis clients"],
    icon: Store,
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
    bgGradient: "from-indigo-500/10 to-indigo-600/5",
    href: "/ecommerce",
    status: "production",
  },
  {
    id: "crm",
    name: "CRM",
    tagline: "Clients & Pipeline",
    description: "Suivez vos opportunités commerciales, gérez vos clients et automatisez la facturation.",
    features: ["Pipeline ventes", "Fiches clients 360°", "Devis & Factures", "Historique échanges"],
    icon: UserCircle,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-500/10 to-purple-600/5",
    href: "/crm",
    status: "production",
  },
  {
    id: "stock",
    name: "Stock",
    tagline: "Inventaire multi-sites",
    description: "Mouvements, transferts inter-entrepôts, valorisation et réapprovisionnement automatique.",
    features: ["Multi-entrepôts", "Alertes stock", "Valorisation FIFO/LIFO", "Scan codes-barres"],
    icon: Boxes,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/5",
    href: "/stock",
    status: "production",
  },
  {
    id: "hr",
    name: "RH",
    tagline: "Gestion du personnel",
    description: "Employés, contrats, congés, présences et évaluations. Un SIRH complet pour les PME.",
    features: ["Fiches employés", "Congés & absences", "Pointage digital", "Évaluations"],
    icon: UsersRound,
    color: "cyan",
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-500/10 to-teal-500/5",
    href: "/hr",
    status: "production",
  },
  {
    id: "pos",
    name: "Point de Vente",
    tagline: "Caisse & Click & Collect",
    description: "Terminal de caisse moderne, mode rush, écran cuisine. Pour le commerce physique et la restauration.",
    features: ["Caisse tactile", "Click & Collect", "Mode hors-ligne", "Analytics ventes"],
    icon: Monitor,
    color: "teal",
    gradient: "from-teal-500 to-emerald-500",
    bgGradient: "from-teal-500/10 to-emerald-500/5",
    href: "/pos",
    status: "production",
  },
  {
    id: "marketing",
    name: "Marketing",
    tagline: "Campagnes Email & SMS",
    description: "Créez et envoyez vos campagnes marketing. Templates, segmentation et analytics.",
    features: ["Campagnes email", "SMS marketing", "Templates pro", "Audiences auto"],
    icon: Megaphone,
    color: "pink",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/10 to-rose-500/5",
    href: "/marketing",
    status: "production",
  },
  {
    id: "gmao",
    name: "GMAO",
    tagline: "Maintenance & Équipements",
    description: "Planifiez et suivez la maintenance de vos équipements. Interventions préventives, curatives et prédictives.",
    features: ["Suivi équipements", "Maintenance préventive", "Ordres de travail", "Historique interventions"],
    icon: Wrench,
    color: "slate",
    gradient: "from-slate-500 to-slate-600",
    bgGradient: "from-slate-500/10 to-slate-600/5",
    href: "/gmao",
    status: "production",
  },
];

const colorClasses: Record<string, { text: string; border: string; bg: string }> = {
  emerald: { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500" },
  indigo: { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500" },
  violet: { text: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500" },
  orange: { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500" },
  cyan: { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500" },
  teal: { text: "text-teal-400", border: "border-teal-500/30", bg: "bg-teal-500" },
  pink: { text: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500" },
  slate: { text: "text-slate-400", border: "border-slate-500/30", bg: "bg-slate-500" },
};

export default function ModulesPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
                <Layers className="h-4 w-4" />
                Solutions intégrées
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl">
                Toutes les solutions de la{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Suite Quelyos
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Finance, Commerce, CRM, Stock, RH, Point de Vente, Marketing, GMAO — une plateforme unifiée pour piloter toute votre entreprise.
              </p>
            </m.div>
          </Container>
        </section>

        {/* Modules Grid */}
        <section className="relative py-12">
          <Container>
            <div className="grid gap-8 md:grid-cols-2">
              {modules.map((mod, index) => {
                const colors = colorClasses[mod.color];
                return (
                  <m.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${mod.bgGradient} p-8 backdrop-blur-sm transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`rounded-xl bg-gradient-to-br ${mod.gradient} p-3`}>
                        <mod.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${mod.status === "production" ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`} />
                        <span className="text-xs text-slate-400">
                          {mod.status === "production" ? "Disponible" : "Beta"}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{mod.name}</h2>
                    <p className={`text-sm font-medium ${colors.text} mb-4`}>{mod.tagline}</p>
                    <p className="text-slate-400 mb-6">{mod.description}</p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {mod.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${colors.text}`} />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={mod.href}
                      className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${mod.gradient} px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90`}
                    >
                      Découvrir {mod.name}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Pricing CTA */}
        <section className="relative py-20">
          <Container narrow>
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Un prix, toutes les solutions
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                À partir de 9€/mois avec 1 module au choix inclus. Ajoutez les modules dont vous avez besoin, quand vous en avez besoin.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                >
                  Voir les tarifs
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
                >
                  <Sparkles className="h-5 w-5" />
                  Essai gratuit 30 jours
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
