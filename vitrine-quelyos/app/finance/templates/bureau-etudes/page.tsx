"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Calculator,
  FlaskConical,
  FileBarChart,
  Lightbulb,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react";

import config from "@/app/lib/config";
const challenges = [
  {
    icon: FileBarChart,
    title: "Suivi des projets techniques",
    description: "Pilotez les coûts et rentabilité de chaque étude.",
  },
  {
    icon: FlaskConical,
    title: "Budget R&D",
    description: "Gérez l'innovation et les investissements recherche.",
  },
  {
    icon: Clock,
    title: "Heures ingénieurs",
    description: "Suivez le temps passé par projet et expertise.",
  },
  {
    icon: Lightbulb,
    title: "CIR et subventions",
    description: "Identifiez les dépenses éligibles au crédit impôt recherche.",
  },
];

const benefits = [
  "Suivi des coûts par projet",
  "Budget R&D et innovation",
  "Calcul de rentabilité contrat",
  "Identification CIR automatique",
  "Prévisions de trésorerie",
  "Export pour expert-comptable",
];

const kpis = [
  { label: "Coût projet moyen", value: "38 000 €", trend: "+5%" },
  { label: "Marge brute", value: "42%", trend: "+3%" },
  { label: "Budget R&D", value: "30%", trend: "stable" },
  { label: "Heures facturables", value: "78%", trend: "+2%" },
];

export default function BureauEtudesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
              <Calculator size={16} />
              Solution sectorielle
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Quelyos pour les
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                bureaux d&apos;études
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Pilotez la rentabilité de vos projets techniques, optimisez vos budgets R&D 
              et maximisez votre crédit impôt recherche.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/finance/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Challenges */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Les défis des bureaux d&apos;études
            </h2>
            <p className="mt-4 text-slate-400">
              Expertise technique + gestion financière = notre spécialité
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
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <challenge.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{challenge.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits & Dashboard Preview */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Tout ce qu&apos;il vous faut
              </h2>
              <p className="mt-4 text-slate-400">
                Quelyos comprend les spécificités des bureaux d&apos;études : projets longs, 
                budgets R&D, heures ingénieurs et conformité CIR.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-cyan-500"
                >
                  Essayer gratuitement
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-white">Projet : Pont autoroutier A89</h3>
                <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400">
                  En cours
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Budget total</span>
                  <span className="text-white">125 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dépensé</span>
                  <span className="text-cyan-400">78 500 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Heures ingénieurs</span>
                  <span className="text-white">1 240h / 2 000h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rentabilité prévisionnelle</span>
                  <span className="text-emerald-400">+18%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                </div>
                <p className="text-xs text-slate-500">62% du budget consommé</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* KPIs Section */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              KPIs adaptés à votre métier
            </h2>
            <p className="mt-4 text-slate-400">
              Suivez les indicateurs qui comptent vraiment pour un bureau d&apos;études
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                  <span className={`text-sm ${
                    kpi.trend.startsWith('+') ? 'text-emerald-400' : 
                    kpi.trend === 'stable' ? 'text-slate-400' : 'text-red-400'
                  }`}>
                    {kpi.trend}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* R&D Focus Section */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
                <Lightbulb size={16} />
                Crédit Impôt Recherche
              </div>
              <h2 className="text-3xl font-bold text-white">
                Maximisez votre CIR avec Quelyos
              </h2>
              <p className="mt-4 text-slate-300">
                Identifiez automatiquement les dépenses éligibles au Crédit Impôt Recherche : 
                salaires ingénieurs R&D, dotations aux amortissements, frais de sous-traitance agréée.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-3">
                  <p className="text-2xl font-bold text-cyan-400">30%</p>
                  <p className="text-xs text-slate-400">Crédit sur dépenses R&D</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-3">
                  <p className="text-2xl font-bold text-cyan-400">50%</p>
                  <p className="text-xs text-slate-400">Sous-traitance agréée</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-3">
                  <p className="text-2xl font-bold text-cyan-400">100M€</p>
                  <p className="text-xs text-slate-400">Plafond annuel</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Template Categories */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Template Bureau d&apos;Études pré-configuré
            </h2>
            <p className="mt-4 text-slate-400">
              Démarrez en moins de 5 minutes avec nos catégories adaptées
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenus */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp className="text-emerald-400" size={20} />
                Revenus
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  Études & Projets
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  Assistance technique
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  R&D subventionnée
                </li>
              </ul>
            </div>

            {/* Dépenses */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Target className="text-rose-400" size={20} />
                Dépenses (Budget recommandé)
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    Salaires ingénieurs
                  </div>
                  <span className="font-semibold text-white">50%</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-purple-400" />
                    R&D & Innovation
                  </div>
                  <span className="font-semibold text-white">30%</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    Matériel technique
                  </div>
                  <span className="font-semibold text-white">15%</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    Logiciels spécialisés
                  </div>
                  <span className="font-semibold text-white">5%</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              💡 Conseil : Visez 50% pour les salaires (expertise), 30% pour la R&D (différenciation), 
              et 15% pour le matériel technique.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA Final */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Rejoignez +80 bureaux d&apos;études
          </h2>
          <p className="mt-4 text-slate-400">
            Pilotez vos projets, optimisez votre R&D, maximisez votre CIR
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
            >
              Essayer gratuitement
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              Demander une démo
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Essai gratuit • Pas de carte bancaire • Setup en 5 min
          </p>
        </Container>
      </section>
    </div>
  );
}