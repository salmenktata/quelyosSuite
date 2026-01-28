"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  DollarSign,
  BarChart3,
  Calendar,
  FileText,
  PieChart,
  CreditCard,
  Building2,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Sparkles,
  Wallet,
  ShieldCheck,
  Users,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";

import config from "@/app/lib/config";
export default function FinancePage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Prévisions IA",
      description:
        "Algorithmes ML (Prophet.js) pour des prévisions fiables à 85-90% sur 90 jours.",
    },
    {
      icon: BarChart3,
      title: "Dashboard KPIs",
      description:
        "Visualisez votre santé financière en temps réel : BFR, trésorerie nette, runway.",
    },
    {
      icon: Calendar,
      title: "Import automatique",
      description:
        "Synchronisation bancaire et import CSV/Excel pour centraliser vos transactions.",
    },
    {
      icon: PieChart,
      title: "Budgets intelligents",
      description:
        "Créez et suivez vos budgets par catégorie avec alertes de dépassement.",
    },
    {
      icon: FileText,
      title: "Rapports PDF",
      description:
        "Générez des rapports professionnels pour vos banques et investisseurs.",
    },
    {
      icon: CreditCard,
      title: "Multi-comptes",
      description:
        "Gérez tous vos comptes bancaires et portefeuilles en un seul endroit.",
    },
  ];

  const roadmapItems = [
    {
      phase: "Phase 1-4",
      status: "done",
      items: [
        "Auth & Multi-tenant",
        "Dashboard principal",
        "Transactions CRUD",
        "Catégories & filtres",
      ],
    },
    {
      phase: "Phase 5-7",
      status: "done",
      items: ["Rapports PDF", "Import CSV/Excel", "Budgets & alertes"],
    },
    {
      phase: "Phase 8-10",
      status: "done",
      items: [
        "Prévisions IA Prophet.js",
        "Portefeuilles multi-comptes",
        "Mode démo",
      ],
    },
    {
      phase: "Phase 11+",
      status: "upcoming",
      items: ["Open Banking API", "Multi-devises MENA", "App mobile"],
    },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Header />

      {/* Hero */}
      <section className="relative py-20 sm:py-32">
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
              <DollarSign className="h-4 w-4" />
              Plateforme en production
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Quelyos Finance
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
              Dormez tranquille : votre trésorerie TPE pilotée 90 jours à
              l&apos;avance.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
              Prévisions IA fiables à 85-90%, dashboard temps réel, rapports
              automatiques. Conçu pour les TPE services B2B de 5 à 20 personnes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
              >
                Essayer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`${config.finance.login}?redirect=/dashboard/demo`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
              >
                <Sparkles className="h-5 w-5" />
                Essayer la démo
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Essai gratuit 14 jours
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
          </m.div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="relative py-20">
        <Container>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Fonctionnalités clés
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Tout ce dont vous avez besoin pour piloter votre trésorerie TPE
            </p>
          </m.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-indigo-500/20 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/40 hover:bg-slate-900/70"
              >
                <div className="mb-4 inline-flex rounded-lg bg-indigo-500/20 p-3">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Target Persona */}
      <section className="relative border-y border-white/10 bg-slate-900/50 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Conçu pour les dirigeants de TPE services B2B
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Sophie, 42 ans, dirige une agence web de 8 personnes. Elle
                jongle entre Excel et son banquier, stresse sur les délais de
                paiement clients, et rêve de voir à 3 mois sans y passer des
                heures.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Building2, text: "TPE de 5 à 20 personnes" },
                  { icon: Clock, text: "10 minutes/jour max pour la gestion" },
                  {
                    icon: Zap,
                    text: "Prise en main immédiate, sans formation",
                  },
                  { icon: Globe, text: "France → Tunisie → Maghreb → Golf" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <item.icon className="h-5 w-5 text-indigo-400" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </m.div>
            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-slate-900/50 p-8"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20">
                  <Building2 className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Profil type</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Secteur</span>
                  <span className="text-white">Services B2B</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Équipe</span>
                  <span className="text-white">5-20 personnes</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">CA annuel</span>
                  <span className="text-white">200k€ - 2M€</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Besoin principal</span>
                  <span className="text-white">Visibilité trésorerie</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Objectif</span>
                  <span className="text-white">Anticiper à 90 jours</span>
                </li>
              </ul>
            </m.div>
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
              Transparence totale sur l&apos;avancement du produit
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
                    : "border-yellow-500/30 bg-yellow-950/20"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{phase.phase}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      phase.status === "done"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {phase.status === "done" ? "✓ Livré" : "À venir"}
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
          <div className="mt-8 text-center">
            <Link
              href="/finance/roadmap"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            >
              Voir la roadmap complète
              <ArrowRight className="h-4 w-4" />
            </Link>
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
            className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <DollarSign className="mx-auto mb-6 h-12 w-12 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à piloter votre trésorerie ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Essayez Quelyos Finance gratuitement pendant 14 jours. Aucune
              carte bancaire requise.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
              >
                Commencer l&apos;essai gratuit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Demander une démo
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
