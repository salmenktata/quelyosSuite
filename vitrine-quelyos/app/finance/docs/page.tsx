"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Book,
  Code,
  FileText,
  Play,
  Rocket,
  Settings,
  Shield,
  Video,
  Zap,
} from "lucide-react";

const sections = [
  {
    icon: Rocket,
    title: "Démarrage rapide",
    description: "Configurez Quelyos en quelques minutes",
    links: [
      { title: "Créer un compte", href: "#" },
      { title: "Connecter vos banques", href: "#" },
      { title: "Importer des transactions", href: "#" },
      { title: "Configurer vos budgets", href: "#" },
    ],
  },
  {
    icon: Book,
    title: "Guides utilisateur",
    description: "Maîtrisez toutes les fonctionnalités",
    links: [
      { title: "Tableau de bord", href: "#" },
      { title: "Comptes & Transactions", href: "#" },
      { title: "Budgets", href: "#" },
      { title: "Prévisions IA", href: "#" },
      { title: "Rapports", href: "#" },
    ],
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Documentation technique pour les développeurs",
    links: [
      { title: "Authentification", href: "#" },
      { title: "Endpoints", href: "#" },
      { title: "Webhooks", href: "#" },
      { title: "SDK & Libraries", href: "#" },
    ],
  },
  {
    icon: Shield,
    title: "Sécurité & Conformité",
    description: "Tout sur la protection de vos données",
    links: [
      { title: "Politique de confidentialité", href: "#" },
      { title: "Certifications", href: "#" },
      { title: "RGPD", href: "#" },
      { title: "Audit & Logs", href: "#" },
    ],
  },
];

const tutorials = [
  {
    icon: Play,
    title: "Premiers pas avec Quelyos",
    duration: "5 min",
    type: "Vidéo",
  },
  {
    icon: Video,
    title: "Configurer vos budgets",
    duration: "8 min",
    type: "Vidéo",
  },
  {
    icon: FileText,
    title: "Utiliser les prévisions IA",
    duration: "10 min",
    type: "Guide",
  },
  {
    icon: Zap,
    title: "Automatiser vos rapports",
    duration: "6 min",
    type: "Guide",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-16 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Book className="mx-auto mb-4 text-violet-400" size={48} />
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Documentation
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Tout ce dont vous avez besoin pour maîtriser Quelyos.
            </p>

            {/* Quick search */}
            <div className="mx-auto mt-8 max-w-lg">
              <input
                type="text"
                placeholder="Rechercher dans la documentation..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Documentation sections */}
      <section className="border-t border-white/5 py-16">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <section.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        <ArrowRight size={14} />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tutorials */}
      <section className="border-t border-white/5 py-16">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-white">
            Tutoriels populaires
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tutorials.map((tutorial, i) => (
              <motion.a
                key={tutorial.title}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-violet-500/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 transition-colors group-hover:bg-violet-500/20">
                  <tutorial.icon size={20} />
                </div>
                <h3 className="font-medium text-white">{tutorial.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>{tutorial.type}</span>
                  <span>•</span>
                  <span>{tutorial.duration}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </Container>
      </section>

      {/* API Status */}
      <section className="border-t border-white/5 py-16">
        <Container narrow>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="font-medium text-white">Statut API</span>
              </div>
              <span className="text-sm text-emerald-400">Tous les services opérationnels</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="text-slate-500">API</p>
                <p className="text-emerald-400">100%</p>
              </div>
              <div>
                <p className="text-slate-500">Dashboard</p>
                <p className="text-emerald-400">100%</p>
              </div>
              <div>
                <p className="text-slate-500">Sync bancaire</p>
                <p className="text-emerald-400">100%</p>
              </div>
              <div>
                <p className="text-slate-500">IA Prévisions</p>
                <p className="text-emerald-400">100%</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Support CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <Settings className="mx-auto mb-4 text-violet-400" size={32} />
          <h2 className="text-2xl font-bold text-white">
            Besoin d&apos;aide supplémentaire ?
          </h2>
          <p className="mt-4 text-slate-400">
            Notre équipe support est là pour vous accompagner.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Contacter le support
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/finance/faq"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-300 ring-1 ring-white/10"
            >
              FAQ
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
