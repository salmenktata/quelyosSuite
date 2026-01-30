"use client";

import { useState } from "react";
import Header from "@/app/components/Header";
import config from "@/app/lib/config";
// TODO: Create InteractiveChart and glass UI components
// import { InteractiveChart } from "@/components/InteractiveChart";
// import { GlassCard, GlassPanel, GlassStatCard } from "@/components/ui/glass";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";
import Container from "@/app/components/Container";

// Sample data pour futurs graphiques interactifs
 
const _SAMPLE_DATA_MONTHLY = [
  { name: "Jan", revenus: 15000, dépenses: 12000, net: 3000 },
  { name: "Fév", revenus: 16500, dépenses: 13200, net: 3300 },
  { name: "Mar", revenus: 14800, dépenses: 11800, net: 3000 },
  { name: "Avr", revenus: 17200, dépenses: 14100, net: 3100 },
  { name: "Mai", revenus: 18000, dépenses: 13500, net: 4500 },
  { name: "Juin", revenus: 16800, dépenses: 12900, net: 3900 },
];

 
const _SAMPLE_DATA_CATEGORIES = [
  { name: "Salaires", value: 45000 },
  { name: "Freelance", value: 18000 },
  { name: "Investissements", value: 8500 },
  { name: "Autres", value: 3200 },
];

 
const _SAMPLE_DATA_WEEKLY = [
  { name: "Sem 1", solde: 25000 },
  { name: "Sem 2", solde: 27500 },
  { name: "Sem 3", solde: 26800 },
  { name: "Sem 4", solde: 29200 },
  { name: "Sem 5", solde: 31000 },
];

export default function ChartsPage() {
  const [activeTab, setActiveTab] = useState<"area" | "bar" | "line" | "pie">("area");

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <Header />
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <Container className="space-y-6 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-400">Visualisation</p>
          <h1 className="mt-2 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            Charts interactifs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Découvrez la puissance de nos graphiques interactifs pour visualiser vos données financières avec précision.
          </p>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("area")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "area"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-indigo-200 hover:bg-white/10"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Area Chart
            </button>
            <button
              onClick={() => setActiveTab("bar")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "bar"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-indigo-200 hover:bg-white/10"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </button>
            <button
              onClick={() => setActiveTab("line")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "line"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-indigo-200 hover:bg-white/10"
              }`}
            >
              <LineChart className="h-4 w-4" />
              Line Chart
            </button>
            <button
              onClick={() => setActiveTab("pie")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "pie"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-indigo-200 hover:bg-white/10"
              }`}
            >
              <PieChart className="h-4 w-4" />
              Pie Chart
            </button>
          </div>
        </div>

        {/* Temporary placeholder - TODO: Implement InteractiveChart and glass components */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {activeTab === "area" && "Évolution mensuelle (Area Chart)"}
              {activeTab === "bar" && "Comparaison mensuelle (Bar Chart)"}
              {activeTab === "line" && "Tendance du solde (Line Chart)"}
              {activeTab === "pie" && "Répartition par source (Pie Chart)"}
            </h2>
            <p className="text-sm text-indigo-100/80">
              {activeTab === "area" && "Visualisez l'évolution de vos revenus et dépenses au fil du temps"}
              {activeTab === "bar" && "Comparez vos revenus et dépenses mensuels côte à côte"}
              {activeTab === "line" && "Suivez la progression de votre solde global"}
              {activeTab === "pie" && "Analysez la répartition de vos sources de revenus"}
            </p>
          </div>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white/5">
            <p className="text-slate-400">Graphiques interactifs disponibles dans l&apos;application</p>
          </div>
        </div>

        {/* Info Banner + CTA */}
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-900/20 p-6 text-center backdrop-blur-sm">
          <p className="mb-2 text-2xl font-semibold text-white">Prêt à piloter vos finances ?</p>
          <p className="mb-4 text-indigo-100">
            Ces graphiques interactifs sont intégrés dans Quelyos. Créez votre compte gratuitement pour accéder à tous les rapports.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href={config.finance.register}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50"
            >
              Commencer gratuitement
            </a>
            <a
              href="/features"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voir toutes les fonctionnalités
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}