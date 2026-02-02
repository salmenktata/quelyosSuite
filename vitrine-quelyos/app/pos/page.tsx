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
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function POSPage() {
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
        "Interface simplifiée pour les pics d'affluence. Encaissement ultra-rapide.",
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
            <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-300">
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
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-4 text-lg font-medium text-white transition-all hover:from-teal-600 hover:to-emerald-600"
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
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-teal-400" />
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
