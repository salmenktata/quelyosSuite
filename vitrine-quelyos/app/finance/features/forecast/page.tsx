"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  TrendingUp,
  Brain,
  Calendar,
  AlertTriangle,
  Target,
  Sparkles,
  Calculator,
  UserPlus,
  UserMinus,
  Clock,
  DollarSign,
} from "lucide-react";

import config from "@/app/lib/config";
const features = [
  {
    icon: Brain,
    title: "Intelligence artificielle",
    description: "Algorithmes ML entraînés sur des milliers de TPE.",
  },
  {
    icon: Calendar,
    title: "Prévisions à 90 jours",
    description: "Anticipez votre trésorerie sur les 3 prochains mois.",
  },
  {
    icon: AlertTriangle,
    title: "Détection de risques",
    description: "Soyez alerté des potentiels problèmes de cash-flow.",
  },
  {
    icon: Target,
    title: "Scénarios multiples",
    description: "Simulez optimiste, réaliste et pessimiste.",
  },
  {
    icon: Sparkles,
    title: "Recommandations",
    description: "Conseils personnalisés pour optimiser votre trésorerie.",
  },
  {
    icon: TrendingUp,
    title: "Tendances saisonnières",
    description: "Prenez en compte la saisonnalité de votre activité.",
  },
];

const whatIfScenarios = [
  {
    icon: UserPlus,
    title: "Embauche CDI",
    description: "Simulez l'impact d'une nouvelle embauche avec charges",
    color: "rose",
  },
  {
    icon: UserMinus,
    title: "Perte d'un client",
    description: "Évaluez l'impact d'une baisse du CA mensuel",
    color: "amber",
  },
  {
    icon: Clock,
    title: "Retard de paiement",
    description: "Testez des délais de paiement plus longs",
    color: "orange",
  },
  {
    icon: DollarSign,
    title: "Nouveau contrat",
    description: "Anticipez l'arrivée d'un revenu récurrent",
    color: "emerald",
  },
  {
    icon: TrendingUp,
    title: "Réduction des coûts",
    description: "Mesurez l'effet d'économies mensuelles",
    color: "green",
  },
  {
    icon: Calculator,
    title: "Nouvelle dépense",
    description: "Projetez l'impact d'un coût supplémentaire",
    color: "indigo",
  },
];

export default function ForecastFeaturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
              <TrendingUp size={16} />
              Prévisions IA
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Anticipez l&apos;avenir
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                avec l&apos;IA
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Notre intelligence artificielle analyse vos données pour prédire 
              votre trésorerie et vous alerter des risques potentiels.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Activer les prévisions
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Forecast Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-2xl">
              <div className="border-b border-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Brain className="text-amber-400" size={20} />
                  <h3 className="font-semibold text-white">Prévision de trésorerie</h3>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                    IA
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                    <p className="text-xs text-slate-500">Optimiste</p>
                    <p className="mt-1 text-xl font-bold text-emerald-400">+32 400 €</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-xs text-slate-500">Réaliste</p>
                    <p className="mt-1 text-xl font-bold text-white">+24 800 €</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                    <p className="text-xs text-slate-500">Pessimiste</p>
                    <p className="mt-1 text-xl font-bold text-amber-400">+18 200 €</p>
                  </div>
                </div>
                <div className="rounded-lg bg-indigo-500/10 p-4">
                  <p className="flex items-center gap-2 text-sm text-indigo-300">
                    <Sparkles size={16} />
                    <strong>Conseil IA :</strong> Vos revenus augmentent de 15% en moyenne 
                    au T1. Prévoyez une réserve pour les charges sociales de mars.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* What-If Simulator Section */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm text-purple-400">
              <Calculator size={16} />
              Simulateur What-If
            </div>
            <h2 className="text-3xl font-bold text-white">
              Testez vos décisions
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                avant de les prendre
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Et si j&apos;embauche ? Et si je perds ce client ? Notre simulateur interactif
              vous montre l&apos;impact en temps réel sur votre trésorerie à 90 jours.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whatIfScenarios.map((scenario, i) => (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${scenario.color}-500/10 text-${scenario.color}-400 transition-transform group-hover:scale-110`}>
                  <scenario.icon size={24} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{scenario.title}</h3>
                <p className="text-sm text-slate-400">{scenario.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 text-center"
          >
            <p className="text-lg text-white">
              <strong>6 scénarios prédéfinis</strong> + sliders interactifs pour ajuster les montants.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Impact calculé en temps réel sur vos prévisions. Sauvegarde automatique de vos simulations.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Voyez plus loin</h2>
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