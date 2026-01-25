"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Target,
  Sparkles,
  Globe,
  Users,
  TrendingUp,
  Megaphone,
  Star,
  CheckCircle2,
  HeartHandshake,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "../../components/Container";
import VoteButton from "@/app/components/VoteButton";
import config from "@/app/lib/config";

const phases = [
  {
    phase: "MVP Q1 2026",
    focus: "Automatisation contenu + calendrier",
    flag: "🇫🇷",
    market: "France",
    kpi: "500 comptes créés",
    status: "active",
    milestones: [
      "Connexion Meta (Instagram/Facebook)",
      "Génération IA sectorielle (FR)",
      "Calendrier + publication auto",
      "Inbox commentaires + réponses IA",
    ],
  },
  {
    phase: "V1 Q2 2026",
    focus: "Inbox unifiée + Analytics business",
    flag: "🇪🇺",
    market: "Europe francophone",
    kpi: "1 500 comptes actifs",
    status: "planned",
    milestones: [
      "DMs agrégés + priorisation",
      "Suggestions horaires optimaux",
      "Analytics business (clients générés)",
      "Templates métiers FR/BE/CH",
    ],
  },
  {
    phase: "V2 Q3 2026",
    focus: "Expansion Maghreb + AR/EN",
    flag: "🇲🇦🇩🇿🇹🇳",
    market: "Maghreb",
    kpi: "800 comptes actifs",
    status: "vision",
    milestones: [
      "UI bilingue FR/AR",
      "Templates locaux (resto, retail, beauté)",
      "Partenariats agences locales",
      "Support multi-devise marketing",
    ],
  },
  {
    phase: "V3 2027",
    focus: "TikTok + LinkedIn + Ads light",
    flag: "🌍",
    market: "International",
    kpi: "2 500 comptes actifs",
    status: "vision",
    milestones: [
      "Publication TikTok Business",
      "Pages LinkedIn (posts + commentaires)",
      "Ads simplifiées (boost posts)",
      "App mobile (planning + réponses)",
    ],
  },
];

const kpis = [
  {
    label: "Waitlist",
    value: "8k+",
    desc: "TPE/PME inscrites",
    color: "text-pink-400",
    icon: Users,
  },
  {
    label: "Time-to-post",
    value: "<5 min",
    desc: "de l'idée à la publication",
    color: "text-orange-400",
    icon: Zap,
  },
  {
    label: "Coût mensuel",
    value: "29€",
    desc: "pack Pro visé",
    color: "text-emerald-400",
    icon: BarChart3,
  },
  {
    label: "Churn cible",
    value: "<5%",
    desc: "sur 90 jours",
    color: "text-purple-400",
    icon: TrendingUp,
  },
];

const differentiators = [
  {
    title: "IA sectorielle locale",
    description:
      "Prompts et datasets par métier (resto, coiffure, retail, bien-être) avec ton ajusté FR/AR/EN.",
    icon: Sparkles,
    gradient: "from-pink-500 to-purple-500",
  },
  {
    title: "Inbox + IA réponses",
    description:
      "Commentaires et DMs unifiés, suggestions IA prêtes à envoyer, priorisation clients chauds.",
    icon: HeartHandshake,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    title: "Analytics business",
    description:
      "Suivi clients générés, conversions par post, recommandations d'action concrètes.",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Go-to-market agences",
    description:
      "Offre multi-comptes pour agences locales (Maghreb/FR), gestion étiquettes, modèles partagés.",
    icon: Megaphone,
    gradient: "from-blue-500 to-cyan-500",
  },
];

const partnerships = [
  {
    title: "Agences locales",
    bullets: [
      "Maghreb food/retail",
      "Réseau micro-influenceurs",
      "Offre revendeur",
    ],
  },
  {
    title: "Fournisseurs contenus",
    bullets: [
      "Banques d'images locales",
      "Créateurs templates vidéo",
      "Pack audio libres",
    ],
  },
  {
    title: "Plateformes Meta/TikTok",
    bullets: [
      "Programmes partenaires",
      "Support API prioritaire",
      "Crédits ads de lancement",
    ],
  },
];

const pricing = [
  {
    plan: "Essai 14j",
    price: "0€",
    features: ["IA posts illimités", "1 compte IG/FB", "Calendrier basique"],
  },
  {
    plan: "Pro",
    price: "29€/mois",
    features: [
      "3 comptes",
      "Inbox + réponses IA",
      "Analytics business",
      "Planification auto",
    ],
  },
  {
    plan: "Agence",
    price: "79€/mois",
    features: [
      "10 comptes",
      "Templates partagés",
      "Brand kits",
      "Support prioritaire",
    ],
  },
];

export default function MarketingRoadmapPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/50">
          <Container className="py-8">
            <div className="flex items-center gap-4">
              <Link
                href="/marketing"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour Marketing
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Image
                    src="/logos/icon-marketing.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  Roadmap Produit Marketing 2026
                </h1>
                <p className="text-slate-400 mt-1">
                  Vision, go-to-market et expansion
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
            className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-500/30 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              &quot;Le marketing social qui prend 20 minutes par semaine et
              génère des clients locaux.&quot;
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Quelyos Marketing automatise la production, la planification et
              les réponses clients pour les TPE locales. Focus sur le business,
              pas sur les pixels.
            </p>
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
                <p className="text-[11px] text-slate-500">{kpi.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Expansion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Plan d&apos;expansion
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {phases.map((phase, idx) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`p-5 rounded-xl border ${
                    phase.status === "active"
                      ? "bg-pink-900/20 border-pink-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{phase.flag}</span>
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-300">
                      {phase.phase}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {phase.market}
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">{phase.focus}</p>
                  <p className="text-xs text-pink-300 mb-3">
                    KPI : {phase.kpi}
                  </p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {phase.milestones.map((m, mIdx) => (
                      <li
                        key={m}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                          <span>{m}</span>
                        </div>
                        {phase.status !== "active" && (
                          <VoteButton
                            itemId={`marketing-roadmap-${idx}-${mIdx}`}
                            category="marketing-roadmap"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Différenciateurs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Avantages produit
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {differentiators.map((diff, i) => (
                <motion.div
                  key={diff.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${diff.gradient} flex items-center justify-center mb-4`}
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

          {/* Partenariats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-400" />
              Partenariats Go-to-Market
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {partnerships.map((p) => (
                <div
                  key={p.title}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" />
                    {p.title}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-pink-400" />
              Positionnement prix
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pricing.map((tier, i) => (
                <motion.div
                  key={tier.plan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                  className={`p-6 rounded-xl border ${
                    i === 1
                      ? "bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-pink-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {i === 1 && (
                    <span className="text-xs px-2 py-1 rounded bg-pink-400/20 text-pink-300 mb-3 inline-block">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {tier.plan}
                  </h3>
                  <p className="text-3xl font-bold text-pink-300 my-2">
                    {tier.price}
                  </p>
                  <ul className="space-y-2">
                    {tier.features.map((f) => (
                      <li
                        key={f}
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
            transition={{ delay: 0.6 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-500/20"
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Rejoindre l&apos;aventure Marketing
            </h3>
            <p className="text-slate-400 mb-6">
              Accès anticipé, feedback produit, offre fondatrice.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={config.marketing.app}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Rejoindre la waitlist →
              </Link>
              <Link
                href="/marketing/backlog"
                className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Voir le backlog produit
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
