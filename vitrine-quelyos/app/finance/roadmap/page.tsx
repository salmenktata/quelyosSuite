"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Target,
  Globe,
  Users,
  TrendingUp,
  CheckCircle2,
  MapPin,
  DollarSign,
  Award,
  Sparkles,
  Zap,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
import VoteButton from "@/app/components/VoteButton";
import config from "@/app/lib/config";

const expansionPhases = [
  {
    phase: 1,
    market: "Europe (FR d'abord)",
    flag: "🇪🇺",
    currency: "EUR",
    timeline: "2025-2026",
    target: "100 clients Pro",
    arr: "50 000€",
    status: "active",
    milestones: [
      { name: "MVP production", done: true },
      { name: "10 premiers clients pilotes", done: true },
      { name: "50 clients", done: false },
      { name: "100 clients Pro", done: false },
    ],
  },
  {
    phase: 2,
    market: "Maghreb & Nord Afrique",
    flag: "🇹🇳🇩🇿🇲🇦",
    currency: "Multi-devise (MAD/DZD/TND)",
    timeline: "Q3 2026",
    target: "50 clients Pro",
    arr: "15 000€",
    status: "planned",
    milestones: [
      { name: "Adaptation multi-devise zone (MAD/DZD/TND)", done: false },
      { name: "Partenariats locaux par zone", done: false },
      { name: "Landing page FR/AR", done: false },
      { name: "50 clients zone Maghreb/NA", done: false },
    ],
  },
  {
    phase: 3,
    market: "Middle East & Gulf",
    flag: "🇦🇪🇸🇦🇶🇦",
    currency: "AED/SAR/QAR",
    timeline: "2027",
    target: "70 clients Pro",
    arr: "25 000€",
    status: "planned",
    milestones: [
      { name: "UI bilingue AR/EN", done: false },
      { name: "Compliance région", done: false },
      { name: "Partenariats premium", done: false },
    ],
  },
];

const kpis = [
  {
    label: "ARR cible 2026",
    value: "50k€",
    icon: DollarSign,
    color: "text-emerald-400",
  },
  {
    label: "Clients Pro FR",
    value: "100",
    icon: Users,
    color: "text-blue-400",
  },
  {
    label: "Churn cible",
    value: "<5%",
    icon: TrendingUp,
    color: "text-purple-400",
  },
  { label: "NPS cible", value: ">40", icon: Award, color: "text-amber-400" },
];

const differentiators = [
  {
    title: "IA Prédictive",
    description:
      "Prévisions trésorerie 30/60/90 jours avec Prophet.js et ML. Alertes intelligentes avant les problèmes.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Multi-Devise Natif",
    description:
      "Support EUR, TND, DZD, MAD, AED, SAR, QAR dès le MVP. Avantage compétitif MENA.",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "5 Minutes Setup",
    description:
      "Import bancaire, catégorisation auto, dashboard prêt. Time-to-value imbattable.",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Prix TPE",
    description:
      "29€/mois Pro, 79€/mois Expert. 10x moins cher que les solutions enterprise.",
    icon: Target,
    color: "from-emerald-500 to-teal-500",
  },
];

const pricing = [
  {
    plan: "Freemium",
    price: "0€",
    features: ["1 compte", "30 transactions/mois", "Dashboard de base"],
    highlight: false,
  },
  {
    plan: "Pro",
    price: "29€/mois",
    features: [
      "5 comptes",
      "Illimité transactions",
      "Prévisions IA 90j",
      "Export PDF/CSV",
      "Support prioritaire",
    ],
    highlight: true,
  },
  {
    plan: "Expert",
    price: "79€/mois",
    features: [
      "Comptes illimités",
      "Multi-portefeuilles",
      "Scénarios what-if",
      "API accès",
      "Onboarding dédié",
    ],
    highlight: false,
  },
];

export default function FinanceRoadmapPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/50">
          <Container className="py-16">
            <div className="flex items-center gap-4">
              <Link
                href="/finance"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour Finance
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <div className="flex items-center gap-3">
                  <Image
                    src="/logos/icon-finance.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Roadmap Produit 2026
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30">
                      Zones prioritaires
                    </span>
                  </h1>
                </div>
                <p className="text-slate-400 mt-1">
                  Vision, expansion internationale & positionnement
                </p>
              </div>
            </div>
        </Container>
        </div>

        <Container className="py-8">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              &quot;Dormez tranquille : votre trésorerie TPE pilotée 90 jours à
              l&apos;avance.&quot;
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Quelyos Finance démocratise le pilotage financier pour les TPE/PME
              francophones, avec une IA prédictive et un prix accessible.
            </p>
          </motion.div>

          {/* Go-to-market par zones (priorité Maghreb / Nord Afrique avant Europe) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-12 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-amber-900/10 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-semibold text-white">
                Go-to-market zones — priorité Maghreb / Nord Afrique
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Positionnement
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cash
                    management simple, alertes et prévisions 90j, sans dépendre
                    d&apos;un agrégateur.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Prix
                    early-adopter par zone (devise locale), offre 14j
                    d&apos;essai, pack Pro/Expert simplifié.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Social
                    proof locale (TPE/PME par zone), témoignages + page tarifs
                    localisée (FR/AR/EN).
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Quick wins Maghreb / Nord Afrique
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />{" "}
                    Localisation devises/formats TVA zone (MAD/DZD/TND) +
                    mentions légales adaptées.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Import
                    CSV bancaires locaux + mapping rapide; mode manuel assisté
                    sans agrégateur.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />{" "}
                    Alertes seuil personnalisées + digest email hebdo (solde,
                    dépenses, alertes).
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Export
                    comptable propre (CSV/Excel) pour experts-comptables;
                    pré-FEC pour l&apos;Europe.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />{" "}
                    Support FR/AR/EN, mini-centre d&apos;aide; canal
                    WhatsApp/Email.
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/finance/backlog"
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Voir le backlog produit
              </Link>
              <Link
                href="/finance/backlog-technique"
                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-200 text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                Voir le backlog technique
              </Link>
            </div>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
              >
                <kpi.icon className={`h-6 w-6 mx-auto mb-2 ${kpi.color}`} />
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-slate-400">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Expansion Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Plan d&apos;expansion internationale
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {expansionPhases.map((phase, i) => (
                <motion.div
                  key={phase.market}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`p-5 rounded-xl border ${
                    phase.status === "active"
                      ? "bg-emerald-900/20 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{phase.flag}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        phase.status === "active"
                          ? "bg-emerald-400/20 text-emerald-400"
                          : phase.status === "planned"
                            ? "bg-blue-400/20 text-blue-400"
                            : "bg-slate-400/20 text-slate-400"
                      }`}
                    >
                      Phase {phase.phase}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {phase.market}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {phase.timeline} • {phase.currency}
                  </p>
                  <div className="space-y-2 mb-4">
                    {phase.milestones.map((m, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {m.done ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-slate-500" />
                          )}
                          <span
                            className={
                              m.done ? "text-slate-300" : "text-slate-500"
                            }
                          >
                            {m.name}
                          </span>
                        </div>
                        {!m.done && (
                          <VoteButton
                            itemId={`finance-roadmap-${phase.phase}-${j}`}
                            category="finance-roadmap"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-lg font-bold text-emerald-400">
                      {phase.arr} ARR
                    </p>
                    <p className="text-xs text-slate-400">{phase.target}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Differentiators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Avantages concurrentiels
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {differentiators.map((diff, i) => (
                <motion.div
                  key={diff.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${diff.color} flex items-center justify-center mb-4`}
                  >
                    <diff.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    {diff.title}
                  </h3>
                  <p className="text-sm text-slate-400">{diff.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Grille tarifaire
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pricing.map((tier, i) => (
                <motion.div
                  key={tier.plan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className={`p-6 rounded-xl border ${
                    tier.highlight
                      ? "bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {tier.highlight && (
                    <span className="text-xs px-2 py-1 rounded bg-emerald-400/20 text-emerald-400 mb-4 inline-block">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {tier.plan}
                  </h3>
                  <p className="text-3xl font-bold text-emerald-400 my-3">
                    {tier.price}
                  </p>
                  <ul className="space-y-2">
                    {tier.features.map((f, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20"
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Prêt à piloter votre trésorerie ?
            </h3>
            <p className="text-slate-400 mb-6">
              Rejoignez les TPE qui dorment tranquilles grâce à Quelyos Finance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={config.finance.app}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Essayer gratuitement →
              </Link>
              <Link
                href="/finance/features"
                className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Voir les fonctionnalités
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
