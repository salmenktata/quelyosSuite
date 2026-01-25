"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import { ArrowRight, ChevronDown, HelpCircle, Search } from "lucide-react";

const categories = [
  { id: "general", label: "Général" },
  { id: "account", label: "Compte & Facturation" },
  { id: "features", label: "Fonctionnalités" },
  { id: "security", label: "Sécurité & Données" },
  { id: "integration", label: "Intégrations" },
];

const faqs = [
  {
    category: "general",
    question: "Qu'est-ce que Quelyos ?",
    answer:
      "Quelyos est une plateforme de gestion financière conçue pour les TPE et indépendants français. Elle permet de centraliser vos comptes bancaires, suivre vos dépenses, gérer vos budgets et anticiper votre trésorerie grâce à l'intelligence artificielle.",
  },
  {
    category: "general",
    question: "Quelyos est-il gratuit ?",
    answer:
      "Oui, Quelyos propose un plan gratuit avec les fonctionnalités essentielles. Des plans payants (Pro, Team, Enterprise) offrent des fonctionnalités avancées comme les prévisions IA, les rapports illimités et le support prioritaire.",
  },
  {
    category: "general",
    question: "Combien de temps faut-il pour démarrer ?",
    answer:
      "L'inscription prend moins de 2 minutes. La connexion de vos comptes bancaires peut prendre quelques minutes supplémentaires. Vous aurez une vue complète de vos finances en moins de 10 minutes.",
  },
  {
    category: "account",
    question: "Comment modifier mon abonnement ?",
    answer:
      "Rendez-vous dans Paramètres > Abonnement pour modifier votre plan. Les changements prennent effet immédiatement et sont calculés au prorata.",
  },
  {
    category: "account",
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui, vous pouvez annuler votre abonnement à tout moment depuis les paramètres. Vous conservez l'accès jusqu'à la fin de la période facturée.",
  },
  {
    category: "account",
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et les prélèvements SEPA pour les entreprises.",
  },
  {
    category: "features",
    question: "Comment fonctionne la synchronisation bancaire ?",
    answer:
      "Quelyos se connecte à vos banques via des protocoles sécurisés (DSP2) pour importer automatiquement vos transactions. La synchronisation se fait plusieurs fois par jour.",
  },
  {
    category: "features",
    question: "Puis-je importer des transactions manuellement ?",
    answer:
      "Oui, vous pouvez importer des fichiers CSV ou saisir des transactions manuellement si vous n'utilisez pas la synchronisation automatique.",
  },
  {
    category: "features",
    question: "Comment fonctionnent les prévisions IA ?",
    answer:
      "Notre algorithme analyse votre historique de transactions pour prédire vos flux de trésorerie futurs. Il prend en compte la saisonnalité, les récurrences et vos habitudes de dépenses.",
  },
  {
    category: "security",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Nous utilisons un chiffrement AES-256, nos serveurs sont hébergés en France, et nous sommes conformes au RGPD. Nous ne stockons jamais vos identifiants bancaires.",
  },
  {
    category: "security",
    question: "Qui a accès à mes données ?",
    answer:
      "Seuls vous et les membres de votre équipe (si vous êtes en plan Team) avez accès à vos données. Notre équipe support peut accéder à vos données uniquement avec votre autorisation explicite.",
  },
  {
    category: "integration",
    question: "Quelyos s'intègre-t-il avec mon logiciel comptable ?",
    answer:
      "Oui, nous proposons des exports compatibles avec la plupart des logiciels comptables français (Sage, Cegid, etc.) ainsi qu'une API pour les intégrations personnalisées.",
  },
  {
    category: "integration",
    question: "Proposez-vous une API ?",
    answer:
      "Oui, notre API REST est disponible pour les plans Team et Enterprise. Elle permet d'intégrer Quelyos à vos outils existants.",
  },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-16 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <HelpCircle className="mx-auto mb-4 text-indigo-400" size={48} />
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Questions fréquentes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Trouvez rapidement les réponses à vos questions.
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une question..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Categories */}
      <section className="border-t border-white/5">
        <Container narrow>
          <div className="flex flex-wrap justify-center gap-2 py-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-indigo-500 text-white"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ list */}
      <section className="py-16">
        <Container>
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/5 bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 py-4">
                        <p className="text-slate-400">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <p className="text-slate-400">Aucune question trouvée.</p>
            </div>
          )}
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-2xl font-bold text-white">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h2>
          <p className="mt-4 text-slate-400">
            Notre équipe est disponible pour vous aider.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/finance/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Contacter le support
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/finance/docs"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-300 ring-1 ring-white/10"
            >
              Documentation
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
