"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Instagram,
  Facebook,
  ArrowRight,
  CheckCircle2,
  Clock,
  Brain,
  PenTool,
  Inbox,
  LineChart,
  Users,
  Globe,
} from "lucide-react";

import config from "@/app/lib/config";
import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Brain,
      title: "IA spécialisée par métier",
      description:
        "Notre IA connaît votre secteur d'activité et génère du contenu adapté à votre clientèle locale.",
      details: [
        "Modèles pré-entraînés pour 50+ métiers",
        "Adaptation au ton de votre marque",
        "Suggestions basées sur les tendances locales",
        "Apprentissage continu de vos préférences",
      ],
    },
    {
      icon: Calendar,
      title: "Calendrier éditorial intelligent",
      description:
        "20 idées de posts générées chaque mois. Planifiez une semaine en 20 minutes.",
      details: [
        "Génération automatique d'idées",
        "Suggestions de dates optimales",
        "Thèmes saisonniers intégrés",
        "Vue mensuelle et hebdomadaire",
      ],
    },
    {
      icon: PenTool,
      title: "Création de contenu assistée",
      description:
        "Textes, hashtags, visuels — tout est généré pour vous, il suffit de valider.",
      details: [
        "Rédaction de légendes percutantes",
        "Suggestions de hashtags pertinents",
        "Création de visuels (Canva intégré)",
        "Adaptation multi-plateformes",
      ],
    },
    {
      icon: Inbox,
      title: "Inbox unifiée",
      description:
        "Commentaires, DMs, avis Google — tout au même endroit avec réponses IA suggérées.",
      details: [
        "Centralisation de tous vos messages",
        "Réponses IA en un clic",
        "Priorisation automatique",
        "Historique client intégré",
      ],
    },
    {
      icon: LineChart,
      title: "Analytics business",
      description:
        "Mesurez ce qui compte : clics, appels, réservations. Pas les vanity metrics.",
      details: [
        "KPIs orientés conversion",
        "Attribution des clients au contenu",
        "Rapports hebdomadaires automatiques",
        "Comparaison avec votre secteur",
      ],
    },
    {
      icon: Users,
      title: "Gestion multi-comptes",
      description:
        "Gérez Instagram et Facebook depuis une seule interface simple.",
      details: [
        "Connexion OAuth sécurisée",
        "Publication simultanée",
        "Prévisualisation par plateforme",
        "Synchronisation automatique",
      ],
    },
  ];

  const platforms = [
    {
      name: "Instagram",
      icon: Instagram,
      color: "from-pink-500 to-purple-600",
    },
    { name: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-700" },
  ];

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <Container className="py-4 flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white">Quelyos Marketing</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/marketing/features"
              className="text-emerald-400 text-sm font-medium"
            >
              Fonctionnalités
            </Link>
            <Link
              href="/tarifs"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/marketing/backlog"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Roadmap
            </Link>
          </nav>
          <Link
            href={config.marketing.login}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            Connexion
          </Link>
        </Container>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Fonctionnalités complètes</span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Tout ce dont vous avez besoin{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-transparent bg-clip-text">
              pour briller sur les réseaux
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Une suite complète d&apos;outils IA conçue spécialement pour les
            TPE. Simple, efficace, orientée résultats.
          </m.p>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-6">
            Plateformes supportées
          </p>
          <div className="flex justify-center gap-8">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-3 text-gray-400"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}
                >
                  <platform.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">{platform.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-medium">Google (bientôt)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-white/5 hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-center gap-2 text-sm text-gray-500"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Time Saving */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-950/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            20 minutes par semaine
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            C&apos;est tout ce qu&apos;il vous faut pour une présence
            professionnelle sur les réseaux sociaux.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gray-900/50 border border-white/5">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                5 min
              </div>
              <div className="text-gray-400">
                Valider les posts de la semaine
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 border border-white/5">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                10 min
              </div>
              <div className="text-gray-400">Répondre aux messages</div>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 border border-white/5">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                5 min
              </div>
              <div className="text-gray-400">Consulter les stats</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à simplifier votre marketing ?
          </h2>
          <p className="text-gray-400 mb-8">
            Testez toutes les fonctionnalités gratuitement pendant 30 jours.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            <span>Essai gratuit 30 jours</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
    </LazyMotion>
  );
}