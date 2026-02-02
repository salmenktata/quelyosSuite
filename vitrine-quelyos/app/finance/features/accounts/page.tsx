"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  Wallet,
  CreditCard,
  Building2,
  RefreshCw,
  Lock,
  Search,
  Filter,
  Download,
} from "lucide-react";

import config from "@/app/lib/config";
const features = [
  {
    icon: Building2,
    title: "Multi-banques",
    description: "Connectez tous vos comptes bancaires professionnels et personnels.",
  },
  {
    icon: RefreshCw,
    title: "Synchronisation auto",
    description: "Transactions importées automatiquement chaque jour.",
  },
  {
    icon: Search,
    title: "Recherche avancée",
    description: "Retrouvez n'importe quelle transaction en quelques secondes.",
  },
  {
    icon: Filter,
    title: "Filtres intelligents",
    description: "Filtrez par date, montant, catégorie ou bénéficiaire.",
  },
  {
    icon: Lock,
    title: "Connexion sécurisée",
    description: "Authentification bancaire via protocoles sécurisés.",
  },
  {
    icon: Download,
    title: "Export flexible",
    description: "Exportez en CSV, Excel ou PDF pour votre comptable.",
  },
];

export default function AccountsFeaturePage() {
  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-slate-950">
      <Header />

      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        
        <Container className="relative">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <Wallet size={16} />
              Comptes & Transactions
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Tous vos comptes
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                enfin réunis
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Centralisez tous vos comptes bancaires et suivez chaque transaction 
              avec une précision chirurgicale.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Connecter mes comptes
                <ArrowRight size={16} />
              </Link>
            </div>
          </m.div>

          {/* Demo */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-2xl">
              <div className="border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Mes comptes</h3>
                  <button className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                    + Ajouter un compte
                  </button>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { name: "Compte Courant Pro", bank: "BNP Paribas", balance: "12 450,00 €", color: "emerald" },
                  { name: "Compte Épargne", bank: "Boursorama", balance: "8 200,00 €", color: "blue" },
                  { name: "Carte Business", bank: "Qonto", balance: "2 890,50 €", color: "violet" },
                ].map((account) => (
                  <div key={account.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${account.color}-500/10`}>
                        <CreditCard size={18} className={`text-${account.color}-400`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.bank}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-emerald-400">{account.balance}</p>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </m.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/5 py-24">
        <Container narrow className="text-center">
          <h2 className="text-3xl font-bold text-white">Simplifiez votre gestion</h2>
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
    </LazyMotion>
  );
}