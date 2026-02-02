"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  UserCircle,
  ArrowRight,
  Users,
  Target,
  Mail,
  CheckCircle,
  TrendingUp,
  Calendar,
  Sparkles,
  Receipt,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function CRMPage() {
  const features = [
    {
      icon: Users,
      title: "Gestion des contacts",
      description:
        "Centralisez tous vos clients, prospects et partenaires avec fiches détaillées et historique.",
    },
    {
      icon: Target,
      title: "Pipeline de vente",
      description:
        "Suivez vos opportunités avec un pipeline visuel et personnalisable par étapes.",
    },
    {
      icon: Receipt,
      title: "Devis & Factures",
      description:
        "Créez et envoyez vos devis en quelques clics, convertissez-les en factures automatiquement.",
    },
    {
      icon: Mail,
      title: "Communication intégrée",
      description:
        "Historique des échanges email et téléphone directement sur la fiche client.",
    },
    {
      icon: Calendar,
      title: "Activités & Rappels",
      description:
        "Planifiez vos rendez-vous, appels et tâches avec notifications automatiques.",
    },
    {
      icon: TrendingUp,
      title: "Rapports & Analytics",
      description:
        "Tableaux de bord commerciaux : CA prévisionnel, taux de conversion, performance équipe.",
    },
  ];

  const benefits = [
    "Vision 360° de chaque client",
    "Automatisation des relances",
    "Intégration avec Finance",
    "Export facile vers comptabilité",
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                <UserCircle className="h-4 w-4" />
                Module CRM
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Quelyos CRM
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Gérez vos clients et boostez vos ventes avec un CRM simple et puissant.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
                Pipeline visuel, devis automatiques, facturation intégrée. Tout ce qu&apos;il faut
                pour développer votre activité commerciale.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-violet-600 hover:to-purple-700"
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
                Tout pour gérer votre relation client
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                Un CRM complet intégré à votre suite ERP
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
                  <feature.icon className="mb-4 h-10 w-10 text-violet-400" />
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
                  Intégré à toute la Suite Quelyos
                </h2>
                <p className="mt-2 text-slate-400">
                  Vos données clients connectées à Finance, Stock et Marketing
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-violet-400" />
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
              className="overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Prêt à mieux gérer vos clients ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Essayez Quelyos CRM gratuitement pendant 30 jours.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-violet-600 hover:to-purple-700"
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
