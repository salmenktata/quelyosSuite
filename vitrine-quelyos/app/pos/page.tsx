"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Monitor,
  ArrowRight,
  CreditCard,
  ShoppingBag,
  Zap,
  CheckCircle,
  Sparkles,
  BarChart3,
  Utensils,
  TrendingUp,
  Target,
  Wifi,
  Building2,
  Croissant,
  Shirt,
  Truck,
  ScanLine,
  Receipt,
  PieChart,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function POSPage() {
  const stats = [
    { value: "300+", label: "caisses actives", icon: Monitor },
    { value: "< 2s", label: "encaissement", icon: Zap },
    { value: "Offline", label: "mode disponible", icon: Wifi },
    { value: "+25%", label: "CA moyen", icon: TrendingUp },
  ];

  const features = [
    {
      icon: Monitor,
      title: "Terminal de caisse",
      description:
        "Interface tactile optimisée pour la vente rapide. Mode plein écran, raccourcis produits, recherche instantanée.",
    },
    {
      icon: CreditCard,
      title: "Paiements multiples",
      description:
        "Espèces, CB, tickets restaurant, paiement fractionné. Intégration terminaux de paiement.",
    },
    {
      icon: ShoppingBag,
      title: "Click & Collect",
      description:
        "Commandes en ligne préparées en boutique. Notification client, gestion des créneaux.",
    },
    {
      icon: Zap,
      title: "Mode Rush",
      description:
        "Interface simplifiée pour les pics d&apos;affluence. Encaissement ultra-rapide.",
    },
    {
      icon: Utensils,
      title: "Écran cuisine",
      description:
        "Affichage des commandes en préparation pour la restauration. Validation à chaque étape.",
    },
    {
      icon: BarChart3,
      title: "Analytics temps réel",
      description:
        "CA du jour, panier moyen, produits stars, performance par vendeur.",
    },
  ];

  const useCases = [
    {
      sector: "Restaurant",
      icon: Utensils,
      before: "Caisse lente, erreurs de commande, pas de stats...",
      after: "Écran cuisine, encaissement 2s. Erreurs -70%",
      color: "from-teal-500 to-emerald-500",
    },
    {
      sector: "Boulangerie",
      icon: Croissant,
      before: "File d&apos;attente longue, pas de suivi produits...",
      after: "Mode rush, raccourcis produit. File -50%",
      color: "from-emerald-500 to-green-500",
    },
    {
      sector: "Boutique mode",
      icon: Shirt,
      before: "Stock non synchronisé, pas de fidélité...",
      after: "Sync stock temps réel, carte fidélité intégrée. Rétention +30%",
      color: "from-cyan-500 to-teal-500",
    },
    {
      sector: "Food truck",
      icon: Truck,
      before: "Caisse mobile galère, pas de CB, aucun reporting...",
      after: "Mode offline, CB mobile, stats journalières. CA +25%",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Scan / Sélection",
      description:
        "Scannez le code-barres ou sélectionnez le produit via l&apos;interface tactile rapide.",
      icon: ScanLine,
    },
    {
      step: "2",
      title: "Encaissement",
      description:
        "CB, espèces, titres restaurant, paiement mixte. Validation en 2 secondes.",
      icon: CreditCard,
    },
    {
      step: "3",
      title: "Ticket",
      description:
        "Ticket imprimé ou envoyé par email. Personnalisable avec votre logo et vos promos.",
      icon: Receipt,
    },
    {
      step: "4",
      title: "Analytics",
      description:
        "CA temps réel, panier moyen, best-sellers. Données exploitables immédiatement.",
      icon: PieChart,
    },
  ];

  const roadmapItems = [
    {
      phase: "V1 - Disponible",
      status: "done",
      items: [
        "Terminal de caisse tactile",
        "Paiements multiples",
        "Écran cuisine",
        "Mode offline",
      ],
    },
    {
      phase: "V1.5 - Q1 2026",
      status: "current",
      items: [
        "Programme fidélité",
        "Click & Collect avancé",
        "Analytics vendeurs",
        "Tickets personnalisables",
      ],
    },
    {
      phase: "V2 - Q2 2026",
      status: "upcoming",
      items: [
        "Multi-caisse avancé",
        "Gestion des tables",
        "Intégration livreurs",
        "Promotions dynamiques",
      ],
    },
    {
      phase: "V3 - 2027",
      status: "future",
      items: [
        "Self-checkout",
        "Borne de commande",
        "IA recommandations",
        "App mobile client",
      ],
    },
  ];

  const benefits = [
    "Synchronisation Stock",
    "Sessions de caisse",
    "Tickets personnalisables",
    "Mode hors-ligne",
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/30 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-emerald-500/20 blur-3xl [animation-delay:2s]" />
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-green-500/10 blur-3xl [animation-delay:4s]" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-300 backdrop-blur-sm">
                <Monitor className="h-4 w-4" />
                Module Point de Vente
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Quelyos POS
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Une caisse moderne pour le commerce physique et la restauration.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
                Terminal tactile, Click & Collect, écran cuisine. Tout pour encaisser vite
                et bien, en boutique comme en restaurant.
              </p>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Essai gratuit 30 jours
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  NF525 compatible
                </span>
              </div>

              {/* Stats rapides */}
              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat, i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-xl border border-teal-500/20 bg-slate-900/50 p-4 backdrop-blur-sm"
                  >
                    <stat.icon className="mx-auto mb-2 h-6 w-6 text-teal-400" />
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </m.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-emerald-600 hover:shadow-teal-500/40"
                >
                  Essayer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
                >
                  Voir les tarifs
                </Link>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Sans engagement · Sans carte bancaire · Support inclus
              </p>
            </m.div>
          </Container>
        </section>

        {/* Features */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Caisse nouvelle génération
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                Rapide, intuitive, connectée à toute votre gestion
              </p>
            </m.div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-teal-500/40 hover:bg-slate-900/70"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-teal-500/20 p-3">
                    <feature.icon className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases - Avant/Après */}
        <section className="relative border-y border-white/10 bg-slate-900/50 py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Avant / Après Quelyos POS
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Des résultats concrets pour chaque métier
              </p>
            </m.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-teal-500/20 bg-slate-900/70 p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-5`}
                  />
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20">
                      <useCase.icon className="h-7 w-7 text-teal-400" />
                    </div>
                    <h3 className="mb-4 text-center font-semibold text-white">
                      {useCase.sector}
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <p className="mb-1 text-xs font-medium text-red-400">
                          Avant
                        </p>
                        <p className="text-sm text-slate-300">{useCase.before}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="mb-1 text-xs font-medium text-emerald-400">
                          Après
                        </p>
                        <p className="text-sm text-slate-300">{useCase.after}</p>
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Comment ça marche */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Comment ça marche ?
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                4 étapes pour un encaissement fluide
              </p>
            </m.div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-xl border border-teal-500/20 bg-slate-900/50 p-8 text-center"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-sm font-bold text-white">
                      {item.step}
                    </div>
                  </div>
                  <div className="mx-auto mb-4 mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20">
                    <item.icon className="h-7 w-7 text-teal-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Benefits */}
        <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
          <Container>
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Plus qu&apos;une simple caisse
                </h2>
                <p className="mt-2 text-slate-400">
                  Un écosystème complet pour le commerce physique
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-teal-400" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Roadmap */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Roadmap publique
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Suivez l&apos;avancement du développement en toute transparence
              </p>
            </m.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {roadmapItems.map((phase, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl border p-6 ${
                    phase.status === "done"
                      ? "border-emerald-500/30 bg-emerald-950/20"
                      : phase.status === "current"
                        ? "border-teal-500/30 bg-teal-950/20"
                        : "border-yellow-500/30 bg-yellow-950/20"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{phase.phase}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        phase.status === "done"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : phase.status === "current"
                            ? "bg-teal-500/20 text-teal-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {phase.status === "done"
                        ? "Livré"
                        : phase.status === "current"
                          ? "En cours"
                          : "À venir"}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-2 text-sm text-slate-400"
                      >
                        <span
                          className={
                            phase.status === "done"
                              ? "text-emerald-400"
                              : phase.status === "current"
                                ? "text-teal-400"
                                : "text-yellow-400"
                          }
                        >
                          {phase.status === "done" ? "✓" : "○"}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="relative py-20">
          <Container narrow>
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/50 to-emerald-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Modernisez votre point de vente
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Essayez Quelyos POS gratuitement pendant 30 jours.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 font-medium text-white transition-all hover:from-teal-600 hover:to-emerald-600"
                >
                  <Sparkles className="h-5 w-5" />
                  Démarrer l&apos;essai gratuit
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
                >
                  Nous contacter
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
