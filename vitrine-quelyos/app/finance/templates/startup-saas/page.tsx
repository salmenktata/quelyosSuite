"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Rocket,
  TrendingUp,
  RefreshCw,
  Users,
  CreditCard,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

import config from "@/app/lib/config";
const challenges = [
  {
    icon: RefreshCw,
    title: "MRR & ARR",
    description: "Suivez vos revenus récurrents en temps réel.",
  },
  {
    icon: Users,
    title: "Churn & rétention",
    description: "Visualisez l'impact financier de la rétention client.",
  },
  {
    icon: TrendingUp,
    title: "Burn rate",
    description: "Maîtrisez votre runway et vos dépenses.",
  },
  {
    icon: CreditCard,
    title: "Paiements Stripe",
    description: "Synchronisation automatique avec vos revenus.",
  },
];

const metrics = [
  { label: "MRR", value: "42.5K €", trend: "+12%" },
  { label: "ARR", value: "510K €", trend: "+18%" },
  { label: "Churn", value: "2.1%", trend: "-0.3%" },
  { label: "Runway", value: "18 mois", trend: "" },
];

const benefits = [
  "Dashboard KPIs SaaS",
  "Intégration Stripe native",
  "Prévisions de croissance",
  "Suivi du CAC et LTV",
  "Alertes burn rate",
  "Rapports investisseurs",
];

export default function StartupSaasPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <Rocket size={16} />
              Solution sectorielle
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Quelyos pour les
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                startups SaaS
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              MRR, ARR, churn, runway... Tous vos KPIs SaaS 
              dans un tableau de bord financier adapté à votre modèle.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Metrics preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center"
                  >
                    <p className="text-xs font-medium uppercase text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {metric.value}
                    </p>
                    {metric.trend && (
                      <p className={`text-xs ${metric.trend.startsWith("+") ? "text-emerald-400" : metric.trend.startsWith("-") ? "text-amber-400" : ""}`}>
                        {metric.trend}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Pensé pour le modèle SaaS
            </h2>
            <p className="mt-4 text-slate-400">
              Quelyos comprend les métriques qui comptent pour votre croissance.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {challenges.map((challenge, i) => (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <challenge.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{challenge.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Fonctionnalités startup
              </h2>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Croissance MRR</h3>
                <span className="text-sm text-emerald-400">+12% ce mois</span>
              </div>
              <div className="flex h-40 items-end gap-1">
                {[35, 38, 42, 45, 48, 52, 55, 58, 62, 68, 72, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/50 to-emerald-400/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>Jan</span>
                <span>Déc</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            +300 startups nous font confiance
          </h2>
          <div className="mt-8">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Essayer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}