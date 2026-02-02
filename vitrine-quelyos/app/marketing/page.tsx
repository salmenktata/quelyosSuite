"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Instagram,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Users,
  TrendingUp,
  Store,
  Coffee,
  Scissors,
  Heart,
  Facebook,
  Lightbulb,
  Target,
  Shield,
  DollarSign,
  Star,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";
import config from "../lib/config";

export default function MarketingPage() {
  const stats = [
    { value: "20 min", label: "par semaine max", icon: Clock },
    { value: "0", label: "expertise requise", icon: Lightbulb },
    { value: "+35%", label: "de clients en moyenne", icon: TrendingUp },
    { value: "99€", label: "par mois seulement", icon: DollarSign },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Zéro stress, tout automatisé",
      description:
        "L'IA s'occupe de tout : création, planification, publication. Vous validez juste en 5 minutes.",
    },
    {
      icon: Target,
      title: "Contenu adapté à VOTRE métier",
      description:
        "L'IA connaît votre secteur. Elle génère du contenu pertinent pour restaurants, coiffeurs, commerces...",
    },
    {
      icon: TrendingUp,
      title: "Des clients, pas juste des likes",
      description:
        "Notre objectif : générer du business. Analytics focus ROI, pas vanity metrics.",
    },
    {
      icon: DollarSign,
      title: "Prix TPE, résultats pro",
      description:
        "Moins cher qu'une agence, plus efficace qu'un stagiaire. Module Marketing à partir de 9€/mois.",
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Génération IA sectorielle",
      description:
        "L'IA crée 4-5 posts par semaine adaptés à votre métier. Textes + visuels + hashtags optimisés.",
      highlight: "Gain de 10h/semaine",
    },
    {
      icon: Calendar,
      title: "Calendrier éditorial intelligent",
      description:
        "L'IA analyse votre audience et suggère les meilleurs horaires. Publication automatique aux moments optimaux.",
      highlight: "+40% d'engagement",
    },
    {
      icon: ImageIcon,
      title: "Création visuelle simplifiée",
      description:
        "Templates sectoriels + IA générative d'images. Visuels professionnels en 2 clics, sans Canva.",
      highlight: "Design pro sans designer",
    },
    {
      icon: MessageSquare,
      title: "Inbox unifiée avec IA",
      description:
        "Tous vos messages FB/IG centralisés. L'IA suggère des réponses intelligentes. Répondez 3x plus vite.",
      highlight: "Temps de réponse divisé par 3",
    },
    {
      icon: BarChart3,
      title: "Analytics business orientés ROI",
      description:
        "Mesurez ce qui compte : leads générés, taux de conversion, clients acquis. Pas juste des likes.",
      highlight: "ROI mesurable",
    },
    {
      icon: Users,
      title: "Multi-comptes & collaboration",
      description:
        "Gérez plusieurs pages, invitez votre équipe. FB, IG aujourd'hui. TikTok et LinkedIn en 2026.",
      highlight: "Équipe jusqu'à 5 membres",
    },
  ];

  const useCases = [
    {
      sector: "Restaurant",
      icon: Coffee,
      before: "Pas de posts réguliers, clients qui oublient...",
      after: "Plat du jour automatique + stories. Réservations +40%",
      color: "from-orange-500 to-red-500",
    },
    {
      sector: "Coiffeur",
      icon: Scissors,
      before: "Pas le temps de poster entre 2 clientes...",
      after: "Avant/après auto-postés. RDV en ligne +50%",
      color: "from-pink-500 to-rose-500",
    },
    {
      sector: "Commerce",
      icon: Store,
      before: "Stories improvisées, pas de stratégie...",
      after: "Nouveautés planifiées. Trafic boutique +35%",
      color: "from-purple-500 to-violet-500",
    },
    {
      sector: "Bien-être",
      icon: Heart,
      before: "Contenu irrégulier, visibilité faible...",
      after: "Conseils + promos automatiques. Clients +45%",
      color: "from-teal-500 to-cyan-500",
    },
  ];

  const roadmapItems = [
    {
      phase: "V1 - Disponible",
      status: "done",
      items: [
        "Connexion Meta OAuth",
        "Éditeur posts simplifié",
        "Génération IA contenu",
        "Publication Instagram/FB",
      ],
    },
    {
      phase: "V1.5 - Q1 2026",
      status: "current",
      items: [
        "Inbox unifiée",
        "Réponses IA suggérées",
        "Analytics de base",
        "Templates sectoriels",
      ],
    },
    {
      phase: "V2 - Q2 2026",
      status: "upcoming",
      items: [
        "Calendrier éditorial avancé",
        "Multi-pages gestion",
        "Analytics business",
        "TikTok intégration",
      ],
    },
    {
      phase: "V3 - 2027",
      status: "future",
      items: [
        "LinkedIn intégration",
        "Campagnes publicitaires",
        "Expansion Maghreb",
        "App mobile",
      ],
    },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950/30 to-slate-950">
        <Header />

      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
        <Container className="relative">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm text-pink-300">
              <Sparkles className="h-4 w-4" />
              Marketing Social Media • Email & SMS
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Quelyos Marketing
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-300">
              Le marketing social media enfin simple pour les TPE.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Plus de stress, plus d&apos;excuses. Instagram et Facebook gérés
              automatiquement. Conçu pour restaurants, coiffeurs, commerces et
              artisans.
            </p>

            {/* Stats rapides */}
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded-xl border border-pink-500/20 bg-slate-900/50 p-4 backdrop-blur-sm"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-pink-400" />
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </m.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={config.marketing.register}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-pink-500/40"
              >
                Essai gratuit 30 jours
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
              ✨ Sans engagement • Sans carte bancaire • Support inclus
            </p>
          </m.div>
        </Container>
      </section>

      {/* Platforms */}
      <section className="relative py-12">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/50 px-6 py-3">
              <Instagram className="h-6 w-6 text-pink-400" />
              <span className="text-white">Instagram</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/50 px-6 py-3">
              <Facebook className="h-6 w-6 text-blue-400" />
              <span className="text-white">Facebook</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/30 px-6 py-3 opacity-50">
              <span className="text-slate-400">TikTok</span>
              <span className="text-xs text-slate-500">(bientôt)</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/30 px-6 py-3 opacity-50">
              <span className="text-slate-400">LinkedIn</span>
              <span className="text-xs text-slate-500">(2027)</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="relative border-y border-white/10 bg-slate-900/50 py-20">
        <Container>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pourquoi Quelyos Marketing ?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Parce que vous avez mieux à faire que de stresser sur Instagram
            </p>
          </m.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-pink-500/20 bg-slate-900/70 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-400">{benefit.description}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative scroll-mt-24 py-20">
        <Container>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Fonctionnalités clés
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Tout ce qu&apos;il faut pour gérer vos réseaux sociaux sans stress
            </p>
          </m.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-xl border border-pink-500/20 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-pink-500/40 hover:bg-slate-900/70"
              >
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-3">
                  <feature.icon className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mb-4 text-sm text-slate-400">
                  {feature.description}
                </p>
                {feature.highlight && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400">
                    <Star className="h-3 w-3" />
                    {feature.highlight}
                  </div>
                )}
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Cases - Avant/Après */}
      <section
        id="sectors"
        className="relative border-y border-white/10 bg-slate-900/50 py-20 scroll-mt-24"
      >
        <Container>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Avant / Après Quelyos
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Résultats réels de TPE qui utilisent notre solution (bêta privée)
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
                className="relative overflow-hidden rounded-xl border border-pink-500/20 bg-slate-900/70 p-6"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-5`}
                />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/20">
                    <useCase.icon className="h-7 w-7 text-pink-400" />
                  </div>
                  <h3 className="mb-4 text-center font-semibold text-white">
                    {useCase.sector}
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                      <p className="text-xs font-medium text-red-400 mb-1">
                        ❌ Avant
                      </p>
                      <p className="text-sm text-slate-300">{useCase.before}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                      <p className="text-xs font-medium text-emerald-400 mb-1">
                        ✅ Après
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

      {/* How it works */}
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
              3 étapes, 20 minutes par semaine
            </p>
          </m.div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "L'IA propose",
                description:
                  "Chaque semaine, l'IA génère 4-5 posts adaptés à votre secteur et votre actualité.",
                icon: Sparkles,
              },
              {
                step: "2",
                title: "Vous validez",
                description:
                  "Modifiez si besoin, choisissez les horaires de publication. 5 minutes max.",
                icon: CheckCircle,
              },
              {
                step: "3",
                title: "On publie",
                description:
                  "Vos posts sont publiés automatiquement. Analysez les résultats dans le dashboard.",
                icon: Calendar,
              },
            ].map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-xl border border-pink-500/20 bg-slate-900/50 p-8 text-center"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-bold text-white">
                    {item.step}
                  </div>
                </div>
                <div className="mx-auto mb-4 mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/20">
                  <item.icon className="h-7 w-7 text-pink-400" />
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
                  phase.status === "current"
                    ? "border-pink-500/50 bg-pink-950/30"
                    : phase.status === "upcoming"
                      ? "border-yellow-500/30 bg-yellow-950/20"
                      : "border-white/10 bg-slate-900/30"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{phase.phase}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      phase.status === "current"
                        ? "bg-pink-500/20 text-pink-400"
                        : phase.status === "upcoming"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {phase.status === "current"
                      ? "En cours"
                      : phase.status === "upcoming"
                        ? "Prochain"
                        : "Planifié"}
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
                          phase.status === "current"
                            ? "text-pink-400"
                            : phase.status === "upcoming"
                              ? "text-yellow-400"
                              : "text-slate-500"
                        }
                      >
                        ○
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </m.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/marketing/roadmap"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300"
            >
              Voir la roadmap complète
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* CTA final */}
      <section className="relative py-20">
        <Container narrow>
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10" />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Prêt à simplifier votre marketing ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                30 jours d&apos;essai gratuit, sans engagement. L&apos;IA gère vos
                réseaux sociaux pendant que vous vous concentrez sur votre métier.
              </p>

              {/* Mini benefits */}
              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-4">
                <div className="rounded-lg border border-pink-500/20 bg-slate-900/50 p-3">
                  <div className="text-2xl font-bold text-pink-400">30j</div>
                  <div className="text-xs text-slate-400">essai gratuit</div>
                </div>
                <div className="rounded-lg border border-pink-500/20 bg-slate-900/50 p-3">
                  <div className="text-2xl font-bold text-pink-400">99€</div>
                  <div className="text-xs text-slate-400">par mois</div>
                </div>
                <div className="rounded-lg border border-pink-500/20 bg-slate-900/50 p-3">
                  <div className="text-2xl font-bold text-pink-400">
                    IA
                  </div>
                  <div className="text-xs text-slate-400">intégrée</div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={config.marketing.register}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-pink-500/40"
                >
                  Essai gratuit 30 jours
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                ✨ Sans engagement • Sans carte bancaire • Annulation à tout moment
              </p>
            </div>
          </m.div>
        </Container>
      </section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
