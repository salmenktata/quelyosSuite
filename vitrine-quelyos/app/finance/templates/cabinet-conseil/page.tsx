"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Briefcase,
  Users,
  Clock,
  FileText,
  TrendingUp,
  Calculator,
  CheckCircle2,
} from "lucide-react";

import config from "@/app/lib/config";
const challenges = [
  {
    icon: Clock,
    title: "Gestion du temps facturable",
    description: "Suivez les heures passées par mission et client.",
  },
  {
    icon: FileText,
    title: "Notes de frais",
    description: "Déplacements clients, repas d'affaires, logistique.",
  },
  {
    icon: Users,
    title: "Multi-consultants",
    description: "Vision consolidée de l'activité de votre équipe.",
  },
  {
    icon: Calculator,
    title: "Marges par mission",
    description: "Calculez la rentabilité réelle de chaque projet.",
  },
];

const benefits = [
  "Facturation simplifiée par projet",
  "Suivi des paiements clients",
  "Prévisionnel de trésorerie",
  "Export comptable automatique",
  "Tableaux de bord par consultant",
  "Alertes de dépassement budget",
];

export default function CabinetConseilPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
              <Briefcase size={16} />
              Solution sectorielle
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Quelyos pour les
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                cabinets de conseil
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Gérez la complexité financière de votre cabinet : missions multiples, 
              consultants, notes de frais et facturation client.
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

      {/* Challenges */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Vos défis, nos solutions
            </h2>
            <p className="mt-4 text-slate-400">
              Les cabinets de conseil ont des besoins spécifiques en gestion financière.
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
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <challenge.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{challenge.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Tout ce qu&apos;il vous faut
              </h2>
              <p className="mt-4 text-slate-400">
                Quelyos s&apos;adapte aux spécificités de votre métier de conseil.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Mission : Transformation digitale</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                  En cours
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Budget</span>
                  <span className="text-white">45 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Facturé</span>
                  <span className="text-emerald-400">32 500 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Marge</span>
                  <span className="text-white">68%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[72%] rounded-full bg-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Rejoignez +150 cabinets de conseil
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