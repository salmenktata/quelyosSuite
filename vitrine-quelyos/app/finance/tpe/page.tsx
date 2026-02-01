"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/app/components/Header";
import Container from "@/app/components/Container";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
  BarChart3,
  Calculator,
  Star,
  Play,
  Moon,
  Zap,
  Building2,
} from "lucide-react";

import config from "@/app/lib/config";
import Footer from "@/app/components/Footer";
// Simulation rapide de trésorerie
function SimulateurTresorerie() {
  const [caInitial, setCaInitial] = useState(15000);
  const [chargesFixes, setChargesFixes] = useState(8000);
  const [delaiPaiement, setDelaiPaiement] = useState(45);
  const [showResult, setShowResult] = useState(false);

  const tresoMoyenne = caInitial - chargesFixes;
  const besoinFR = (caInitial * delaiPaiement) / 30;
  const alerteNiveau = tresoMoyenne < besoinFR ? "danger" : tresoMoyenne < besoinFR * 1.5 ? "warning" : "safe";

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-900/60 p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
          <Calculator className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Simulateur Trésorerie TPE</h3>
          <p className="text-sm text-slate-400">Estimez votre besoin en 30 secondes</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            CA mensuel moyen (€)
          </label>
          <input
            type="range"
            min="5000"
            max="100000"
            step="1000"
            value={caInitial}
            onChange={(e) => setCaInitial(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5k€</span>
            <span className="text-indigo-300 font-semibold">{caInitial.toLocaleString("fr-FR")} €</span>
            <span>100k€</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Charges fixes mensuelles (€)
          </label>
          <input
            type="range"
            min="2000"
            max="50000"
            step="500"
            value={chargesFixes}
            onChange={(e) => setChargesFixes(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>2k€</span>
            <span className="text-indigo-300 font-semibold">{chargesFixes.toLocaleString("fr-FR")} €</span>
            <span>50k€</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Délai moyen de paiement clients (jours)
          </label>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={delaiPaiement}
            onChange={(e) => setDelaiPaiement(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0j</span>
            <span className="text-indigo-300 font-semibold">{delaiPaiement} jours</span>
            <span>90j</span>
          </div>
        </div>

        <button
          onClick={() => setShowResult(true)}
          className="w-full mt-4 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
        >
          Calculer mon besoin de trésorerie
        </button>

        {showResult && (
          <div className={`mt-4 rounded-xl p-4 ${
            alerteNiveau === "danger" 
              ? "bg-red-500/20 border border-red-500/30" 
              : alerteNiveau === "warning"
              ? "bg-amber-500/20 border border-amber-500/30"
              : "bg-emerald-500/20 border border-emerald-500/30"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {alerteNiveau === "danger" ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : alerteNiveau === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
              <span className={`font-semibold ${
                alerteNiveau === "danger" ? "text-red-300" : 
                alerteNiveau === "warning" ? "text-amber-300" : "text-emerald-300"
              }`}>
                {alerteNiveau === "danger" 
                  ? "⚠️ Attention : trésorerie tendue" 
                  : alerteNiveau === "warning"
                  ? "🔶 Vigilance recommandée"
                  : "✅ Situation saine"}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-200">
              <p>📊 Marge mensuelle estimée : <strong>{tresoMoyenne.toLocaleString("fr-FR")} €</strong></p>
              <p>💰 Besoin en fonds de roulement : <strong>{Math.round(besoinFR).toLocaleString("fr-FR")} €</strong></p>
              <p>📅 Couverture charges : <strong>{Math.round((tresoMoyenne / chargesFixes) * 30)} jours</strong></p>
            </div>
            <Link
              href={config.finance.register}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Obtenir ma projection 90 jours gratuite
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Données
const problemesTPE = [
  {
    icon: AlertTriangle,
    title: "Découverts inattendus",
    description: "63% des TPE découvrent leurs problèmes de trésorerie trop tard",
    color: "text-red-400",
  },
  {
    icon: Clock,
    title: "Retards de paiement",
    description: "Délais clients imprévisibles qui déséquilibrent votre trésorerie",
    color: "text-amber-400",
  },
  {
    icon: Calendar,
    title: "Échéances oubliées",
    description: "URSSAF, TVA, loyers... les dates arrivent toujours trop vite",
    color: "text-orange-400",
  },
];

const solutions = [
  {
    icon: TrendingUp,
    title: "Projection 90 jours",
    description: "Visualisez votre trésorerie sur 3 mois avec les encaissements prévus et les charges à venir.",
    highlight: "Anticipez avant d'être en difficulté",
  },
  {
    icon: Target,
    title: "Alertes préventives",
    description: "Recevez une notification 15 jours avant un passage en négatif pour agir à temps.",
    highlight: "Zéro surprise, zéro stress",
  },
  {
    icon: BarChart3,
    title: "Scénarios what-if",
    description: "Simulez l'impact d'un retard client, d'une embauche ou d'un investissement.",
    highlight: "Décidez en toute confiance",
  },
];

const temoignagesCEO = [
  {
    name: "Sophie Martin",
    role: "CEO, Agence Web Créative",
    company: "12 employés",
    avatar: "SM",
    quote: "Avant Quelyos, je passais mes dimanches à refaire mes tableurs Excel. Maintenant je dors tranquille : je vois ma tréso 90 jours à l'avance.",
    metric: "6h/mois gagnées",
  },
  {
    name: "Thomas Dubois",
    role: "Fondateur, Cabinet Conseil RH",
    company: "8 employés • Bordeaux",
    avatar: "TD",
    quote: "Le simulateur de scénarios m'a évité une erreur à 15k€. J'ai pu décaler une embauche de 2 mois et sécuriser ma tréso.",
    metric: "15k€ économisés",
  },
  {
    name: "Marie Lefebvre",
    role: "Directrice, Bureau d'études",
    company: "15 employés • Nantes",
    avatar: "ML",
    quote: "Les alertes préventives ont changé ma vie. Plus de mauvaises surprises le 25 du mois quand les salaires tombent.",
    metric: "0 découvert depuis 8 mois",
  },
];

const comparatif = [
  { feature: "Projection trésorerie 90j", quelyos: true, excel: false, agicap: true },
  { feature: "Adapté TPE 5-20 employés", quelyos: true, excel: true, agicap: false },
  { feature: "Scénarios what-if", quelyos: true, excel: false, agicap: true },
  { feature: "Alertes préventives", quelyos: true, excel: false, agicap: true },
  { feature: "Prix < 50€/mois", quelyos: true, excel: true, agicap: false },
  { feature: "Setup en 15 min", quelyos: true, excel: false, agicap: false },
];

const etapes = [
  {
    num: "1",
    title: "Connectez vos comptes",
    description: "Import bancaire sécurisé ou saisie manuelle en 5 minutes",
    time: "5 min",
  },
  {
    num: "2",
    title: "Ajoutez vos échéances",
    description: "URSSAF, loyers, salaires... on vous guide étape par étape",
    time: "10 min",
  },
  {
    num: "3",
    title: "Visualisez vos 90 jours",
    description: "Projection automatique avec alertes si passage en négatif",
    time: "Instantané",
  },
];

export default function LandingTPE() {
  return (
    <div className="relative isolate min-h-screen bg-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-x-0 top-[-20%] h-96 bg-gradient-to-r from-indigo-600/20 via-cyan-400/10 to-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[380px] w-[380px] rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-[-10%] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <Header />

        <Container className="py-8 md:px-10">
        <main className="mt-12 space-y-20">
          {/* HERO SECTION - Messaging clé */}
          <section className="grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-6">
              {/* Badge TPE */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                <Building2 size={16} />
                Conçu pour les TPE 5-20 employés
              </div>

              {/* Headline principale */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                <span className="flex items-center gap-3">
                  <Moon className="h-10 w-10 text-indigo-400" />
                  Dormez tranquille :
                </span>
                <span className="mt-2 block bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  trésorerie pilotée 90 jours.
                </span>
              </h1>

              {/* Sous-titre */}
              <p className="text-xl text-slate-300">
                Fini les tableurs Excel anxiogènes et les découverts surprises. 
                <strong className="text-white"> Visualisez votre trésorerie 3 mois à l&apos;avance</strong> et anticipez les problèmes avant qu&apos;ils n&apos;arrivent.
              </p>

              {/* CTA principal */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#simulateur"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-1 hover:bg-indigo-400"
                >
                  <Calculator size={20} />
                  Simulateur gratuit
                </Link>
                <Link
                  href={config.finance.register}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold text-indigo-100 ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/5"
                >
                  <Play size={20} />
                  Voir la démo
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex -space-x-2">
                  {["SM", "TD", "ML", "JD"].map((initials, i) => (
                    <div
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-bold text-white ring-2 ring-slate-950"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-300">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <span>Adopté par <strong className="text-white">127 TPE</strong></span>
                </div>
              </div>
            </div>

            {/* Preview Dashboard */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-indigo-950/50 p-6 shadow-2xl">
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
                
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Projection Trésorerie 90j</span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                      ✓ Situation saine
                    </span>
                  </div>
                  
                  {/* Mini chart simulation */}
                  <div className="h-32 rounded-xl bg-black/30 p-4 flex items-end gap-2">
                    {[65, 58, 72, 45, 68, 82, 75, 90, 85, 78, 92, 88].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div 
                          className={`rounded-t transition-all ${
                            h < 50 ? "bg-red-400" : h < 70 ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Solde actuel</p>
                      <p className="text-lg font-bold text-white">24 350 €</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Projeté J+30</p>
                      <p className="text-lg font-bold text-emerald-400">+18 200 €</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Projeté J+90</p>
                      <p className="text-lg font-bold text-emerald-400">+31 400 €</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-amber-300 font-medium">Alerte J+45 :</span>
                      <span className="text-slate-300"> TVA trimestrielle (4 200€) - provision recommandée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION PROBLÈME */}
          <section id="probleme" className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white">
                Le cauchemar du dirigeant TPE
              </h2>
              <p className="mt-3 text-lg text-slate-400">
                Vous reconnaissez-vous dans ces situations ?
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {problemesTPE.map((probleme) => (
                <div
                  key={probleme.title}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 transition hover:border-red-500/40"
                >
                  <probleme.icon className={`h-8 w-8 ${probleme.color}`} />
                  <h3 className="mt-4 text-lg font-semibold text-white">{probleme.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{probleme.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-lg text-slate-300">
                <strong className="text-white">Résultat :</strong> des nuits blanches, des décisions précipitées, et parfois des erreurs coûteuses.
              </p>
              <p className="mt-2 text-emerald-400 font-semibold">
                Il existe une meilleure façon de gérer sa trésorerie.
              </p>
            </div>
          </section>

          {/* SECTION SOLUTION */}
          <section id="solution" className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30 mb-4">
                <Zap size={16} />
                La solution Quelyos
              </div>
              <h2 className="text-3xl font-bold text-white">
                Votre trésorerie pilotée, pas subie
              </h2>
              <p className="mt-3 text-lg text-slate-400">
                Trois fonctionnalités qui changent tout pour les TPE
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {solutions.map((solution) => (
                <div
                  key={solution.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30">
                    <solution.icon size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{solution.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{solution.description}</p>
                  <p className="mt-3 text-sm font-medium text-emerald-400">→ {solution.highlight}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SIMULATEUR */}
          <section id="simulateur" className="grid gap-10 md:grid-cols-2 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">
                Testez votre situation en 30 secondes
              </h2>
              <p className="text-lg text-slate-300">
                Notre simulateur gratuit analyse votre profil et vous indique si votre trésorerie est en zone de confort ou de vigilance.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Résultat instantané</p>
                    <p className="text-sm text-slate-400">Diagnostic de votre situation en temps réel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">100% gratuit</p>
                    <p className="text-sm text-slate-400">Aucune carte bancaire requise</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Données confidentielles</p>
                    <p className="text-sm text-slate-400">Calcul local, rien n&apos;est stocké</p>
                  </div>
                </div>
              </div>
            </div>
            <SimulateurTresorerie />
          </section>

          {/* COMMENT ÇA MARCHE */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Setup en 15 minutes</h2>
              <p className="mt-3 text-lg text-slate-400">Pas besoin de consultant, vous êtes autonome</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {etapes.map((etape) => (
                <div key={etape.num} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-xl font-bold text-white">
                      {etape.num}
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                      {etape.time}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{etape.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{etape.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* COMPARATIF */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Pourquoi Quelyos ?</h2>
              <p className="mt-3 text-lg text-slate-400">Le juste milieu entre Excel gratuit et Agicap trop cher</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-slate-400 font-medium">Fonctionnalité</th>
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-indigo-400 font-bold">Quelyos</span>
                        <span className="text-xs text-slate-500">29€/mois</span>
                      </div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-400 font-medium">Excel</span>
                        <span className="text-xs text-slate-500">0€</span>
                      </div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-400 font-medium">Agicap</span>
                        <span className="text-xs text-slate-500">200€+/mois</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparatif.map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-4 text-slate-300">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.quelyos ? (
                          <CheckCircle2 className="inline h-5 w-5 text-emerald-400" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.excel ? (
                          <CheckCircle2 className="inline h-5 w-5 text-slate-500" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.agicap ? (
                          <CheckCircle2 className="inline h-5 w-5 text-slate-500" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TÉMOIGNAGES CEO */}
          <section id="temoignages" className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Ils dorment mieux depuis</h2>
              <p className="mt-3 text-lg text-slate-400">Des dirigeants TPE comme vous</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {temoignagesCEO.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-indigo-500/5 p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-sm font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                      <p className="text-xs text-slate-500">{t.company}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-300 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">{t.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA FINAL */}
          <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-emerald-900/20 p-10 text-center">
            <Moon className="h-12 w-12 text-indigo-400 mx-auto" />
            <h2 className="mt-4 text-3xl font-bold text-white">
              Prêt à dormir tranquille ?
            </h2>
            <p className="mt-3 text-lg text-slate-300 max-w-xl mx-auto">
              Rejoignez les 127 dirigeants TPE qui pilotent leur trésorerie 90 jours à l&apos;avance.
              <strong className="text-white"> Essai gratuit 14 jours, sans carte bancaire.</strong>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={config.finance.register}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-1 hover:bg-indigo-400"
              >
                Commencer mon essai gratuit
                <ArrowRight size={20} />
              </Link>
              <Link
                href="#simulateur"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-indigo-100 ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/5"
              >
                <Calculator size={20} />
                Tester le simulateur d&apos;abord
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Questions ? Contactez-nous : <a href="mailto:contact@quelyos.com" className="text-indigo-300 hover:underline">contact@quelyos.com</a>
            </p>
          </section>

          {/* Footer */}
          <Footer />
        </main>
        </Container>
      </div>
    </div>
  );
}