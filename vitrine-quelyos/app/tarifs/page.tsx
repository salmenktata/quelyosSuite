"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  DollarSign,
  Instagram,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";
import config from "@/app/lib/config";

export default function TarifsPage() {
  const plans = {
    finance: [
      {
        name: "Freemium",
        price: "0€",
        period: "/mois",
        description: "Pour découvrir",
        features: [
          "1 compte bancaire",
          "30 transactions/mois",
          "Dashboard basique",
          "Export CSV",
        ],
        limitations: ["Pas de prévisions IA", "Pas de rapports PDF"],
        cta: "Commencer gratuitement",
        href: config.finance.app,
        highlight: false,
      },
      {
        name: "Pro",
        price: "29€",
        period: "/mois",
        description: "Pour les TPE actives",
        features: [
          "5 comptes bancaires",
          "Transactions illimitées",
          "Prévisions IA 90 jours",
          "Rapports PDF",
          "Import automatique",
          "Budgets & alertes",
          "Support prioritaire",
        ],
        limitations: [],
        cta: "Essai gratuit 14 jours",
        href: config.finance.app,
        highlight: true,
        badge: "Populaire",
      },
      {
        name: "Expert",
        price: "79€",
        period: "/mois",
        description: "Pour les entreprises exigeantes",
        features: [
          "Comptes illimités",
          "Multi-devises (MENA)",
          "API & intégrations",
          "Scénarios what-if",
          "Rapports personnalisés",
          "Accompagnement dédié",
          "SLA garanti",
        ],
        limitations: [],
        cta: "Contacter commercial",
        href: "/contact",
        highlight: false,
      },
    ],
    marketing: [
      {
        name: "Freemium",
        price: "0€",
        period: "/mois",
        description: "Pour tester",
        features: [
          "1 page Facebook/Instagram",
          "4 posts/mois générés",
          "Templates basiques",
          "Analytics de base",
        ],
        limitations: ["Pas d'inbox unifiée", "Watermark sur visuels"],
        cta: "Rejoindre waitlist",
        href: config.marketing.app,
        highlight: false,
        comingSoon: true,
      },
      {
        name: "Pro",
        price: "19€",
        period: "/mois",
        description: "Pour les TPE locales",
        features: [
          "3 pages sociales",
          "20 posts/mois générés",
          "Inbox unifiée",
          "Réponses IA suggérées",
          "Templates sectoriels",
          "Analytics business",
          "Support email",
        ],
        limitations: [],
        cta: "Rejoindre waitlist",
        href: config.marketing.app,
        highlight: true,
        badge: "Recommandé",
        comingSoon: true,
      },
      {
        name: "Expert",
        price: "49€",
        period: "/mois",
        description: "Pour les multi-établissements",
        features: [
          "Pages illimitées",
          "Posts illimités",
          "Gestion multi-locaux",
          "Rapports avancés",
          "API & webhooks",
          "Accompagnement dédié",
          "Formation incluse",
        ],
        limitations: [],
        cta: "Contacter commercial",
        href: "/contact",
        highlight: false,
        comingSoon: true,
      },
    ],
    bundles: [
      {
        name: "Bundle Pro",
        price: "39€",
        originalPrice: "48€",
        period: "/mois",
        savings: "Économisez 9€/mois (108€/an)",
        description: "Finance Pro + Marketing Pro",
        features: [
          "Tout Finance Pro",
          "Tout Marketing Pro",
          "Support prioritaire unifié",
          "Formations combo",
          "Dashboard unifié (2026)",
        ],
        cta: "Choisir le Bundle",
        href: config.finance.app,
        highlight: true,
        badge: "Meilleur rapport qualité/prix",
      },
      {
        name: "Bundle Expert",
        price: "99€",
        originalPrice: "128€",
        period: "/mois",
        savings: "Économisez 29€/mois (348€/an)",
        description: "Finance Expert + Marketing Expert",
        features: [
          "Tout Finance Expert",
          "Tout Marketing Expert",
          "Account manager dédié",
          "SLA entreprise",
          "Intégrations sur mesure",
        ],
        cta: "Contacter commercial",
        href: "/contact",
        highlight: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Tarifs simples et transparents
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Choisissez la formule adaptée à vos besoins. Pas
              d&apos;engagement, annulation à tout moment.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Finance Pricing */}
      <section className="relative py-12">
        <Container>
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/20 p-2">
              <DollarSign className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quelyos Finance</h2>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              Disponible
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.finance.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? "border-2 border-indigo-500 bg-gradient-to-br from-indigo-950/50 to-slate-900/50"
                    : "border border-white/10 bg-slate-900/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-medium text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                  {plan.limitations.map((limitation, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-500"
                    >
                      <span className="h-4 w-4 text-center">✗</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Marketing Pricing */}
      <section className="relative py-12">
        <Container>
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-pink-500/20 p-2">
              <Instagram className="h-6 w-6 text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quelyos Marketing</h2>
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
              Lancement Q1 2026
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.marketing.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? "border-2 border-pink-500 bg-gradient-to-br from-pink-950/50 to-slate-900/50"
                    : "border border-white/10 bg-slate-900/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1 text-xs font-medium text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle className="h-4 w-4 text-pink-400" />
                      {feature}
                    </li>
                  ))}
                  {plan.limitations.map((limitation, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-500"
                    >
                      <span className="h-4 w-4 text-center">✗</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Bundles */}
      <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
        <Container>
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Bundles Suite Quelyos
            </h2>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              Économies garanties
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.bundles.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? "border-2 border-purple-500 bg-gradient-to-br from-purple-950/50 to-indigo-950/50"
                    : "border border-white/10 bg-slate-900/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-xs font-medium text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.period}</span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-lg text-slate-500 line-through">
                      {plan.originalPrice}
                    </span>
                  )}
                </div>
                {plan.savings && (
                  <p className="mt-2 text-sm font-medium text-emerald-400">
                    {plan.savings}
                  </p>
                )}
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle className="h-4 w-4 text-purple-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="relative py-20">
        <Container veryNarrow>
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Puis-je changer de formule à tout moment ?",
                a: "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. Le changement prend effet au prochain cycle de facturation.",
              },
              {
                q: "Y a-t-il un engagement ?",
                a: "Non, tous nos abonnements sont sans engagement. Vous pouvez annuler à tout moment et continuer à utiliser le service jusqu'à la fin de la période payée.",
              },
              {
                q: "Comment fonctionne l'essai gratuit ?",
                a: "L'essai gratuit de 14 jours donne accès à toutes les fonctionnalités Pro. Aucune carte bancaire requise pour commencer.",
              },
              {
                q: "Les tarifs sont-ils HT ou TTC ?",
                a: "Tous les tarifs affichés sont HT. La TVA applicable sera ajoutée lors de la facturation selon votre pays.",
              },
              {
                q: "Proposez-vous des tarifs annuels ?",
                a: "Oui, un abonnement annuel vous fait économiser 2 mois (soit ~17% de réduction). Contactez-nous pour en bénéficier.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-6"
              >
                <h3 className="font-semibold text-white">{faq.q}</h3>
                <p className="mt-2 text-sm text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <Container narrow>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-indigo-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Besoin d&apos;aide pour choisir ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Contactez-nous pour une démo personnalisée et des conseils adaptés
              à votre situation.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600"
              >
                Nous contacter
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
