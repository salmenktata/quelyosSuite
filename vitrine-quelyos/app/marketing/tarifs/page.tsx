"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  Zap,
  Crown,
  Users,
} from "lucide-react";

import config from "@/app/lib/config";
import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function TarifsPage() {
  const plans = [
    {
      name: "Freemium",
      price: "0",
      description: "Pour tester et découvrir",
      icon: Users,
      color: "gray",
      features: [
        { name: "1 compte social", included: true },
        { name: "5 posts IA / mois", included: true },
        { name: "Calendrier éditorial basique", included: true },
        { name: "Inbox unifiée", included: false },
        { name: "Analytics avancés", included: false },
        { name: "Réponses IA aux messages", included: false },
        { name: "Support prioritaire", included: false },
      ],
      cta: "Commencer gratuitement",
      popular: false,
    },
    {
      name: "Pro",
      price: "19",
      description: "Pour les TPE actives",
      icon: Zap,
      color: "emerald",
      features: [
        { name: "3 comptes sociaux", included: true },
        { name: "Posts IA illimités", included: true },
        { name: "Calendrier éditorial complet", included: true },
        { name: "Inbox unifiée", included: true },
        { name: "Analytics avancés", included: true },
        { name: "Réponses IA aux messages", included: true },
        { name: "Support prioritaire", included: false },
      ],
      cta: "Démarrer l'essai gratuit",
      popular: true,
    },
    {
      name: "Expert",
      price: "49",
      description: "Pour les ambitieux",
      icon: Crown,
      color: "purple",
      features: [
        { name: "10 comptes sociaux", included: true },
        { name: "Posts IA illimités", included: true },
        { name: "Calendrier éditorial + collaboration", included: true },
        { name: "Inbox unifiée + CRM intégré", included: true },
        { name: "Analytics + exports", included: true },
        { name: "Réponses IA personnalisées", included: true },
        { name: "Support prioritaire 24h", included: true },
      ],
      cta: "Contacter les ventes",
      popular: false,
    },
  ];

  const faq = [
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer:
        "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement est effectif immédiatement et le prorata est calculé automatiquement.",
    },
    {
      question: "Y a-t-il un engagement ?",
      answer:
        "Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment sans frais.",
    },
    {
      question: "Comment fonctionne l'essai gratuit ?",
      answer:
        "L'essai gratuit du plan Pro dure 14 jours. Vous avez accès à toutes les fonctionnalités sans entrer votre carte bancaire.",
    },
    {
      question: "Quelles plateformes sont supportées ?",
      answer:
        "Actuellement Instagram et Facebook. Google My Business arrive prochainement.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <Container className="py-4 flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white">Quelyos Marketing</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/marketing/features"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Fonctionnalités
            </Link>
            <Link
              href="/marketing/tarifs"
              className="text-emerald-400 text-sm font-medium"
            >
              Tarifs
            </Link>
            <Link
              href="/marketing/backlog"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Roadmap
            </Link>
          </nav>
          <Link
            href={config.marketing.login}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            Connexion
          </Link>
        </Container>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tarification transparente</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Un prix simple,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-transparent bg-clip-text">
              des résultats concrets
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400"
          >
            Commencez gratuitement, évoluez selon vos besoins.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? "bg-emerald-950/30 border-emerald-500/30"
                    : "bg-gray-900/50 border-white/5"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                    Recommandé
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.color === "emerald"
                        ? "bg-emerald-500/20"
                        : plan.color === "purple"
                          ? "bg-purple-500/20"
                          : "bg-gray-500/20"
                    }`}
                  >
                    <plan.icon
                      className={`w-5 h-5 ${
                        plan.color === "emerald"
                          ? "text-emerald-400"
                          : plan.color === "purple"
                            ? "text-purple-400"
                            : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}€
                  </span>
                  <span className="text-gray-500">/mois</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600" />
                      )}
                      <span
                        className={
                          feature.included ? "text-gray-300" : "text-gray-600"
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle Banner */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-blue-950/50 border border-emerald-500/20"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Bundle Finance + Marketing
                </h3>
                <p className="text-gray-400">
                  Combinez Quelyos Finance et Marketing pour seulement{" "}
                  <span className="text-emerald-400 font-bold">39€/mois</span>{" "}
                  au lieu de 48€
                </p>
              </div>
              <Link
                href="/tarifs"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors whitespace-nowrap"
              >
                Voir les bundles
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faq.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-xl bg-gray-900/50 border border-white/5"
              >
                <h3 className="font-medium text-white mb-2">{item.question}</h3>
                <p className="text-gray-400 text-sm">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à booster votre visibilité ?
          </h2>
          <p className="text-gray-400 mb-8">
            Essayez gratuitement pendant 14 jours, sans carte bancaire.
          </p>
          <Link
            href="/marketing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            <span>Rejoindre la waitlist</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}