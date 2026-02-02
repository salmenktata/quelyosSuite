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
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function StockPage() {
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
            <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
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
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-medium text-white transition-all hover:from-orange-600 hover:to-amber-600"
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
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-orange-400" />
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
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
