"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Bell,
  Mail,
  TrendingDown,
  Target,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
} from "lucide-react";

import config from "@/app/lib/config";

const alertTypes = [
  {
    icon: Target,
    title: "Seuil de Trésorerie",
    description: "Alerte déclenchée quand votre solde passe sous un montant critique",
    example: "Ex: Alerte si solde < 5 000€",
    color: "amber",
  },
  {
    icon: TrendingDown,
    title: "Prévision Négative",
    description: "Détection anticipée de trésorerie négative dans les 30, 60 ou 90 jours",
    example: "Ex: Solde négatif prévu dans 45j",
    color: "rose",
  },
  {
    icon: AlertTriangle,
    title: "Variance vs Prévision",
    description: "Écart significatif entre vos prévisions et la réalité",
    example: "Ex: Écart >20% vs prévision",
    color: "orange",
  },
];

const features = [
  {
    icon: Mail,
    title: "Notifications Email",
    description: "Emails automatiques via Resend avec design professionnel et contexte complet",
  },
  {
    icon: Zap,
    title: "Temps Réel + Quotidien",
    description: "Évaluation après chaque transaction confirmée + scan quotidien à 8h",
  },
  {
    icon: Clock,
    title: "Cooldown Anti-Spam",
    description: "Configurez la fréquence maximale : 1x/heure, 1x/jour, 1x/3 jours",
  },
  {
    icon: Shield,
    title: "Test Dry-Run",
    description: "Testez vos alertes avant activation pour vérifier les conditions",
  },
];

export default function AlertsFeaturePage() {
  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-red-500/15 blur-[120px]" />

        <Container className="relative">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm text-red-400">
              <Bell size={16} />
              Nouveau
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Soyez averti
              <br />
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                avant qu&apos;il ne soit trop tard
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Configurez des alertes proactives qui vous préviennent par email quand votre
              trésorerie approche d&apos;un seuil critique ou si vos prévisions virent au rouge.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Activer les alertes
                <ArrowRight size={16} />
              </Link>
            </div>
          </m.div>

          {/* Alert Preview */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-red-500/20 bg-slate-900/80 shadow-2xl">
              <div className="border-b border-white/5 bg-red-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Bell className="text-red-400" size={20} />
                  <h3 className="font-semibold text-white">🚨 Alerte Trésorerie</h3>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                    Critique
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-4 text-white">
                  <strong>Bonjour Sophie,</strong>
                </p>
                <p className="mb-4 text-slate-300">
                  Votre trésorerie est passée sous le seuil critique de 5 000€.
                </p>
                <div className="mb-4 flex items-center justify-around rounded-lg bg-slate-800/50 p-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Solde actuel</p>
                    <p className="mt-1 text-2xl font-bold text-red-400">3 450€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Seuil d&apos;alerte</p>
                    <p className="mt-1 text-2xl font-bold text-amber-400">5 000€</p>
                  </div>
                </div>
                <div className="text-center">
                  <button className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 font-semibold text-white">
                    Voir la trésorerie →
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        </Container>
      </section>

      {/* Types d'alertes */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">3 types d&apos;alertes</h2>
            <p className="mt-4 text-slate-400">Choisissez les alertes qui correspondent à vos besoins</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {alertTypes.map((alert, i) => (
              <m.div
                key={alert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border border-${alert.color}-500/20 bg-${alert.color}-500/5 p-6`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${alert.color}-500/10 text-${alert.color}-400`}>
                  <alert.icon size={24} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{alert.title}</h3>
                <p className="mb-4 text-sm text-slate-400">{alert.description}</p>
                <p className="text-xs text-slate-500">{alert.example}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Fonctionnalités */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <feature.icon size={20} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Case */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8"
            >
              <p className="mb-4 text-lg text-white">
                &ldquo;Grâce aux alertes, j&apos;ai été prévenue 2 semaines avant de passer sous mon seuil critique.
                J&apos;ai pu négocier un délai avec mon fournisseur et éviter le découvert.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  S
                </div>
                <div>
                  <p className="font-semibold text-white">Sophie M.</p>
                  <p className="text-sm text-slate-400">Agence Web, 8 personnes</p>
                </div>
              </div>
            </m.div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Ne découvrez plus vos problèmes trop tard</h2>
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
    </LazyMotion>
  );
}
