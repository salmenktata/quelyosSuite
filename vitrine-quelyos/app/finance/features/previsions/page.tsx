"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Brain,
  Calendar,
  GitBranch,
  AlertCircle,
  LineChart,
  Target,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

const features = [
  {
    icon: Brain,
    title: "Algorithmes prédictifs",
    description:
      "Machine learning sur vos données historiques pour des prévisions précises et personnalisées.",
  },
  {
    icon: Calendar,
    title: "Horizons 30/60/90 jours",
    description:
      "Choisissez votre horizon de prévision. Visualisez l'évolution probable de votre trésorerie.",
  },
  {
    icon: GitBranch,
    title: "Scénarios what-if",
    description:
      "Simulez l'impact d'une embauche, d'un investissement ou d'une perte de client.",
  },
  {
    icon: AlertCircle,
    title: "Alertes de tension",
    description:
      "Détection automatique des périodes à risque de trésorerie négative. Alertes anticipées.",
  },
  {
    icon: LineChart,
    title: "Récurrence automatique",
    description:
      "L'IA détecte vos charges récurrentes (loyer, salaires) et les intègre aux prévisions.",
  },
  {
    icon: Target,
    title: "Objectifs de trésorerie",
    description:
      "Définissez un seuil minimum et visualisez quand vous risquez de passer dessous.",
  },
];

const scenarios = [
  {
    name: "Optimiste (+20%)",
    color: "bg-emerald-500",
    values: [45, 52, 58, 65],
  },
  { name: "Réaliste", color: "bg-blue-500", values: [45, 48, 51, 53] },
  { name: "Pessimiste (-20%)", color: "bg-red-500", values: [45, 42, 38, 35] },
];

export default function ForecastFeaturePage() {
  return (
    <LazyMotion features={domAnimation}>
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Hero */}
        <div className="border-b border-white/10 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
          <Container className="py-16">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/finance/features"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Toutes les fonctionnalités
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      Prévisions IA
                    </h1>
                    <p className="text-purple-400">
                      Anticipez 90 jours à l&apos;avance
                    </p>
                  </div>
                </div>

                <p className="text-lg text-slate-300 mb-8">
                  Dormez tranquille grâce à nos algorithmes prédictifs.
                  Visualisez l&apos;évolution de votre trésorerie sur 30, 60 ou
                  90 jours. Simulez des scénarios pour prendre les bonnes
                  décisions.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={config.finance.forecast}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Voir mes prévisions
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href={config.finance.register}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Essai gratuit 30 jours
                  </Link>
                </div>
              </div>

              {/* Forecast Preview */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-medium text-slate-400">
                    Prévisions 90 jours
                  </p>
                  <div className="flex gap-2">
                    {["30j", "60j", "90j"].map((period) => (
                      <button
                        key={period}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          period === "90j"
                            ? "bg-purple-500 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mini chart simulation */}
                <div className="h-48 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 border border-purple-500/20 mb-4">
                  <div className="flex justify-between h-full">
                    {["Aujourd'hui", "J+30", "J+60", "J+90"].map((label, i) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-end gap-2"
                      >
                        <div className="w-8 flex flex-col gap-1 items-center">
                          {scenarios.map((scenario) => (
                            <div
                              key={scenario.name}
                              className={`w-2 rounded-full ${scenario.color}`}
                              style={{ height: `${scenario.values[i]}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.name}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${scenario.color}`}
                      />
                      <span className="text-xs text-slate-400">
                        {scenario.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </Container>
        </div>

        {/* Features Grid */}
        <Container className="py-16">
          <h2 className="text-2xl font-bold text-white mb-8">
            Fonctionnalités clés
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all"
              >
                <feature.icon className="h-10 w-10 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>

          {/* How it works */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Comment ça marche ?
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: 1,
                  title: "Import données",
                  desc: "Vos transactions historiques alimentent l'IA",
                },
                {
                  step: 2,
                  title: "Analyse patterns",
                  desc: "L'IA détecte vos récurrences et saisonnalités",
                },
                {
                  step: 3,
                  title: "Calcul prévisions",
                  desc: "Projection sur l'horizon choisi (30/60/90j)",
                },
                {
                  step: 4,
                  title: "Alertes proactives",
                  desc: "Notification si tension de trésorerie détectée",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Anticiper ma trésorerie
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Container>
      </div>
      <Footer />
    </>
    </LazyMotion>
  );
}
