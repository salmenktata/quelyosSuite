"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  UtensilsCrossed,
  ShoppingBag,
  Globe,
  Briefcase,
  Heart,
  Hammer,
  Building2,
  Users,
  ArrowRight,
  CheckCircle,
  Compass,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";

const secteurs = [
  {
    id: "restauration",
    name: "Restauration",
    tagline: "Restaurants, cafés, traiteurs",
    description: "Gérez vos commandes, stocks d'ingrédients, réservations et fidélité client. Parfait pour restaurants, cafés et traiteurs.",
    features: ["Gestion des commandes", "Stock ingrédients", "Réservations en ligne", "Programme fidélité"],
    icon: UtensilsCrossed,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/5",
    href: "/secteurs/restauration",
  },
  {
    id: "retail",
    name: "Retail",
    tagline: "Boutiques, commerces de détail",
    description: "Caisse tactile, gestion des stocks multi-magasins, promotions et analytics de ventes pour le commerce physique.",
    features: ["Caisse tactile", "Multi-magasins", "Promotions", "Analytics ventes"],
    icon: ShoppingBag,
    color: "pink",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/10 to-rose-500/5",
    href: "/secteurs/retail",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    tagline: "Vente en ligne, marketplaces",
    description: "Boutique en ligne complète, gestion des commandes, intégration paiements et livraison pour la vente digitale.",
    features: ["Boutique en ligne", "Gestion commandes", "Multi-paiements", "Suivi livraisons"],
    icon: Globe,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-500",
    bgGradient: "from-indigo-500/10 to-violet-500/5",
    href: "/secteurs/ecommerce",
  },
  {
    id: "services",
    name: "Services",
    tagline: "Consulting, agences, freelances",
    description: "Suivi projets, devis et facturation, gestion du temps et CRM client pour les prestataires de services.",
    features: ["Gestion projets", "Devis & Factures", "Suivi temps", "CRM intégré"],
    icon: Briefcase,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/5",
    href: "/secteurs/services",
  },
  {
    id: "sante",
    name: "Santé & Bien-être",
    tagline: "Cliniques, salons, coachs",
    description: "Prise de RDV en ligne, dossiers patients/clients, facturation et rappels SMS pour le secteur santé.",
    features: ["Agenda en ligne", "Dossiers clients", "Facturation actes", "Rappels SMS"],
    icon: Heart,
    color: "red",
    gradient: "from-red-500 to-pink-500",
    bgGradient: "from-red-500/10 to-pink-500/5",
    href: "/secteurs/sante",
  },
  {
    id: "btp",
    name: "BTP & Artisanat",
    tagline: "Construction, artisans",
    description: "Devis chantiers, suivi interventions, gestion matériaux et facturation pour les métiers du bâtiment.",
    features: ["Devis chantiers", "Suivi interventions", "Stock matériaux", "Facturation"],
    icon: Hammer,
    color: "amber",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-500/10 to-yellow-500/5",
    href: "/secteurs/btp",
  },
  {
    id: "hotellerie",
    name: "Hôtellerie",
    tagline: "Hôtels, gîtes, locations",
    description: "Réservations, planning chambres, facturation séjours et intégration OTAs pour l'hébergement touristique.",
    features: ["Réservations", "Planning chambres", "Check-in/out", "Channel manager"],
    icon: Building2,
    color: "cyan",
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-500/10 to-teal-500/5",
    href: "/secteurs/hotellerie",
  },
  {
    id: "associations",
    name: "Associations",
    tagline: "ONG, clubs, fondations",
    description: "Gestion des adhérents, cotisations, événements et communication pour les structures associatives.",
    features: ["Fichier adhérents", "Cotisations", "Événements", "Emails groupés"],
    icon: Users,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/10 to-emerald-500/5",
    href: "/secteurs/associations",
  },
];

const colorClasses: Record<string, { text: string; border: string; bg: string }> = {
  orange: { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500" },
  pink: { text: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500" },
  indigo: { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500" },
  blue: { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500" },
  red: { text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500" },
  amber: { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500" },
  cyan: { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500" },
  green: { text: "text-green-400", border: "border-green-500/30", bg: "bg-green-500" },
};

export default function SecteursPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
                <Compass className="h-4 w-4" />
                Solutions métier
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Une solution pour{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  chaque secteur
                </span>
              </h1>
              <p className="text-lg text-slate-400 sm:text-xl">
                Quelyos Suite s&apos;adapte à votre métier avec des fonctionnalités spécialisées
                et des workflows optimisés pour votre secteur d&apos;activité.
              </p>
            </m.div>
          </Container>
        </section>

        {/* Grille des secteurs */}
        <section className="py-16">
          <Container>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {secteurs.map((secteur, index) => {
                const colors = colorClasses[secteur.color];
                return (
                  <m.div
                    key={secteur.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={secteur.href}
                      className={`group flex h-full flex-col rounded-2xl border ${colors.border} bg-gradient-to-br ${secteur.bgGradient} p-6 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-${secteur.color}-500/10`}
                    >
                      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${secteur.gradient}`}>
                        <secteur.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-white">{secteur.name}</h3>
                      <p className={`mb-3 text-sm ${colors.text}`}>{secteur.tagline}</p>
                      <p className="mb-4 flex-grow text-sm text-slate-400">{secteur.description}</p>
                      <div className="space-y-2">
                        {secteur.features.slice(0, 3).map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle className={`h-4 w-4 ${colors.text}`} />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${colors.text} group-hover:gap-3 transition-all`}>
                        Découvrir
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 text-center sm:p-12"
            >
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-fuchsia-400" />
              <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                Votre secteur n&apos;est pas listé ?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-slate-400">
                Quelyos Suite est modulaire et s&apos;adapte à tous les métiers.
                Contactez-nous pour découvrir comment nous pouvons répondre à vos besoins spécifiques.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                >
                  Nous contacter
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-6 py-3 font-medium text-fuchsia-400 transition-all hover:bg-fuchsia-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Essai gratuit
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
