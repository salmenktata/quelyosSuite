"use client";

import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import { Target, Users, Rocket, TrendingUp, Zap, Calendar, DollarSign, BarChart3, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

import config from "@/app/lib/config";
const quickWins = [
  { id: "F19", title: "Scénarios manuels ±10/20/30%", effort: "2 sem", impact: "HAUT", status: "À planifier" },
  { id: "F20", title: "Templates Agence Web", effort: "4 sem", impact: "HAUT", status: "À planifier" },
  { id: "F21", title: "Landing page repositionnée TPE", effort: "1 sem", impact: "HAUT", status: "À planifier" },
  { id: "F22", title: "UX Premium + Dark mode", effort: "3 sem", impact: "MOYEN", status: "À planifier" },
  { id: "F23", title: "Templates Cabinet Conseil + Bureau Études", effort: "3 sem", impact: "HAUT", status: "À planifier" },
];

const premiumFeatures = [
  { id: "F24", title: "ML Forecasting Prophet.js", effort: "6 sem", impact: "HAUT", status: "Q2 2025" },
  { id: "F25", title: "Intégration Bridge API (350+ banques)", effort: "10 sem", impact: "HAUT", status: "Q2 2025" },
  { id: "F26", title: "Simulateur scénarios avancé", effort: "8 sem", impact: "HAUT", status: "Q2 2025" },
  { id: "F27", title: "Alertes intelligentes ML", effort: "6 sem", impact: "MOYEN", status: "Q2 2025" },
];

const personas = [
  {
    name: "Thomas",
    role: "CEO Agence Web",
    company: "12 personnes • Lyon",
    painPoints: [
      "Clients retardent paiement 60-90j",
      "Salaires fixes 70k€/mois",
      "Excel complexe, perd 3h/semaine"
    ],
    goals: [
      "Anticiper trous trésorerie 3 mois",
      "Décider embauches sans risque",
      "Automatiser relances clients"
    ]
  },
  {
    name: "Sophie",
    role: "DAF Cabinet Conseil",
    company: "8 consultants • Paris",
    painPoints: [
      "Intercontrats imprévisibles",
      "Charges fixes 55k€/mois",
      "Exports mensuels chronophages"
    ],
    goals: [
      "Simuler impact intercontrats",
      "Export auto expert-comptable",
      "Dashboard multi-associés"
    ]
  }
];

const competitors = [
  { name: "Pennylane", pricing: "29€/mois", strength: "Compta automatisée", weakness: "Pas de prévisions ML", differentiation: "Prévisions IA + scénarios" },
  { name: "Qonto", pricing: "9-99€/mois", strength: "UX premium, cartes", weakness: "Pas de forecasting", differentiation: "Simulateur scénarios" },
  { name: "Agicap", pricing: ">200€/mois", strength: "Très puissant tréso", weakness: "Trop cher TPE", differentiation: "Pricing accessible" },
];

const kpis = [
  { label: "Conversion landing → signup", target: "8%", current: "~3%", status: "À améliorer" },
  { label: "Time-to-value onboarding", target: "< 5 min", current: "~45 min", status: "À améliorer" },
  { label: "Retention 30 jours", target: "50%", current: "~40%", status: "En cours" },
  { label: "ARR cible 2025", target: "50k€", current: "0€", status: "Objectif" },
];

export default function StrategiePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <Container className="space-y-10 py-12 pt-24">
        
        {/* Header */}
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Vision 2025</p>
          <h1 className="text-4xl font-bold text-white">Stratégie Produit Quelyos</h1>
          <p className="max-w-3xl text-lg text-indigo-100/90 leading-relaxed">
            <strong className="text-white">Positionnement :</strong> Plateforme de pilotage trésorerie pour{" "}
            <span className="text-emerald-300 font-semibold">TPE Services B2B (5-20 employés)</span> — agences web, cabinets conseil, bureaux d&apos;études.
          </p>
        </header>

        {/* Tagline */}
        <div className="rounded-2xl border border-indigo-400/40 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-indigo-500/30 p-3">
              <Target className="h-8 w-8 text-indigo-300" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wider text-indigo-300">Nouveau messaging</p>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                &ldquo;Dormez tranquille : votre trésorerie TPE pilotée 90 jours à l&apos;avance.&rdquo;
              </h2>
              <p className="text-indigo-100/80">
                Prévisions cash flow augmentées par IA + scénarios business pour agences, cabinets et bureaux d&apos;études.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Axes stratégiques */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Rocket className="h-5 w-5 text-indigo-400" />
            3 Axes Stratégiques
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-6 shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                <Users className="h-6 w-6 text-emerald-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Niche Hyper-Ciblée</h3>
              <p className="text-sm text-emerald-100/80">
                TPE Services B2B (5-20 employés) : trop petits pour ERP, trop complexes pour outils freelance.
                Pain point : trésorerie volatile (factures 30-60j, charges fixes).
              </p>
            </div>
            <div className="rounded-xl border border-purple-400/30 bg-purple-900/20 p-6 shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Killer Features</h3>
              <p className="text-sm text-purple-100/80">
                Prévisions IA (Prophet.js), Simulateur scénarios business (embauche, perte client),
                Sync bancaire automatique (Bridge API 350+ banques).
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-900/20 p-6 shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
                <TrendingUp className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">UX Premium</h3>
              <p className="text-sm text-amber-100/80">
                Design glassmorphism moderne, templates sectoriels pré-configurés,
                onboarding &lt; 5 min avec Time-to-Value immédiat.
              </p>
            </div>
          </div>
        </section>

        {/* Personas */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Users className="h-5 w-5 text-indigo-400" />
            Personas Cibles
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {personas.map((persona) => (
              <div key={persona.name} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-bold text-indigo-300">
                    {persona.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{persona.name}, {persona.role}</h3>
                    <p className="text-sm text-slate-400">{persona.company}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">Pain Points</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {persona.painPoints.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Objectifs</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {persona.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Q1 Quick Wins */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Calendar className="h-5 w-5 text-indigo-400" />
            Quick Wins Q1 2025
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 shadow-lg">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50 bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Feature</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Effort</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Impact</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {quickWins.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <span className="mr-2 text-xs text-indigo-400">{f.id}</span>
                      <span className="text-white">{f.title}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{f.effort}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.impact === "HAUT" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {f.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Premium Q2 */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Zap className="h-5 w-5 text-purple-400" />
            Features Premium Q2 2025
          </h2>
          <div className="overflow-hidden rounded-xl border border-purple-500/30 bg-purple-900/20 shadow-lg">
            <table className="w-full text-sm">
              <thead className="border-b border-purple-500/30 bg-purple-900/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-purple-200">Feature</th>
                  <th className="px-4 py-3 text-left font-medium text-purple-200">Effort</th>
                  <th className="px-4 py-3 text-left font-medium text-purple-200">Impact</th>
                  <th className="px-4 py-3 text-left font-medium text-purple-200">Livraison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {premiumFeatures.map((f) => (
                  <tr key={f.id} className="hover:bg-purple-800/20">
                    <td className="px-4 py-3">
                      <span className="mr-2 text-xs text-purple-400">{f.id}</span>
                      <span className="text-white">{f.title}</span>
                    </td>
                    <td className="px-4 py-3 text-purple-200">{f.effort}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.impact === "HAUT" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {f.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-purple-300">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <DollarSign className="h-5 w-5 text-indigo-400" />
            Modèle de Monétisation
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 shadow-lg">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Freemium</p>
              <p className="mb-4 text-3xl font-bold text-white">0€<span className="text-sm font-normal text-slate-400">/mois</span></p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• 1 compte bancaire</li>
                <li>• Prévisions 30j</li>
                <li>• Templates basiques</li>
              </ul>
              <p className="mt-4 text-xs text-slate-500">Pour freelances & testeurs</p>
            </div>
            <div className="rounded-xl border-2 border-indigo-500/50 bg-indigo-900/30 p-6 shadow-lg ring-2 ring-indigo-500/20">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">Pro</p>
              <p className="mb-4 text-3xl font-bold text-white">29€<span className="text-sm font-normal text-indigo-200">/mois</span></p>
              <ul className="space-y-2 text-sm text-indigo-100">
                <li>• Comptes illimités</li>
                <li>• ML forecasting 180j</li>
                <li>• Sync bancaire auto</li>
                <li>• Scénarios business</li>
              </ul>
              <p className="mt-4 text-xs text-indigo-300">TPE 5-10 employés</p>
            </div>
            <div className="rounded-xl border border-purple-500/50 bg-purple-900/20 p-6 shadow-lg">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-300">Expert</p>
              <p className="mb-4 text-3xl font-bold text-white">79€<span className="text-sm font-normal text-purple-200">/mois</span></p>
              <ul className="space-y-2 text-sm text-purple-100">
                <li>• Multi-entreprises</li>
                <li>• Webhooks comptables</li>
                <li>• API complète</li>
                <li>• Support prioritaire</li>
              </ul>
              <p className="mt-4 text-xs text-purple-300">Cabinets & 10-20 employés</p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            KPIs de Succès
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg">
                <p className="mb-2 text-xs font-medium text-slate-400">{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{kpi.target}</p>
                    <p className="text-xs text-slate-500">Actuel : {kpi.current}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    kpi.status === "Objectif" ? "bg-indigo-500/20 text-indigo-300" :
                    kpi.status === "En cours" ? "bg-amber-500/20 text-amber-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    {kpi.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analyse concurrentielle */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Lightbulb className="h-5 w-5 text-indigo-400" />
            Analyse Concurrentielle
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 shadow-lg">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50 bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Concurrent</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Pricing</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Force</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Faiblesse</th>
                  <th className="px-4 py-3 text-left font-medium text-emerald-300">Notre différenciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {competitors.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-300">{c.pricing}</td>
                    <td className="px-4 py-3 text-slate-300">{c.strength}</td>
                    <td className="px-4 py-3 text-red-300">{c.weakness}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{c.differentiation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-8 text-center shadow-xl">
          <h3 className="mb-2 text-xl font-semibold text-white">Prochaines étapes</h3>
          <p className="mb-6 text-indigo-100/80">
            Valider cette stratégie → Lancer Quick Win #1 (Scénarios manuels) → Refondre landing page
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/finance/backlog" className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-indigo-500">
              Voir le Backlog
            </a>
            <a href={config.finance.dashboard} className="rounded-lg border border-indigo-500/50 bg-indigo-900/30 px-6 py-3 font-medium text-indigo-200 transition hover:bg-indigo-800/30">
              Retour Dashboard
            </a>
          </div>
        </div>

      </Container>
    </div>
  );
}