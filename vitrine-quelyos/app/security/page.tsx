"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Server,
  AlertTriangle,
  CheckCircle2,
  Key,
  Database,
  FileText,
  Globe,
  Bell,
  Zap,
  ArrowRight,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";

const breadcrumbItems = [
  { name: "Sécurité", url: "https://quelyos.com/security" },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function SecurityPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden pb-12 pt-16">
          <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[120px]" />

          <Container narrow className="relative">
            <Breadcrumbs items={breadcrumbItems} />

            <m.div {...fadeUp} className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300">
                <Shield className="h-3.5 w-3.5" />
                Protection de niveau bancaire
              </div>
              <h1 className="text-4xl font-bold lg:text-5xl">
                Sécurité & Protection des données
              </h1>
              <p className="max-w-2xl text-lg text-slate-400">
                Vos données sont protégées par un chiffrement de niveau bancaire
                et les meilleures pratiques de sécurité du marché.
              </p>
            </m.div>
          </Container>
        </section>

        {/* Highlights */}
        <section className="relative">
          <Container narrow>
            <div className="grid gap-4 sm:grid-cols-3">
              <m.div
                {...fadeUp}
                transition={{ delay: 0 }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Conforme RGPD</h3>
                <p className="text-sm text-slate-400">
                  Conformité totale avec le règlement européen sur la protection
                  des données
                </p>
              </m.div>

              <m.div
                {...fadeUp}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                  <Lock className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Chiffrement AES-256
                </h3>
                <p className="text-sm text-slate-400">
                  Chiffrement de niveau bancaire pour vos données au repos et en
                  transit
                </p>
              </m.div>

              <m.div
                {...fadeUp}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                  <Eye className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Surveillance 24/7
                </h3>
                <p className="text-sm text-slate-400">
                  Détection des menaces en temps réel et réponse automatisée
                </p>
              </m.div>
            </div>
          </Container>
        </section>

        {/* Sections détaillées */}
        <section className="py-16">
          <Container narrow>
            <div className="space-y-8">
              {/* Chiffrement des données */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                    <Lock className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    Chiffrement des données
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                      <Zap className="h-4 w-4 text-indigo-400" />
                      En transit (TLS 1.3)
                    </h3>
                    <p className="text-sm text-slate-300">
                      Toutes les communications entre votre navigateur et nos
                      serveurs sont chiffrées via TLS 1.3 avec confidentialité
                      persistante (PFS). Même en cas de compromission
                      d&apos;une clé, vos échanges passés restent protégés.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                      <Database className="h-4 w-4 text-violet-400" />
                      Au repos (AES-256)
                    </h3>
                    <p className="text-sm text-slate-300">
                      Toutes les données sensibles stockées dans nos bases sont
                      chiffrées en AES-256, le même standard utilisé par les
                      banques et institutions financières. Les clés de
                      chiffrement sont renouvelées régulièrement et stockées
                      séparément.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                      <Key className="h-4 w-4 text-emerald-400" />
                      Protection des mots de passe
                    </h3>
                    <p className="text-sm text-slate-300">
                      Les mots de passe sont hachés avec bcrypt (facteur de coût
                      12), les rendant extrêmement résistants aux attaques par
                      force brute. Nous ne stockons jamais de mot de passe en
                      clair.
                    </p>
                  </div>
                </div>
              </m.section>

              {/* Authentification & Contrôle d'accès */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Key className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    Authentification & Contrôle d&apos;accès
                  </h2>
                </div>
                <div className="space-y-3 text-slate-300">
                  {[
                    {
                      label: "Tokens JWT",
                      desc: "Jetons d\u2019accès à durée limitée avec mécanisme de rafraîchissement sécurisé",
                    },
                    {
                      label: "OAuth 2.0",
                      desc: "Authentification sécurisée via Google et LinkedIn",
                    },
                    {
                      label: "Authentification multi-facteurs (MFA)",
                      desc: "Double authentification optionnelle pour une sécurité renforcée",
                    },
                    {
                      label: "Contrôle d\u2019accès par rôles (RBAC)",
                      desc: "Permissions granulaires par rôle utilisateur",
                    },
                    {
                      label: "Gestion des sessions",
                      desc: "Déconnexion automatique après 7 jours d\u2019inactivité",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                      <div>
                        <strong className="text-white">{item.label} :</strong>{" "}
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </m.section>

              {/* Sécurité de l'infrastructure */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                    <Server className="h-5 w-5 text-violet-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    Sécurité de l&apos;infrastructure
                  </h2>
                </div>
                <div className="space-y-3 text-slate-300">
                  {[
                    {
                      icon: Globe,
                      label: "Data centers européens",
                      desc: "Toutes les données hébergées dans des centres conformes au RGPD en Europe",
                    },
                    {
                      icon: Shield,
                      label: "Protection DDoS",
                      desc: "Protection avancée contre les attaques par déni de service distribué",
                    },
                    {
                      icon: Eye,
                      label: "Détection d\u2019intrusion",
                      desc: "Surveillance en temps réel et réponse automatisée aux menaces",
                    },
                    {
                      icon: Database,
                      label: "Sauvegardes automatiques",
                      desc: "Sauvegardes chiffrées quotidiennes avec rétention de 30 jours",
                    },
                    {
                      icon: Server,
                      label: "Environnements isolés",
                      desc: "Séparation complète entre production, pré-production et développement",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" />
                      <div>
                        <strong className="text-white">{item.label} :</strong>{" "}
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </m.section>

              {/* Conformité */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold">Conformité</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "RGPD",
                      desc: "Conformité totale avec le Règlement Général sur la Protection des Données",
                      active: true,
                    },
                    {
                      title: "Hébergement UE",
                      desc: "Données hébergées exclusivement sur des serveurs situés dans l\u2019Union Européenne",
                      active: true,
                    },
                    {
                      title: "Chiffrement bout en bout",
                      desc: "Données chiffrées en transit et au repos avec les standards les plus élevés",
                      active: true,
                    },
                    {
                      title: "Droit à l\u2019effacement",
                      desc: "Suppression complète de vos données sur simple demande, conformément au RGPD",
                      active: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-lg bg-slate-800/30 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <h3 className="font-semibold text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </m.section>

              {/* Bonnes pratiques */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                    <Shield className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    Bonnes pratiques de sécurité
                  </h2>
                </div>
                <div className="space-y-3 text-slate-300">
                  {[
                    {
                      label: "Audits de sécurité réguliers",
                      desc: "Tests de pénétration trimestriels par des experts indépendants",
                    },
                    {
                      label: "Analyse des dépendances",
                      desc: "Scan automatisé de toutes les dépendances pour détecter les vulnérabilités connues",
                    },
                    {
                      label: "Revue de code",
                      desc: "Chaque modification est revue par des ingénieurs seniors avant déploiement",
                    },
                    {
                      label: "Formation continue",
                      desc: "Sensibilisation régulière de toute l\u2019équipe aux bonnes pratiques de sécurité",
                    },
                    {
                      label: "Plan de réponse aux incidents",
                      desc: "Procédures documentées pour la gestion et la résolution des incidents de sécurité",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                      <span>
                        <strong className="text-white">{item.label} :</strong>{" "}
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </m.section>

              {/* Divulgation responsable */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    Signalement responsable
                  </h2>
                </div>
                <div className="space-y-4 text-slate-300">
                  <p>
                    Nous prenons les vulnérabilités de sécurité très au sérieux.
                    Si vous découvrez une faille, merci de nous la signaler de
                    manière responsable :
                  </p>
                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                      <Bell className="h-4 w-4 text-yellow-400" />
                      Contact sécurité
                    </h3>
                    <p className="text-sm">
                      <strong className="text-white">Email :</strong>{" "}
                      <a
                        href="mailto:security@quelyos.com"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        security@quelyos.com
                      </a>
                    </p>
                  </div>
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                    <p className="text-sm">
                      <strong className="text-yellow-300">
                        Programme Bug Bounty :
                      </strong>{" "}
                      Nous offrons des récompenses pour les vulnérabilités
                      signalées de manière responsable. Contactez{" "}
                      <a
                        href="mailto:security@quelyos.com"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        security@quelyos.com
                      </a>{" "}
                      pour en savoir plus.
                    </p>
                  </div>
                </div>
              </m.section>

              {/* CTA */}
              <m.section
                {...fadeUp}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-violet-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
              >
                <Shield className="mx-auto mb-4 h-12 w-12 text-indigo-400" />
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Vos données en sécurité
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                  Essayez Quelyos gratuitement pendant 30 jours. Vos données
                  sont protégées dès la première seconde.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
                  >
                    Essai gratuit 30 jours
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
                  >
                    Nous contacter
                  </Link>
                </div>
                <p className="mt-6 text-sm text-slate-400">
                  Sans carte bancaire &bull; Données chiffrées &bull; Conforme
                  RGPD
                </p>
              </m.section>
            </div>
          </Container>
        </section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
