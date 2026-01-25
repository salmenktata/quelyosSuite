"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Bell,
  Clock,
  Zap,
} from "lucide-react";

import config from "@/app/lib/config";
const capabilities = [
  {
    icon: BarChart3,
    title: "Vue temps réel",
    description: "Solde, revenus et dépenses actualisés instantanément.",
  },
  {
    icon: TrendingUp,
    title: "Tendances visuelles",
    description: "Graphiques interactifs pour suivre votre évolution.",
  },
  {
    icon: PieChart,
    title: "Répartition dépenses",
    description: "Visualisez où part votre argent par catégorie.",
  },
  {
    icon: Bell,
    title: "Alertes intelligentes",
    description: "Notifications pour les seuils et échéances.",
  },
  {
    icon: Clock,
    title: "Historique complet",
    description: "Accédez à toutes vos données passées en un clic.",
  },
  {
    icon: Zap,
    title: "Chargement instantané",
    description: "Interface optimisée pour une réactivité maximale.",
  },
];

// Hauteurs de barres pré-calculées pour éviter Math.random() pendant le render
const chartBarHeights = Array.from({ length: 20 }, () => 30 + Math.random() * 70);

export default function DashboardFeaturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
              <BarChart3 size={16} />
              Tableau de bord
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Votre cockpit financier
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                tout-en-un
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Un tableau de bord conçu pour vous donner une vision claire et instantanée 
              de votre situation financière. Décidez vite, décidez bien.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Essayer gratuitement
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 bg-slate-900 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  {["Solde total", "Revenus", "Dépenses", "Économies"].map((label, i) => (
                    <div key={label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {["24 650 €", "8 420 €", "3 180 €", "5 240 €"][i]}
                      </p>
                      <p className={`mt-1 text-xs ${i === 2 ? "text-amber-400" : "text-emerald-400"}`}>
                        {["+12.5%", "+8.2%", "-2.1%", "+15.3%"][i]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-48 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex h-full items-end gap-1">
                    {chartBarHeights.map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/50 to-indigo-400/80"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Capabilities */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Tout ce dont vous avez besoin</h2>
            <p className="mt-4 text-slate-400">
              Un dashboard pensé pour les décideurs qui veulent aller à l&apos;essentiel.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <cap.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{cap.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Prêt à voir plus clair ?</h2>
          <p className="mt-4 text-slate-400">
            Créez votre compte en 2 minutes et découvrez votre tableau de bord.
          </p>
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
  );
}