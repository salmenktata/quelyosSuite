"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  Building2,
  Coins,
  Globe,
  FolderKanban,
  RefreshCw,
  Shield,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";
import config from "@/app/lib/config";

const features = [
  {
    icon: Building2,
    title: "Multi-comptes bancaires",
    description:
      "Connectez tous vos comptes : compte courant, épargne, compte pro. Agrégation manuelle ou par import.",
  },
  {
    icon: Coins,
    title: "Comptes cash & crypto",
    description:
      "Suivez également votre caisse physique et vos portefeuilles crypto (BTC, ETH...).",
  },
  {
    icon: Globe,
    title: "Multi-devises",
    description:
      "EUR, TND, USD, GBP, MAD, DZD... Conversion automatique pour consolider en devise principale.",
  },
  {
    icon: FolderKanban,
    title: "Portefeuilles",
    description:
      "Regroupez vos comptes par entité, projet ou activité. Vue consolidée par portefeuille.",
  },
  {
    icon: RefreshCw,
    title: "Synchronisation",
    description:
      "Import CSV/Excel pour mettre à jour vos soldes. Mapping automatique des colonnes.",
  },
  {
    icon: Shield,
    title: "Sécurité bancaire",
    description:
      "Chiffrement des données, pas de stockage d'identifiants bancaires, RGPD compliant.",
  },
];

const accountTypes = [
  { icon: "🏦", name: "Compte courant", desc: "Banque principale" },
  { icon: "💰", name: "Épargne", desc: "Livrets & comptes rémunérés" },
  { icon: "💳", name: "Carte business", desc: "Plafond & transactions" },
  { icon: "💵", name: "Caisse", desc: "Espèces physiques" },
  { icon: "₿", name: "Crypto", desc: "BTC, ETH, USDT..." },
  { icon: "🌍", name: "Devise étrangère", desc: "Comptes multi-devises" },
];

export default function AccountsFeaturePage() {
  return (
    <LazyMotion features={domAnimation}>
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Hero */}
        <div className="border-b border-white/10 bg-gradient-to-br from-emerald-900/20 to-teal-900/20">
          <Container className="py-16">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/finance/features"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Toutes les fonctionnalités
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      Multi-Comptes
                    </h1>
                    <p className="text-emerald-400">
                      Gérez tous vos comptes au même endroit
                    </p>
                  </div>
                </div>

                <p className="text-lg text-slate-300 mb-8">
                  Centralisez la gestion de tous vos comptes bancaires, caisses
                  et portefeuilles crypto. Multi-devises natif pour une vision
                  consolidée de votre trésorerie.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={config.finance.accounts}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white hover:from-emerald-600 hover:to-teal-600 transition-all"
                  >
                    Gérer mes comptes
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href={config.finance.register}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Essai gratuit 30 jours
                  </Link>
                </div>
              </div>

              {/* Account Types Preview */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400 mb-4">
                  Types de comptes supportés
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {accountTypes.map((type) => (
                    <div
                      key={type.name}
                      className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {type.name}
                        </p>
                        <p className="text-xs text-slate-400">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </Container>
        </div>

        {/* Features Grid */}
        <Container className="py-16">
          <h2 className="text-2xl font-bold text-white mb-8">
            Fonctionnalités clés
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-emerald-500/50 transition-all"
              >
                <feature.icon className="h-10 w-10 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>

          {/* Devises */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Devises supportées
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                "EUR 🇪🇺",
                "TND 🇹🇳",
                "USD 🇺🇸",
                "GBP 🇬🇧",
                "MAD 🇲🇦",
                "DZD 🇩🇿",
                "AED 🇦🇪",
                "SAR 🇸🇦",
                "CHF 🇨🇭",
                "CAD 🇨🇦",
              ].map((devise) => (
                <span
                  key={devise}
                  className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300"
                >
                  {devise}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href={config.finance.register}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-semibold text-white hover:from-emerald-600 hover:to-teal-600 transition-all"
            >
              Centraliser mes comptes
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Container>
      </div>
      <Footer />
    </>
    </LazyMotion>
  );
}
