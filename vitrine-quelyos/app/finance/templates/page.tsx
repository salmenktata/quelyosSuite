"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Briefcase,
  Code,
  Rocket,
  Building2,
  CheckCircle2,
} from "lucide-react";

import config from "@/app/lib/config";
const templates = [
  {
    id: "cabinet-conseil",
    name: "Cabinet de conseil",
    icon: Briefcase,
    description: "Gérez missions, consultants et notes de frais avec précision.",
    color: "indigo",
    features: ["Suivi par mission", "Facturation client", "Marges projet", "Multi-consultants"],
    href: "/templates/cabinet-conseil",
  },
  {
    id: "agence-web",
    name: "Agence web & digitale",
    icon: Code,
    description: "Pilotez vos projets web, freelances et paiements échelonnés.",
    color: "violet",
    features: ["Rentabilité projet", "Gestion freelances", "Acomptes clients", "Prévision charge"],
    href: "/templates/agence-web",
  },
  {
    id: "startup-saas",
    name: "Startup SaaS",
    icon: Rocket,
    description: "MRR, ARR, churn, burn rate — tous vos KPIs SaaS en un clic.",
    color: "emerald",
    features: ["Dashboard MRR/ARR", "Intégration Stripe", "Suivi runway", "Rapports investisseurs"],
    href: "/templates/startup-saas",
  },
];

const stats = [
  { value: "650+", label: "Entreprises utilisent nos templates" },
  { value: "3x", label: "Plus rapide à configurer" },
  { value: "98%", label: "Taux de satisfaction" },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-400">
              <Building2 size={16} />
              Solutions sectorielles
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Templates adaptés
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                à votre métier
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Chaque secteur a ses spécificités. Nos templates préconfigurés 
              vous permettent de démarrer en quelques minutes avec les bonnes catégories, 
              budgets et indicateurs.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-3xl">
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Templates grid */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Choisissez votre secteur</h2>
            <p className="mt-4 text-slate-400">
              Sélectionnez le template qui correspond à votre activité.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {templates.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={template.href}
                  className="group block h-full rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${template.color}-500/10 text-${template.color}-400`}>
                    <template.icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{template.description}</p>
                  
                  <ul className="mt-6 space-y-2">
                    {template.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-violet-400 transition-colors group-hover:text-violet-300">
                    Découvrir
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Comment ça marche ?</h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Choisissez",
                  description: "Sélectionnez le template adapté à votre secteur d'activité.",
                },
                {
                  step: "2",
                  title: "Personnalisez",
                  description: "Ajustez les catégories et budgets selon vos besoins spécifiques.",
                },
                {
                  step: "3",
                  title: "Démarrez",
                  description: "Connectez vos comptes et commencez à piloter vos finances.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-lg font-bold text-violet-400">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Prêt à démarrer ?
          </h2>
          <p className="mt-4 text-slate-400">
            Créez votre compte et choisissez votre template pour commencer.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Commencer gratuitement
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/finance/contact"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-300 ring-1 ring-white/10"
            >
              Demander une démo
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}