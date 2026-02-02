"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import {
  ArrowRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Wallet,
  LineChart,
  CheckCircle2,
  Bell,
  Upload,
  FolderKanban,
  Receipt,
  Calendar,
  Users,
  Settings,
  Sparkles,
  Zap,
  Clock,
  Target,
  TrendingDown,
  Brain,
  Copy,
  AlertTriangle,
  Lightbulb,
  UserCheck,
} from "lucide-react";

import config from "@/app/lib/config";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";

const coreFeatures = [
  {
    icon: Bell,
    title: "Alertes Intelligentes",
    description: "Recevez une notification avant que votre trésorerie ne devienne critique. Vous êtes prévenu 2 semaines à l'avance pour agir sereinement.",
    href: config.finance.register,
    color: "from-red-500 to-orange-500",
    badge: "Essentiel",
    stats: "Alertes en temps réel",
  },
  {
    icon: TrendingUp,
    title: "Prévisions Automatiques",
    description: "Visualisez votre trésorerie dans 1, 2 ou 3 mois. L'intelligence artificielle analyse votre historique et vous projette dans l'avenir avec précision.",
    href: config.finance.register,
    color: "from-cyan-500 to-blue-500",
    stats: "Visibilité 90 jours",
  },
  {
    icon: Sparkles,
    title: "Simulateur de Décisions",
    description: "Embaucher un salarié ? Investir dans du matériel ? Testez l'impact sur votre trésorerie avant de vous engager.",
    href: config.finance.register,
    color: "from-purple-500 to-pink-500",
    stats: "Scénarios illimités",
  },
  {
    icon: BarChart3,
    title: "Tableau de Bord Simple",
    description: "Tous vos indicateurs financiers en un coup d'œil. Comprenez votre situation en 30 secondes, sans être expert-comptable.",
    href: config.finance.register,
    color: "from-indigo-500 to-violet-500",
    stats: "Vue instantanée",
  },
];

const mlFeatures = [
  {
    icon: Brain,
    title: "Catégorisation Automatique",
    description: "Fini la saisie manuelle ! L'intelligence artificielle classe automatiquement vos dépenses : salaires, fournitures, loyer... Vous validez en 1 clic.",
    color: "from-violet-500 to-purple-500",
    badge: "IA",
    stats: "90% de temps gagné",
    impact: "Apprentissage continu",
  },
  {
    icon: Copy,
    title: "Détection des Doublons",
    description: "Importez vos relevés bancaires sans crainte. Le système repère automatiquement les transactions en double pour éviter les erreurs de comptabilisation.",
    color: "from-emerald-500 to-teal-500",
    badge: "IA",
    stats: "Fiabilité 95%+",
    impact: "Reconnaissance intelligente",
  },
  {
    icon: AlertTriangle,
    title: "Détection d'Anomalies",
    description: "Repérez instantanément les dépenses inhabituelles. Si un montant sort de l'ordinaire, vous êtes alerté immédiatement par email.",
    color: "from-orange-500 to-red-500",
    badge: "IA",
    stats: "Protection 24/7",
    impact: "Surveillance automatique",
  },
  {
    icon: Lightbulb,
    title: "Suggestions de Budgets",
    description: "Difficile de fixer un budget réaliste ? L'IA analyse votre historique et vous propose des montants adaptés à votre activité et votre saisonnalité.",
    color: "from-cyan-500 to-blue-500",
    badge: "IA",
    stats: "Recommandations personnalisées",
    impact: "Analyse sur 12 mois",
  },
  {
    icon: UserCheck,
    title: "Évaluation Clients",
    description: "Évaluez le risque de retard de paiement de chaque client. Recevez un score de fiabilité et des recommandations pour sécuriser vos encaissements.",
    color: "from-pink-500 to-rose-500",
    badge: "B2B",
    stats: "Moins de retards",
    impact: "Prédiction de risque",
  },
];

const powerFeatures = [
  {
    icon: Wallet,
    title: "Multi-Comptes & Devises",
    description: "Gérez tous vos comptes en un seul endroit : comptes bancaires, caisses, portefeuilles crypto. Support de l'Euro, Dinar, Dollar et autres devises avec conversion automatique.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: FolderKanban,
    title: "Organisation par Projet",
    description: "Regroupez vos finances par projet, activité commerciale ou entité juridique. Visualisez la rentabilité de chaque activité séparément.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: PieChart,
    title: "Suivi de Budgets",
    description: "Définissez des budgets mensuels par catégorie. Recevez des alertes quand vous atteignez 80% puis 100% de votre enveloppe.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Receipt,
    title: "Gestion des Transactions",
    description: "Ajoutez, modifiez ou supprimez vos opérations facilement. Recherchez et filtrez vos transactions avec précision.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Upload,
    title: "Import Relevés Bancaires",
    description: "Importez vos relevés bancaires au format CSV ou Excel. Le système reconnaît automatiquement le format et classe vos transactions.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: LineChart,
    title: "Rapports Complets",
    description: "8 types de rapports disponibles : vue d'ensemble, flux de trésorerie, rentabilité, évolution des comptes, analyses par catégorie et bien plus.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Calendar,
    title: "Planification Future",
    description: "Programmez vos dépenses récurrentes (salaires, loyers, abonnements) et anticipez vos projets futurs sur 12 mois.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Users,
    title: "Travail en Équipe",
    description: "Invitez votre comptable ou vos associés. Définissez des rôles et permissions pour chaque membre. Historique complet des actions.",
    color: "from-teal-500 to-green-500",
  },
  {
    icon: Settings,
    title: "Configuration Complète",
    description: "Personnalisez les catégories, configurez la TVA, gérez vos moyens de paiement, paramétrez vos notifications et intégrations.",
    color: "from-slate-500 to-gray-500",
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Vos données sont chiffrées et sauvegardées quotidiennement. Conformité RGPD garantie. Hébergement sécurisé en Europe.",
    color: "from-zinc-500 to-slate-500",
  },
];

const useCases = [
  {
    persona: "Sophie, Agence Web 8 personnes",
    problem: "Je jongle entre Excel et mon banquier. Je dors mal à cause des délais de paiement clients.",
    solution: "Avec Quelyos : alertes quand mes prévisions virent au rouge + scénarios pour tester l'embauche.",
    result: "10 minutes/jour au lieu de 2h/semaine. Je vois à 3 mois sans stress.",
  },
  {
    persona: "Thomas, Bureau d'études 15 pers.",
    problem: "Mes prévisions Excel sont fausses à 70%. Je découvre les problèmes trop tard.",
    solution: "Prophet.js me donne 85-90% de fiabilité. Les alertes me préviennent 2 semaines avant le seuil.",
    result: "Plus jamais d'appel panique au banquier. Croissance sereine.",
  },
  {
    persona: "Leila, Startup SaaS 5 fondateurs",
    problem: "On perd du temps sur la compta au lieu de développer le produit.",
    solution: "Import CSV automatique + dashboard temps réel. 5 minutes pour faire le point.",
    result: "On se concentre sur le code. La tréso roule toute seule.",
  },
];

const benefits = [
  { icon: Clock, text: "Gagnez 90% du temps passé sur Excel" },
  { icon: Target, text: "Fiabilité 85-90% sur les prévisions" },
  { icon: Zap, text: "Alertes proactives en <1 minute" },
  { icon: CheckCircle2, text: "Prise en main en 10 minutes" },
  { icon: TrendingUp, text: "Visibilité à 90 jours garantie" },
  { icon: TrendingDown, text: "Réduisez le stress financier de 80%" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />

      {/* Hero avec Impact */}
      <section className="relative overflow-hidden pb-20 pt-24">
        <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-indigo-500/20 blur-[150px]" />
        <div className="pointer-events-none absolute -right-40 top-60 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[150px]" />

        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" />
              19 fonctionnalités disponibles • Intelligence artificielle intégrée
            </div>

            <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Arrêtez de stresser sur votre{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                trésorerie
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-xl text-slate-300">
              Quelyos vous donne <strong className="text-white">3 mois de visibilité</strong> sur votre cash.
              Prévisions IA fiables à 85-90%, alertes proactives, scénarios what-if.
              <span className="block mt-2 text-indigo-400">10 minutes/jour au lieu de 2h/semaine sur Excel.</span>
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-indigo-500/50 transition-all hover:scale-105 hover:shadow-indigo-500/70"
              >
                Essayer gratuitement 30 jours
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`${config.finance.login}?redirect=/dashboard/demo`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <Sparkles className="h-5 w-5" />
                Voir la démo interactive
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Sans CB • Sans engagement • RGPD compliant • Support inclus
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Bénéfices Clés */}
      <section className="relative py-12 border-y border-white/10 bg-white/5">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-white/5 to-white/10 border border-white/10 px-4 py-3"
              >
                <benefit.icon className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                <span className="text-sm font-medium text-white">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Fonctionnalités Phares */}
      <section className="relative py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              Les 4 fonctionnalités qui{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                changent tout
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Ce qui fait de Quelyos le meilleur outil de trésorerie pour TPE services B2B
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={feature.href}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                  {feature.badge && (
                    <div className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                      {feature.badge}
                    </div>
                  )}

                  <div className={`mb-6 inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-4 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed mb-4">{feature.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-400">
                      {feature.stats}
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-400 transition-all group-hover:gap-3 group-hover:text-indigo-300">
                      Découvrir
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Intelligence Artificielle & ML */}
      <section className="relative py-20 bg-gradient-to-b from-violet-950/20 via-purple-950/10 to-transparent">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[150px]" />

        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
              <Brain className="h-4 w-4" />
              Intelligence artificielle incluse sans surcoût
            </div>

            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              L&apos;intelligence artificielle{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                au service de votre trésorerie
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
              5 assistants intelligents pour automatiser vos tâches répétitives et vous faire gagner du temps.
              <strong className="text-white block mt-2">Testé et approuvé par des centaines d&apos;entreprises.</strong>
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mlFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/20"
              >
                {feature.badge && (
                  <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {feature.badge}
                  </div>
                )}

                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{feature.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Impact</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {feature.stats}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Algorithme</span>
                    <span className="text-xs font-mono text-violet-400">
                      {feature.impact}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap className="h-3 w-3 text-violet-400" />
                    <span>Inclus dans votre abonnement • Sans frais supplémentaires</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-purple-950/30 p-8 text-center backdrop-blur-sm"
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Disponible immédiatement • Aucune configuration requise
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Tous les assistants IA sont déjà actifs dans votre compte
              </h3>
              <p className="text-slate-300 mb-6">
                Dès votre inscription, profitez de la catégorisation automatique, détection des doublons,
                alertes sur les anomalies, suggestions de budgets et évaluation de vos clients. Pas de configuration, ça fonctionne directement.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                  Activation automatique
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                  Aucun surcoût
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                  Disponible 24/7
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                  Mises à jour gratuites
                </span>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Cas d'usage Réels */}
      <section className="relative py-20 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              Ils ont arrêté de{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                stresser
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Découvrez comment Quelyos a transformé leur quotidien
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm"
              >
                <div className="mb-4">
                  <p className="text-sm font-semibold text-indigo-400">{useCase.persona}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Avant</p>
                  <p className="text-sm text-slate-300 italic">&ldquo;{useCase.problem}&rdquo;</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-emerald-500 uppercase mb-2">Avec Quelyos</p>
                  <p className="text-sm text-slate-300">{useCase.solution}</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Résultat</p>
                  <p className="text-sm font-semibold text-white">{useCase.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Toutes les Fonctionnalités */}
      <section className="relative py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Et 10 fonctionnalités supplémentaires
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Tout ce dont vous avez besoin pour piloter votre trésorerie au quotidien
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {powerFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${feature.color} p-2.5`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Final Puissant */}
      <section className="relative py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-purple-950/50 to-pink-950/50 p-12 text-center backdrop-blur-sm"
          >
            <div className="mx-auto max-w-3xl">
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Prêt à piloter votre trésorerie{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  comme un pro
                </span>
                {" "}&#63;
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
                Rejoignez les dirigeants de TPE qui dorment tranquilles grâce à Quelyos.
                <strong className="text-white block mt-2">30 jours gratuits, sans carte bancaire.</strong>
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-purple-500/50 transition-all hover:scale-105"
                >
                  Commencer l&apos;essai gratuit
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Parler à un expert
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Setup en 10 minutes
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Support dédié
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Données sécurisées
                </span>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
