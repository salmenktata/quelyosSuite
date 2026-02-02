"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Boxes,
  ArrowRight,
  Package,
  Warehouse,
  BarChart3,
  Bell,
  CheckCircle,
  RefreshCw,
  Sparkles,
  QrCode,
  ShoppingCart,
  TrendingUp,
  Target,
  Truck,
  ClipboardCheck,
  PackageCheck,
  Send,
  UtensilsCrossed,
  Factory,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function StockPage() {
  const stats = [
    { value: "150+", label: "entrepôts gérés", icon: Warehouse },
    { value: "-40%", label: "ruptures de stock", icon: TrendingUp },
    { value: "99.5%", label: "précision inventaire", icon: Target },
    { value: "6 mois", label: "ROI moyen", icon: BarChart3 },
  ];

  const features = [
    {
      icon: Warehouse,
      title: "Multi-entrepôts",
      description:
        "Gérez plusieurs sites de stockage avec des emplacements détaillés et des transferts inter-sites.",
    },
    {
      icon: Package,
      title: "Mouvements temps réel",
      description:
        "Entrées, sorties, ajustements et inventaires avec traçabilité complète de chaque mouvement.",
    },
    {
      icon: Bell,
      title: "Alertes de stock",
      description:
        "Notifications automatiques pour les seuils critiques et les besoins de réapprovisionnement.",
    },
    {
      icon: RefreshCw,
      title: "Réapprovisionnement auto",
      description:
        "Suggestions de commandes basées sur les ventes et les niveaux de stock minimum.",
    },
    {
      icon: BarChart3,
      title: "Valorisation stock",
      description:
        "Calcul automatique de la valeur du stock en FIFO, LIFO ou coût moyen pondéré.",
    },
    {
      icon: QrCode,
      title: "Codes-barres & QR",
      description:
        "Scan rapide pour les entrées/sorties et inventaires avec votre smartphone.",
    },
  ];

  const useCases = [
    {
      sector: "Commerce retail",
      icon: ShoppingCart,
      before: "Ruptures fréquentes, comptage manuel, pertes non détectées...",
      after: "Stock temps réel, alertes auto. Ruptures -40%",
      color: "from-orange-500 to-amber-500",
    },
    {
      sector: "E-commerce",
      icon: Truck,
      before: "Surventes, délais de livraison imprécis, retours mal gérés...",
      after: "Sync multi-canal, préparation optimisée. Satisfaction +30%",
      color: "from-amber-500 to-yellow-500",
    },
    {
      sector: "Restauration",
      icon: UtensilsCrossed,
      before: "Gaspillage alimentaire, commandes fournisseur au feeling...",
      after: "Suivi DLC, réappro auto. Gaspillage -50%",
      color: "from-red-500 to-orange-500",
    },
    {
      sector: "Industrie",
      icon: Factory,
      before: "Pièces manquantes, arrêts production, traçabilité floue...",
      after: "Lots tracés, seuils critiques. Arrêts production -60%",
      color: "from-yellow-500 to-amber-500",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Réception",
      description:
        "Réceptionnez vos marchandises avec scan et contrôle qualité automatique.",
      icon: ClipboardCheck,
    },
    {
      step: "2",
      title: "Stockage",
      description:
        "Attribution automatique des emplacements selon vos règles de rangement.",
      icon: Warehouse,
    },
    {
      step: "3",
      title: "Préparation",
      description:
        "Picking optimisé avec parcours intelligent et validation par scan.",
      icon: PackageCheck,
    },
    {
      step: "4",
      title: "Expédition",
      description:
        "Bon de livraison auto, tracking et mise à jour stock en temps réel.",
      icon: Send,
    },
  ];

  const roadmapItems = [
    {
      phase: "V1 - Disponible",
      status: "done",
      items: [
        "Multi-entrepôts",
        "Mouvements & inventaires",
        "Alertes seuils",
        "Valorisation stock",
      ],
    },
    {
      phase: "V1.5 - Q1 2026",
      status: "current",
      items: [
        "Scan barcode natif",
        "Lots & numéros de série",
        "Rapports avancés",
        "Import/export CSV",
      ],
    },
    {
      phase: "V2 - Q2 2026",
      status: "upcoming",
      items: [
        "Multi-entrepôts avancé",
        "Cross-docking",
        "Inventaire tournant",
        "Intégration transporteurs",
      ],
    },
    {
      phase: "V3 - 2027",
      status: "future",
      items: [
        "Prédictif IA",
        "Optimisation emplacements",
        "App mobile entrepôt",
        "IoT capteurs stock",
      ],
    },
  ];

  const benefits = [
    "Synchronisation avec Boutique",
    "Intégration Finance automatique",
    "Historique complet",
    "Export vers comptabilité",
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/30 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-amber-500/20 blur-3xl [animation-delay:2s]" />
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-yellow-500/10 blur-3xl [animation-delay:4s]" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 backdrop-blur-sm">
                <Boxes className="h-4 w-4" />
                Module Stock
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Quelyos Stock
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Maîtrisez votre inventaire avec une gestion de stock moderne et intuitive.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
                Multi-entrepôts, alertes automatiques, valorisation en temps réel.
                Fini les ruptures et les surstocks.
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
                  RGPD compliant
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
                    className="rounded-xl border border-orange-500/20 bg-slate-900/50 p-4 backdrop-blur-sm"
                  >
                    <stat.icon className="mx-auto mb-2 h-6 w-6 text-orange-400" />
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
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/40"
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
                Gestion de stock complète
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                Tous les outils pour un inventaire parfaitement maîtrisé
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
                  className="group rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-orange-500/40 hover:bg-slate-900/70"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-orange-500/20 p-3">
                    <feature.icon className="h-6 w-6 text-orange-400" />
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
                Avant / Après Quelyos Stock
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Des résultats concrets pour chaque secteur
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
                  className="relative overflow-hidden rounded-xl border border-orange-500/20 bg-slate-900/70 p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-5`}
                  />
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20">
                      <useCase.icon className="h-7 w-7 text-orange-400" />
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
                4 étapes pour un flux logistique optimisé
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
                  className="relative rounded-xl border border-orange-500/20 bg-slate-900/50 p-8 text-center"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white">
                      {item.step}
                    </div>
                  </div>
                  <div className="mx-auto mb-4 mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20">
                    <item.icon className="h-7 w-7 text-orange-400" />
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
                  Connecté à votre écosystème
                </h2>
                <p className="mt-2 text-slate-400">
                  Stock synchronisé avec ventes, achats et comptabilité
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
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
                        ? "border-orange-500/30 bg-orange-950/20"
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
                            ? "bg-orange-500/20 text-orange-400"
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
                                ? "text-orange-400"
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
              className="overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/50 to-amber-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Optimisez votre gestion de stock
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Essayez Quelyos Stock gratuitement pendant 30 jours.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-medium text-white transition-all hover:from-orange-600 hover:to-amber-600"
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
