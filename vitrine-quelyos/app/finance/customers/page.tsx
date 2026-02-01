"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import { ArrowRight, Star, Quote } from "lucide-react";

import config from "@/app/lib/config";
const testimonials = [
  {
    quote: "Quelyos a transformé notre gestion financière. En 3 mois, nous avons gagné 10h par semaine sur l'administratif.",
    author: "Marie Duval",
    role: "CEO",
    company: "Studio Créatif",
    sector: "Agence web",
    avatar: "MD",
  },
  {
    quote: "L'IA de prévision nous a évité un trou de trésorerie. Indispensable pour une startup en croissance.",
    author: "Thomas Leroy",
    role: "CFO",
    company: "DataFlow",
    sector: "SaaS B2B",
    avatar: "TL",
  },
  {
    quote: "Enfin un outil pensé pour les indépendants. Simple, efficace et les rapports sont parfaits pour mon comptable.",
    author: "Sophie Martin",
    role: "Consultante",
    company: "SM Conseil",
    sector: "Cabinet conseil",
    avatar: "SM",
  },
  {
    quote: "La synchronisation bancaire automatique nous fait gagner un temps fou. Plus d'erreurs de saisie !",
    author: "Pierre Blanc",
    role: "Directeur",
    company: "Agence Horizon",
    sector: "Marketing digital",
    avatar: "PB",
  },
  {
    quote: "Dashboard magnifique, UX au top. On voit que c'est pensé par des gens qui comprennent les TPE.",
    author: "Claire Fontaine",
    role: "Fondatrice",
    company: "Atelier Design",
    sector: "Design",
    avatar: "CF",
  },
  {
    quote: "Le suivi des projets et la facturation intégrée ont changé notre façon de travailler.",
    author: "Nicolas Dupont",
    role: "Associé",
    company: "Cabinet NovaTech",
    sector: "Conseil IT",
    avatar: "ND",
  },
];

const stats = [
  { value: "2 500+", label: "Entreprises" },
  { value: "15M€", label: "Gérés chaque mois" },
  { value: "98%", label: "Satisfaction" },
  { value: "4.9/5", label: "Note moyenne" },
];

const logos = [
  "Studio Créatif",
  "DataFlow",
  "Agence Horizon",
  "NovaTech",
  "Atelier Design",
  "SM Conseil",
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Ils nous font
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                confiance
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Des milliers d&apos;entreprises utilisent Quelyos pour 
              gérer leurs finances. Découvrez leurs témoignages.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-6 text-center"
                  >
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Logos */}
      <section className="border-t border-white/5 py-16">
        <Container>
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-slate-500">
            Ils utilisent Quelyos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo) => (
              <div
                key={logo}
                className="flex h-12 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] px-6"
              >
                <span className="font-medium text-slate-400">{logo}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials grid */}
      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Ce qu&apos;ils en disent</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote size={24} className="mb-3 text-indigo-400/50" />
                <p className="text-slate-300">{testimonial.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-400">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-white">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Rejoignez-les
          </h2>
          <p className="mt-4 text-slate-400">
            Créez votre compte gratuitement et découvrez pourquoi ils nous font confiance.
          </p>
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
  );
}