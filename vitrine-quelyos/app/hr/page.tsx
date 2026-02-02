"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  UsersRound,
  ArrowRight,
  UserPlus,
  Calendar,
  Clock,
  FileText,
  Award,
  CheckCircle,
  Building2,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  Briefcase,
  Store,
  Rocket,
  UtensilsCrossed,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

export default function HRPage() {
  const stats = [
    { value: "100+", label: "PME équipées", icon: Building2 },
    { value: "-60%", label: "admin RH", icon: TrendingUp },
    { value: "98%", label: "satisfaction", icon: Target },
    { value: "3 mois", label: "ROI moyen", icon: BarChart3 },
  ];

  const features = [
    {
      icon: UserPlus,
      title: "Gestion des employés",
      description:
        "Fiches employés complètes : contrats, documents, informations personnelles et professionnelles.",
    },
    {
      icon: Calendar,
      title: "Congés & Absences",
      description:
        "Demandes de congés en ligne, validation workflow, soldes automatiques et calendrier d&apos;équipe.",
    },
    {
      icon: Clock,
      title: "Suivi des présences",
      description:
        "Pointage digital, feuilles de temps, heures supplémentaires et export pour la paie.",
    },
    {
      icon: FileText,
      title: "Documents RH",
      description:
        "Contrats, attestations, bulletins archivés. Génération automatique de documents types.",
    },
    {
      icon: Award,
      title: "Évaluations",
      description:
        "Entretiens annuels, objectifs, suivi des compétences et plans de développement.",
    },
    {
      icon: Building2,
      title: "Organigramme",
      description:
        "Visualisation de la structure, départements, responsables et équipes.",
    },
  ];

  const useCases = [
    {
      sector: "PME services",
      icon: Briefcase,
      before: "Congés gérés par email, fiches Excel, oublis fréquents...",
      after: "Self-service employé, validation auto. Admin RH -60%",
      color: "from-cyan-500 to-teal-500",
    },
    {
      sector: "Commerce multi-sites",
      icon: Store,
      before: "Planning papier, absences non tracées, turnover élevé...",
      after: "Planning digital, suivi centralisé. Turnover -25%",
      color: "from-teal-500 to-emerald-500",
    },
    {
      sector: "Startup tech",
      icon: Rocket,
      before: "Onboarding improvisé, pas de suivi objectifs...",
      after: "Onboarding structuré, évaluations régulières. Rétention +35%",
      color: "from-blue-500 to-cyan-500",
    },
    {
      sector: "Restauration",
      icon: UtensilsCrossed,
      before: "Heures sup non comptées, documents perdus...",
      after: "Pointage digital, bulletins archivés. Conformité 100%",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Onboarding",
      description:
        "Créez la fiche employé, générez le contrat et lancez le parcours d&apos;intégration.",
      icon: UserPlus,
    },
    {
      step: "2",
      title: "Gestion quotidienne",
      description:
        "Congés, présences, documents. Tout se gère en self-service par l&apos;employé.",
      icon: Calendar,
    },
    {
      step: "3",
      title: "Évaluation",
      description:
        "Entretiens, objectifs, feedback continu. Pilotez la performance de vos équipes.",
      icon: ClipboardCheck,
    },
    {
      step: "4",
      title: "Reporting",
      description:
        "Tableaux de bord RH, alertes fin de contrat, export paie automatique.",
      icon: BarChart3,
    },
  ];

  const roadmapItems = [
    {
      phase: "V1 - Disponible",
      status: "done",
      items: [
        "Fiches employés",
        "Congés & absences",
        "Présences & pointage",
        "Documents RH",
      ],
    },
    {
      phase: "V1.5 - Q1 2026",
      status: "current",
      items: [
        "Notes de frais",
        "Évaluations avancées",
        "Rapports RH",
        "Alertes automatiques",
      ],
    },
    {
      phase: "V2 - Q2 2026",
      status: "upcoming",
      items: [
        "Module formation",
        "Recrutement intégré",
        "Bien-être employé",
        "Intégration paie",
      ],
    },
    {
      phase: "V3 - 2027",
      status: "future",
      items: [
        "Paie intégrée complète",
        "IA prédictive turnover",
        "App mobile RH",
        "Marketplace formations",
      ],
    },
  ];

  const benefits = [
    "Self-service employé",
    "Alertes fin de contrat",
    "Export vers la paie",
    "Conformité RGPD",
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950">
        <Header />

        {/* Hero */}
        <section className="relative py-20 sm:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl [animation-delay:2s]" />
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-emerald-500/10 blur-3xl [animation-delay:4s]" />
          </div>
          <Container className="relative">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 backdrop-blur-sm">
                <UsersRound className="h-4 w-4" />
                Module RH
              </div>
              <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Quelyos RH
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Simplifiez la gestion de vos équipes avec un SIRH moderne et intuitif.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
                Employés, congés, présences, évaluations. Tout ce qu&apos;il faut pour gérer
                votre capital humain efficacement.
              </p>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Essai gratuit 30 jours
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  RGPD compliant
                </span>
              </div>

              {/* Stats rapides */}
              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat, i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4 backdrop-blur-sm"
                  >
                    <stat.icon className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </m.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-600 hover:to-teal-600 hover:shadow-cyan-500/40"
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
              <p className="mt-6 text-sm text-slate-500">
                Sans engagement · Sans carte bancaire · Support inclus
              </p>
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
                Gestion RH simplifiée
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                Tous les outils pour piloter vos ressources humaines
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
                  className="group rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-slate-900/70"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-cyan-500/20 p-3">
                    <feature.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases - Avant/Après */}
        <section className="relative border-y border-white/10 bg-slate-900/50 py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Avant / Après Quelyos RH
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Des résultats concrets pour chaque secteur
              </p>
            </m.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/70 p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-5`}
                  />
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
                      <useCase.icon className="h-7 w-7 text-cyan-400" />
                    </div>
                    <h3 className="mb-4 text-center font-semibold text-white">
                      {useCase.sector}
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <p className="mb-1 text-xs font-medium text-red-400">
                          Avant
                        </p>
                        <p className="text-sm text-slate-300">{useCase.before}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="mb-1 text-xs font-medium text-emerald-400">
                          Après
                        </p>
                        <p className="text-sm text-slate-300">{useCase.after}</p>
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Comment ça marche */}
        <section className="relative py-20">
          <Container>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Comment ça marche ?
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                4 étapes pour digitaliser votre gestion RH
              </p>
            </m.div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-xl border border-cyan-500/20 bg-slate-900/50 p-8 text-center"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-bold text-white">
                      {item.step}
                    </div>
                  </div>
                  <div className="mx-auto mb-4 mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
                    <item.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
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
                  Un SIRH pensé pour les PME
                </h2>
                <p className="mt-2 text-slate-400">
                  Simple à utiliser, puissant dans les fonctionnalités
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
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
                Suivez l&apos;avancement du développement en toute transparence
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
                      : phase.status === "current"
                        ? "border-cyan-500/30 bg-cyan-950/20"
                        : "border-yellow-500/30 bg-yellow-950/20"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{phase.phase}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        phase.status === "done"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : phase.status === "current"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {phase.status === "done"
                        ? "Livré"
                        : phase.status === "current"
                          ? "En cours"
                          : "À venir"}
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
                              : phase.status === "current"
                                ? "text-cyan-400"
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
          </Container>
        </section>

        {/* CTA */}
        <section className="relative py-20">
          <Container narrow>
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/50 to-teal-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Digitalisez votre gestion RH
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Essayez Quelyos RH gratuitement pendant 30 jours.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-medium text-white transition-all hover:from-cyan-600 hover:to-teal-600"
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
