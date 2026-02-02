"use client";

import { useState } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import { ArrowRight, ChevronDown, HelpCircle, Search } from "lucide-react";
import { FAQPageSchema } from "@/app/components/StructuredData";

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
      "Quelyos est une suite de gestion complète pour TPE et PME. Elle regroupe 7 modules : Finance (trésorerie et comptabilité), Boutique e-commerce, Stock, CRM, Marketing, RH et Tableau de bord. Chaque module communique avec les autres pour une gestion unifiée de votre entreprise.",
  },
  {
    category: "general",
    question: "Quelyos est-il gratuit ?",
    answer:
      "Oui, Quelyos propose un essai gratuit de 30 jours sans carte bancaire. Après l'essai, le plan de base démarre à 9€/mois avec 1 module au choix inclus. Ajoutez ensuite les modules dont vous avez besoin (de 5€ à 19€/mois chacun). Offre Enterprise sur devis.",
  },
  {
    category: "general",
    question: "Combien de temps faut-il pour démarrer ?",
    answer:
      "L'inscription prend 2 minutes. Vous pouvez importer vos données existantes (clients, produits, transactions) via CSV en quelques clics. Votre tableau de bord est opérationnel en moins de 10 minutes.",
  },
  {
    category: "general",
    question: "Quelle est la différence entre Quelyos et un logiciel comptable classique ?",
    answer:
      "Quelyos va au-delà de la comptabilité : prévisions automatiques à 90 jours, alertes proactives sur votre trésorerie, boutique e-commerce intégrée, gestion de stock, CRM clients... Le tout dans une seule interface moderne et facile à utiliser.",
  },
  {
    category: "account",
    question: "Comment modifier mon abonnement ?",
    answer:
      "Rendez-vous dans Paramètres > Abonnement pour changer de plan. Les modifications sont immédiates et le montant est ajusté automatiquement. Vous pouvez passer au plan supérieur ou inférieur à tout moment.",
  },
  {
    category: "account",
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui, aucun engagement. Vous pouvez annuler votre abonnement en 1 clic depuis les paramètres. Vous conservez l'accès jusqu'à la fin du mois payé et vos données restent disponibles 30 jours après l'annulation.",
  },
  {
    category: "account",
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal et les virements bancaires pour les plans annuels. Les paiements sont sécurisés et chiffrés.",
  },
  {
    category: "account",
    question: "Puis-je essayer avant de payer ?",
    answer:
      "Absolument ! Profitez de 30 jours d'essai gratuit avec accès complet à tous les modules. Aucune carte bancaire requise pour démarrer l'essai.",
  },
  {
    category: "features",
    question: "Comment importer mes données bancaires ?",
    answer:
      "Vous pouvez importer vos relevés bancaires au format CSV ou Excel en quelques clics. Le système reconnaît automatiquement les colonnes et classe vos transactions. La synchronisation bancaire automatique arrive en 2026.",
  },
  {
    category: "features",
    question: "Puis-je ajouter des transactions manuellement ?",
    answer:
      "Oui, vous pouvez saisir vos transactions une par une ou les importer en lot via CSV. Chaque transaction peut être catégorisée automatiquement par l'intelligence artificielle.",
  },
  {
    category: "features",
    question: "Comment fonctionnent les prévisions automatiques ?",
    answer:
      "L'intelligence artificielle analyse votre historique financier pour prédire votre trésorerie à 30, 60 et 90 jours. Elle détecte vos habitudes de dépenses, la saisonnalité de votre activité et les paiements récurrents pour vous projeter dans l'avenir avec précision.",
  },
  {
    category: "features",
    question: "Qu'est-ce que le simulateur de décisions ?",
    answer:
      "Testez l'impact de vos décisions avant de vous engager : embaucher un salarié, acheter du matériel, perdre un client... Le simulateur calcule instantanément l'effet sur votre trésorerie future.",
  },
  {
    category: "features",
    question: "Les assistants IA sont-ils vraiment gratuits ?",
    answer:
      "Oui ! Les 5 assistants IA (catégorisation automatique, détection de doublons, alertes anomalies, suggestions de budgets, évaluation clients) sont inclus dans tous les plans sans surcoût. Ils s'activent automatiquement dès votre inscription.",
  },
  {
    category: "security",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Vos données sont chiffrées avec les mêmes standards que les banques, sauvegardées quotidiennement et hébergées en Europe. Nous sommes conformes au RGPD et ne vendons jamais vos données à des tiers.",
  },
  {
    category: "security",
    question: "Qui a accès à mes données ?",
    answer:
      "Seuls vous et les membres que vous invitez (comptable, associés) ont accès à vos données. Notre équipe ne peut y accéder que si vous nous y autorisez explicitement pour résoudre un problème technique.",
  },
  {
    category: "security",
    question: "Que se passe-t-il si j'annule mon abonnement ?",
    answer:
      "Vos données restent accessibles pendant 30 jours après l'annulation. Vous pouvez les exporter à tout moment au format CSV ou Excel. Passé ce délai, elles sont définitivement supprimées de nos serveurs.",
  },
  {
    category: "security",
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui, vous pouvez exporter toutes vos données à tout moment : transactions, clients, produits, rapports... Formats disponibles : CSV, Excel, PDF. Vos données vous appartiennent.",
  },
  {
    category: "integration",
    question: "Puis-je connecter Quelyos à mon logiciel comptable ?",
    answer:
      "Oui, vous pouvez exporter vos données au format compatible avec la plupart des logiciels comptables (Sage, Cegid, EBP...). Un export en un clic génère un fichier prêt à importer dans votre outil.",
  },
  {
    category: "integration",
    question: "Quelyos remplace-t-il mon expert-comptable ?",
    answer:
      "Non, Quelyos est un outil de gestion de trésorerie et de pilotage, pas un cabinet comptable. Il facilite votre quotidien et prépare vos données, mais votre expert-comptable reste essentiel pour les déclarations fiscales et le bilan annuel.",
  },
  {
    category: "integration",
    question: "Puis-je gérer plusieurs devises ?",
    answer:
      "Oui, Quelyos supporte l'Euro, le devises internationales, le Dollar américain et d'autres devises. Les conversions se font automatiquement avec les taux du jour.",
  },
  {
    category: "integration",
    question: "Quelyos est-il disponible en plusieurs langues ?",
    answer:
      "Actuellement, Quelyos est disponible en plusieurs langues. L'interface en arabe et en anglais est prévue pour 2026.",
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
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-slate-950">
      <FAQPageSchema faqs={faqs} />
      <Header />

      <section className="relative overflow-hidden pb-16 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        
        <Container className="relative">
          <m.div
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
          </m.div>
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
              <m.div
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
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 py-4">
                        <p className="text-slate-400">{faq.answer}</p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
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
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900"
            >
              Contacter le support
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-slate-300 ring-1 ring-white/10"
            >
              Documentation
            </Link>
          </div>
        </Container>
      </section>
    </div>
    </LazyMotion>
  );
}
