"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  PieChart,
  Target,
  Bell,
  TrendingDown,
  Layers,
  Calendar,
} from "lucide-react";

import config from "@/app/lib/config";
const features = [
  {
    icon: Target,
    title: "Objectifs par catégorie",
    description: "Définissez des plafonds pour chaque type de dépense.",
  },
  {
    icon: Bell,
    title: "Alertes préventives",
    description: "Soyez notifié avant d'atteindre vos limites.",
  },
  {
    icon: TrendingDown,
    title: "Suivi en temps réel",
    description: "Visualisez votre progression à tout moment.",
  },
  {
    icon: Layers,
    title: "Catégories flexibles",
    description: "Créez vos propres catégories selon vos besoins.",
  },
  {
    icon: Calendar,
    title: "Périodes personnalisées",
    description: "Budgets mensuels, trimestriels ou annuels.",
  },
  {
    icon: PieChart,
    title: "Répartition visuelle",
    description: "Graphiques clairs pour comprendre vos dépenses.",
  },
];

const budgets = [
  { name: "Marketing", spent: 2400, limit: 3000, color: "indigo" },
  { name: "Logiciels", spent: 450, limit: 500, color: "violet" },
  { name: "Déplacements", spent: 180, limit: 400, color: "emerald" },
  { name: "Fournitures", spent: 95, limit: 200, color: "amber" },
];

export default function BudgetsFeaturePage() {
  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        
        <Container className="relative">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-400">
              <PieChart size={16} />
              Budgets intelligents
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Maîtrisez chaque euro
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                avec précision
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Créez des budgets intelligents qui vous alertent avant les dépassements. 
              Gardez le contrôle de vos finances sans effort.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Créer mes budgets
                <ArrowRight size={16} />
              </Link>
            </div>
          </m.div>

          {/* Budget Demo */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-3xl space-y-4">
              {budgets.map((budget) => (
                <div
                  key={budget.name}
                  className="rounded-xl border border-white/10 bg-slate-900/80 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-white">{budget.name}</span>
                    <span className="text-sm text-slate-400">
                      {budget.spent}€ / {budget.limit}€
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full bg-${budget.color}-500`}
                      style={{ width: `${(budget.spent / budget.limit) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {Math.round((budget.spent / budget.limit) * 100)}% utilisé
                  </p>
                </div>
              ))}
            </div>
          </m.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Prenez le contrôle</h2>
          <div className="mt-8">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Commencer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
    </LazyMotion>
  );
}