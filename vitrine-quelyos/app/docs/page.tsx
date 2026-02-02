"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Book,
  BookOpen,
  CreditCard,
  HelpCircle,
  Lightbulb,
  Rocket,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";

const sections = [
  {
    icon: Rocket,
    title: "Démarrage rapide",
    description: "Configurez Quelyos en quelques minutes",
    links: [
      { title: "Créer un compte", href: "/register", available: true },
      { title: "Découvrir les fonctionnalités", href: "/finance/features", available: true },
      { title: "Connecter vos banques", href: null, available: false },
      { title: "Premiers pas", href: null, available: false },
    ],
  },
  {
    icon: Book,
    title: "Guides d'utilisation",
    description: "Maîtrisez toutes les fonctionnalités",
    links: [
      { title: "Gestion des comptes", href: null, available: false },
      { title: "Suivi des budgets", href: null, available: false },
      { title: "Prévisions intelligentes", href: null, available: false },
      { title: "Rapports et analyses", href: null, available: false },
    ],
  },
  {
    icon: Shield,
    title: "Sécurité & Confidentialité",
    description: "Protection et conformité de vos données",
    links: [
      { title: "Politique de confidentialité", href: "/legal", available: true },
      { title: "Sécurité des données", href: null, available: false },
      { title: "Conformité RGPD", href: null, available: false },
      { title: "Certifications", href: null, available: false },
    ],
  },
  {
    icon: HelpCircle,
    title: "Aide & Support",
    description: "Obtenez l'assistance dont vous avez besoin",
    links: [
      { title: "Questions fréquentes", href: "/faq", available: true },
      { title: "Contacter le support", href: "/contact", available: true },
      { title: "Statut des services", href: null, available: false },
      { title: "Centre d'aide", href: null, available: false },
    ],
  },
];

const resources = [
  {
    icon: Lightbulb,
    title: "Cas d'usage",
    description: "Découvrez comment Quelyos aide les TPE/PME au quotidien",
    badge: "Bientôt",
    color: "emerald",
  },
  {
    icon: BookOpen,
    title: "Webinaires",
    description: "Sessions live pour maîtriser Quelyos",
    badge: "Bientôt",
    color: "blue",
  },
  {
    icon: Sparkles,
    title: "Nouveautés",
    description: "Restez informé des dernières fonctionnalités",
    badge: "Bientôt",
    color: "violet",
  },
  {
    icon: CreditCard,
    title: "Tarifs & Abonnements",
    description: "Comparez les offres et choisissez la vôtre",
    href: "/tarifs",
    color: "orange",
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
              Guides, tutoriels et ressources pour tirer le meilleur parti de Quelyos Finance.
            </p>
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
                      {link.available && link.href ? (
                        <Link
                          href={link.href}
                          className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                        >
                          <ArrowRight size={14} />
                          {link.title}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <ArrowRight size={14} className="opacity-30" />
                          {link.title}
                          <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                            Bientôt
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Resources */}
      <section className="border-t border-white/5 py-16">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-white">
            Ressources & Outils
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource, i) => {
              const colorClasses = {
                emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
                blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
                violet: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20",
                orange: "bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20",
              };

              const Card = resource.href ? motion(Link) : motion.div;

              return (
                <Card
                  key={resource.title}
                  {...(resource.href ? { href: resource.href } : {})}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-colors ${
                    resource.href ? 'hover:border-violet-500/30 cursor-pointer' : 'opacity-75'
                  }`}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${colorClasses[resource.color as keyof typeof colorClasses]}`}>
                    <resource.icon size={24} />
                  </div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-white">{resource.title}</h3>
                    {resource.badge && (
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-500">
                        {resource.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{resource.description}</p>
                  {resource.href && (
                    <div className="mt-4 flex items-center gap-1 text-sm text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Découvrir
                      <ArrowRight size={14} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Support CTA */}
      <section className="border-t border-white/5 py-24">
        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl"
          >
            <Settings className="mx-auto mb-4 text-violet-400" size={40} />
            <h2 className="text-3xl font-bold text-white">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Notre équipe support est disponible pour répondre à toutes vos questions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Contacter le support
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                Consulter la FAQ
              </Link>
              <Link
                href="/finance/features"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-400 transition-colors hover:text-white"
              >
                Voir les fonctionnalités
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
