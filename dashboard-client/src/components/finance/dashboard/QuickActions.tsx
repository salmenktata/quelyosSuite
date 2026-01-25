import { memo } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Wallet, Target, Upload, ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassCard } from "@/components/ui/glass";
import {
  StaggerContainer,
  StaggerItem,
  Hoverable,
} from "@/lib/finance/compat/animated";

export const QuickActions = memo(function QuickActions() {
  return (
    <GlassCard className="p-6" data-guide="quick-actions">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Actions rapides
      </h2>
      <StaggerContainer speed="fast" className="space-y-3">
        <StaggerItem>
          <Hoverable enableScale>
            <Link
              to={ROUTES.TRANSACTIONS}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10"
            >
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <Plus className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Nouvelle transaction</p>
                <p className="text-xs text-slate-400">
                  Ajouter revenu ou dépense
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          </Hoverable>
        </StaggerItem>

        <StaggerItem>
          <Hoverable enableScale>
            <Link
              to={ROUTES.REPORTING}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/10"
            >
              <div className="rounded-lg bg-indigo-500/20 p-2">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Voir rapports</p>
                <p className="text-xs text-slate-400">8 rapports spécialisés</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          </Hoverable>
        </StaggerItem>

        <StaggerItem>
          <Hoverable enableScale>
            <Link
              to={ROUTES.ACCOUNTS}
              data-guide="accounts-section"
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-violet-500/50 hover:bg-violet-500/10"
            >
              <div className="rounded-lg bg-violet-500/20 p-2">
                <Wallet className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Gérer comptes</p>
                <p className="text-xs text-slate-400">
                  Comptes & portefeuilles
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          </Hoverable>
        </StaggerItem>

        <StaggerItem>
          <Hoverable enableScale>
            <Link
              to={ROUTES.BUDGETS}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/10"
            >
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Créer budget</p>
                <p className="text-xs text-slate-400">Cadres intelligents</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          </Hoverable>
        </StaggerItem>

        <StaggerItem>
          <Hoverable enableScale>
            <Link
              to={ROUTES.IMPORT}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-cyan-500/50 hover:bg-cyan-500/10"
            >
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <Upload className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Import intelligent</p>
                <p className="text-xs text-slate-400">
                  Excel/CSV avec détection auto
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          </Hoverable>
        </StaggerItem>
      </StaggerContainer>
    </GlassCard>
  );
});
