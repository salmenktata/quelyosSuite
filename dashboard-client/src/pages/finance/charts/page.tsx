

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { BarChart3, PieChart, LineChart } from "lucide-react";

export default function ChartsPage() {
  useRequireAuth();

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Rapports</p>
        <h1 className="text-2xl font-semibold">Graphiques</h1>
        <p className="text-sm text-indigo-100/80">
          Visualisez vos flux financiers sous forme de graphiques interactifs.
        </p>
      </div>

      <GlassPanel className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-indigo-300" />
              <div>
                <p className="text-sm font-semibold">Évolution mensuelle</p>
                <p className="text-xs text-indigo-100/70">Recettes et dépenses</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold">Répartition catégories</p>
                <p className="text-xs text-indigo-100/70">Vue par poste</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-sm font-semibold">Cash-flow projeté</p>
                <p className="text-xs text-indigo-100/70">Prévisions 90 jours</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </GlassPanel>
    </div>
  );
}
