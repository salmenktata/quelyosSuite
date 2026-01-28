"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Smartphone,
  Receipt,
  Package,
  TrendingUp,
  Users,
  Sparkles,
  Instagram,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "../components/Container";

const features = [
  {
    icon: Smartphone,
    title: "Capture Omnicanale",
    description:
      "WhatsApp, Instagram DMs, Facebook Messenger, Email — toutes vos commandes arrivent au même endroit.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "IA Détection Commandes",
    description:
      "L'IA détecte automatiquement les intentions d'achat dans vos conversations et crée des commandes en 1 clic.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Receipt,
    title: "Facturation Automatique",
    description:
      "Devis et factures générés automatiquement depuis les commandes. Templates personnalisables.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Package,
    title: "Gestion de Stock",
    description:
      "Mouvements automatiques à chaque commande. Alertes rupture. Multi-dépôts optionnel.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: TrendingUp,
    title: "Sync Quelyos Finance",
    description:
      "Chaque vente devient un revenu prévu, chaque paiement une transaction réelle. Trésorerie à jour.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Users,
    title: "CRM Clients Intégré",
    description:
      "Fiches clients auto-générées, historique commandes, segments automatiques exportables vers Marketing.",
    color: "from-rose-500 to-red-500",
  },
];

const useCases = [
  {
    emoji: "🧁",
    name: "Pâtissiers & Traiteurs",
    desc: "Commandes gâteaux via WhatsApp",
  },
  {
    emoji: "💐",
    name: "Fleuristes",
    desc: "Commandes événementielles Instagram",
  },
  {
    emoji: "🎨",
    name: "Créateurs & Artisans",
    desc: "Ventes sans site e-commerce",
  },
  {
    emoji: "🍷",
    name: "Cavistes & Épiceries",
    desc: "Commandes clients réguliers",
  },
  {
    emoji: "👗",
    name: "Boutiques Mode",
    desc: "Réservations nouvelles collections",
  },
  { emoji: "🔧", name: "Artisans BTP", desc: "Devis et commandes chantier" },
];

const timeline = [
  {
    quarter: "Q1 2026",
    title: "MVP Alpha",
    desc: "Carnet de commandes + WhatsApp",
    status: "upcoming",
  },
  {
    quarter: "Q2 2026",
    title: "Beta Publique",
    desc: "Instagram + Facebook + Facturation",
    status: "planned",
  },
  {
    quarter: "Q3 2026",
    title: "Lancement",
    desc: "Paiements + Stock + Sync Finance",
    status: "planned",
  },
];

export default function EcommercePage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
          <div className="absolute top-0 right-0 h-96 w-96 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl" />

          <Container className="py-20">
            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour à la Suite
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300 mb-6">
                  <Sparkles className="h-4 w-4" />
                  14 jours d&apos;essai gratuit
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <ShoppingCart className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white">
                      Quelyos E-Commerce
                    </h1>
                    <p className="text-amber-400 text-lg">
                      Order Hub Omnicanal TPE
                    </p>
                  </div>
                </div>

                <p className="text-2xl text-slate-300 mb-6 leading-relaxed">
                  Transformez chaque conversation en commande.{" "}
                  <span className="text-amber-400">Sans site web.</span> Depuis
                  tous vos canaux.
                </p>

                <p className="text-slate-400 mb-8">
                  L&apos;anti-Shopify pour les TPE qui vendent via WhatsApp,
                  Instagram et Messenger. Centralisez vos commandes, facturez
                  automatiquement, synchronisez votre trésorerie avec Quelyos
                  Finance.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Link
                    href="/ecommerce/signup?plan=pro"
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    <Sparkles className="h-5 w-5" />
                    Créer ma boutique gratuitement
                  </Link>
                  <Link
                    href="/ecommerce/pricing"
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Voir les tarifs
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>

                <p className="text-sm text-slate-500">
                  Sans carte bancaire • Annulez à tout moment
                </p>
              </motion.div>

              {/* Preview Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-400 mb-4">
                    Aperçu du concept
                  </p>

                  {/* Mock message */}
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm">
                        M
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Marie L.
                        </p>
                        <p className="text-xs text-slate-400">via WhatsApp</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm italic">
                      &quot;Bonjour ! Je voudrais commander 2 gâteaux aux
                      fraises pour samedi svp&quot;
                    </p>
                  </div>

                  {/* AI Detection */}
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      <p className="text-sm font-medium text-amber-300">
                        Détection IA
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-slate-400">Produit</p>
                        <p className="text-white font-medium">Gâteau fraises</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-slate-400">Quantité</p>
                        <p className="text-white font-medium">2</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-slate-400">Date</p>
                        <p className="text-white font-medium">Samedi 17/01</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <p className="text-slate-400">Total</p>
                        <p className="text-white font-medium">45,00 €</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-white">
                    Créer la commande
                  </button>
                </div>
              </motion.div>
            </div>
          </Container>
        </div>

        {/* Use Cases */}
        <Container className="py-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Pour qui ?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:border-amber-500/50 transition-all"
              >
                <span className="text-3xl mb-2 block">{useCase.emoji}</span>
                <p className="text-sm font-medium text-white mb-1">
                  {useCase.name}
                </p>
                <p className="text-xs text-slate-400">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>

        {/* Features */}
        <Container className="py-16">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Fonctionnalités prévues
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Un order hub complet pour centraliser toutes vos ventes, facturer
            automatiquement et synchroniser avec votre trésorerie.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-amber-500/30 transition-all"
              >
                <div
                  className={`inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>

        {/* Timeline */}
        <Container className="py-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Roadmap
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            {timeline.map((item, index) => (
              <motion.div
                key={item.quarter}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex-1 max-w-sm rounded-xl border p-6 ${
                  item.status === "upcoming"
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-2 ${
                    item.status === "upcoming"
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {item.quarter}
                </p>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>

        {/* Synergies */}
        <Container className="py-16">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-amber-500/5 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Synergie Suite Quelyos
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-white/5">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">E-Commerce</h3>
                <p className="text-sm text-slate-400">Commande créée</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/5">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Finance</h3>
                <p className="text-sm text-slate-400">
                  → Revenu prévu automatique
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/5">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Instagram className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Marketing</h3>
                <p className="text-sm text-slate-400">
                  → Client segmenté pour campagnes
                </p>
              </div>
            </div>
          </div>
        </Container>

        {/* Final CTA */}
        <Container className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Prêt à lancer votre boutique ?
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Commencez votre essai gratuit de 14 jours et créez votre boutique
              en quelques minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/ecommerce/signup?plan=pro"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Sparkles className="h-5 w-5" />
                Créer ma boutique
              </Link>
              <Link
                href="/ecommerce/pricing"
                className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-8 py-3 font-semibold text-white hover:bg-white/10 transition-all"
              >
                Comparer les plans
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
