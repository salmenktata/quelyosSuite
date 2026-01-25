"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Globe,
  Palette,
  Users,
  CreditCard,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";

import config from "@/app/lib/config";
const challenges = [
  {
    icon: Layers,
    title: "Projets multiples",
    description: "Gérez simultanément plusieurs sites clients.",
  },
  {
    icon: Calendar,
    title: "Acomptes et soldes",
    description: "Suivez les paiements échelonnés de vos projets.",
  },
  {
    icon: Users,
    title: "Freelances",
    description: "Intégrez les paiements sous-traitants dans vos marges.",
  },
  {
    icon: CreditCard,
    title: "Abonnements récurrents",
    description: "Hébergement, maintenance, licences à refacturer.",
  },
];

const benefits = [
  "Rentabilité par projet web",
  "Suivi des acomptes clients",
  "Gestion des freelances",
  "Prévision de charge",
  "Alertes de retard de paiement",
  "Export pour expert-comptable",
];

export default function AgenceWebPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-400">
              <Globe size={16} />
              Solution sectorielle
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Quelyos pour les
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                agences web
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Pilotez la rentabilité de vos projets web, gérez vos freelances 
              et anticipez votre trésorerie.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Conçu pour votre réalité
            </h2>
            <p className="mt-4 text-slate-400">
              Les agences digitales jonglent entre projets, délais et trésorerie.
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
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <challenge.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{challenge.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6">
                <h3 className="mb-4 font-semibold text-white">Projet : Refonte e-commerce</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Devis</p>
                    <p className="text-lg font-bold text-white">18 500 €</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Acompte reçu</p>
                    <p className="text-lg font-bold text-emerald-400">7 400 €</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Freelances</p>
                    <p className="text-lg font-bold text-amber-400">3 200 €</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Marge nette</p>
                    <p className="text-lg font-bold text-white">62%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-white">
                Fonctionnalités clés
              </h2>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            +200 agences utilisent Quelyos
          </h2>
          <div className="mt-8">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Essayer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}