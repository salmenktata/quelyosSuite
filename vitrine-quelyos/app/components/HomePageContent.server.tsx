import Link from "next/link";
import * as Icons from "./Icons";
import Footer from "./Footer";
import Container from "./Container";
import Header from "./Header";
import config from "@/app/lib/config";

// Server Component sans animations (hydratation immédiate)
export default function HomePageContentServer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <Container>
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
              <Icons.Sparkles className="h-4 w-4" />2 plateformes SaaS complémentaires
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              La Suite Quelyos pour{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                piloter votre TPE
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
              Gérez votre trésorerie avec l&apos;IA et automatisez votre
              marketing digital. Deux outils pensés pour les TPE/PME qui veulent
              se concentrer sur leur métier.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/finance"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
              >
                <Icons.DollarSign className="h-5 w-5" />
                Découvrir Finance
              </Link>
              <Link
                href="/marketing"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-medium text-white transition-all hover:from-pink-600 hover:to-purple-700"
              >
                <Icons.Instagram className="h-5 w-5" />
                Découvrir Marketing
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Plateformes */}
      <section className="relative py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Finance */}
            <div
              id="finance"
              className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-slate-900/50 p-8 backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20"
            >
              <div className="absolute right-0 top-0 h-64 w-64 bg-gradient-to-br from-indigo-500/20 to-transparent blur-3xl" />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-xl bg-indigo-500/20 p-4">
                  <Icons.DollarSign className="h-10 w-10 text-indigo-400" />
                </div>
                <h2 className="mb-3 text-3xl font-bold text-white">
                  Quelyos Finance
                </h2>
                <p className="mb-2 text-lg font-medium text-indigo-300">
                  Pilotage trésorerie & prévisions IA
                </p>
                <p className="mb-6 text-slate-400">
                  &quot;Dormez tranquille : votre trésorerie TPE pilotée 90
                  jours à l&apos;avance.&quot;
                </p>
                <ul className="mb-8 space-y-3">
                  {[
                    { icon: Icons.TrendingUp, text: "Prévisions IA fiables à 85-90%" },
                    { icon: Icons.BarChart3, text: "Dashboard KPIs temps réel" },
                    { icon: Icons.Calendar, text: "Import automatique transactions" },
                    { icon: Icons.Shield, text: "Rapports & budgets intelligents" },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <feature.icon className="h-5 w-5 text-indigo-400" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/finance"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700"
                  >
                    En savoir plus
                    <Icons.ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href={config.finance.login}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/50 bg-indigo-500/10 px-6 py-3 font-medium text-indigo-300 transition-all hover:bg-indigo-500/20"
                  >
                    Accéder à l&apos;app
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  En production • 43 features
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div
              id="marketing"
              className="group relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/50 to-slate-900/50 p-8 backdrop-blur-sm transition-all hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/20"
            >
              <div className="absolute right-0 top-0 h-64 w-64 bg-gradient-to-br from-pink-500/20 to-transparent blur-3xl" />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-xl bg-pink-500/20 p-4">
                  <Icons.Instagram className="h-10 w-10 text-pink-400" />
                </div>
                <h2 className="mb-3 text-3xl font-bold text-white">
                  Quelyos Marketing
                </h2>
                <p className="mb-2 text-lg font-medium text-pink-300">
                  Marketing social media automatisé
                </p>
                <p className="mb-6 text-slate-400">
                  &quot;20 minutes par semaine, zéro expertise, des clients en
                  plus.&quot;
                </p>
                <ul className="mb-8 space-y-3">
                  {[
                    { icon: Icons.Sparkles, text: "IA génération contenu secteur" },
                    { icon: Icons.Calendar, text: "Publication automatique multi-réseaux" },
                    { icon: Icons.MessageSquare, text: "Inbox unifiée + réponses IA" },
                    { icon: Icons.BarChart3, text: "Analytics business & engagement" },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <feature.icon className="h-5 w-5 text-pink-400" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/marketing"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-pink-600 hover:to-purple-700"
                  >
                    En savoir plus
                    <Icons.ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href={config.marketing.login}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-pink-500/50 bg-pink-500/10 px-6 py-3 font-medium text-pink-300 transition-all hover:bg-pink-500/20"
                  >
                    Rejoindre la waitlist
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                  MVP en développement • Lancement Q1 2026
                </div>
              </div>
            </div>
          </div>

          {/* E-Commerce Coming Soon */}
          <div className="mt-8">
            <div className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900/50 p-8 backdrop-blur-sm transition-all hover:border-amber-500/50">
              <div className="absolute right-0 top-0 h-64 w-64 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl" />
              <div className="absolute top-4 right-4 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                Coming Soon 2026
              </div>
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-12">
                <div className="mb-6 lg:mb-0 lg:w-1/2">
                  <div className="mb-4 inline-flex rounded-xl bg-amber-500/20 p-4">
                    <Icons.ShoppingCart className="h-10 w-10 text-amber-400" />
                  </div>
                  <h2 className="mb-3 text-3xl font-bold text-white">
                    Quelyos E-Commerce
                  </h2>
                  <p className="mb-2 text-lg font-medium text-amber-300">
                    Order Hub Omnicanal pour TPE
                  </p>
                  <p className="mb-6 text-slate-400">
                    &quot;Transformez chaque conversation en commande. Sans site
                    web. Depuis tous vos canaux.&quot;
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    L&apos;anti-Shopify pour ceux qui vendent via WhatsApp,
                    Instagram et Messenger. Centralisez vos commandes, facturez
                    automatiquement, synchronisez votre trésorerie.
                  </p>
                  <Link
                    href="/ecommerce"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-6 py-3 font-medium text-amber-300 transition-all hover:bg-amber-500/20"
                  >
                    Rejoindre la waitlist
                    <Icons.ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
                <div className="lg:w-1/2">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Icons.Smartphone, text: "WhatsApp, Instagram, Messenger", desc: "Capture omnicanale" },
                      { icon: Icons.Receipt, text: "Facturation auto", desc: "Devis & factures" },
                      { icon: Icons.Package, text: "Gestion stock", desc: "Temps réel" },
                      { icon: Icons.TrendingUp, text: "Sync Finance", desc: "Trésorerie à jour" },
                    ].map((feature, i) => (
                      <div key={i} className="rounded-xl bg-white/5 p-4">
                        <feature.icon className="h-6 w-6 text-amber-400 mb-2" />
                        <p className="text-sm font-medium text-white">{feature.text}</p>
                        <p className="text-xs text-slate-400">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pourquoi Quelyos */}
      <section className="relative py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pourquoi choisir Quelyos ?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Une suite pensée pour les TPE/PME qui veulent se concentrer sur leur métier
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Icons.Zap, title: "Simple & rapide", desc: "Prise en main en 10 minutes, pas besoin de formation", color: "text-yellow-400" },
              { icon: Icons.Shield, title: "Données sécurisées", desc: "Hébergement France, RGPD compliant, chiffrement", color: "text-emerald-400" },
              { icon: Icons.Users, title: "Support humain", desc: "Accompagnement personnalisé pour chaque client", color: "text-blue-400" },
              { icon: Icons.DollarSign, title: "Prix accessible", desc: "Tarifs adaptés TPE, pas d'engagement annuel", color: "text-purple-400" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm"
              >
                <item.icon className={`mb-4 h-8 w-8 ${item.color}`} />
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="relative border-y border-white/10 bg-slate-900/50 py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: "Features Finance", value: "43", icon: Icons.TrendingUp },
              { label: "Features Marketing", value: "8", icon: Icons.Instagram },
              { label: "Marchés ciblés", value: "5", icon: Icons.DollarSign },
              { label: "Objectif ARR 2026", value: "115k€", icon: Icons.Sparkles },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Contact */}
      <section className="relative py-20">
        <Container narrow>
          <div
            className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <Icons.Mail className="mx-auto mb-6 h-12 w-12 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à simplifier votre gestion ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Contactez-nous pour une démo gratuite ou commencez directement avec l&apos;essai gratuit.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-indigo-600 hover:to-purple-700"
              >
                <Icons.Mail className="h-5 w-5" />
                Nous contacter
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
