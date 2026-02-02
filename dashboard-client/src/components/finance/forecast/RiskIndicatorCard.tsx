import { LazyMotion, domAnimation, m } from "framer-motion";
import { Shield, Activity, AlertTriangle, Info } from "lucide-react";
import type { RiskIndicator, RiskLevel } from "@/types/forecast";

const RISK_CONFIG: Record<
  RiskLevel,
  {
    icon: typeof Shield;
    label: string;
    description: string;
    bg: string;
    border: string;
    text: string;
    bar: string;
  }
> = {
  low: {
    icon: Shield,
    label: "Risque faible",
    description: "Votre trésorerie est saine",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  medium: {
    icon: Activity,
    label: "Risque modéré",
    description: "Vigilance recommandée",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  high: {
    icon: AlertTriangle,
    label: "Risque élevé",
    description: "Actions correctives conseillées",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  critical: {
    icon: AlertTriangle,
    label: "Risque critique",
    description: "Intervention urgente requise",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
  },
};

interface RiskIndicatorCardProps {
  risk: RiskIndicator;
  currency: string;
}

export function RiskIndicatorCard({ risk, currency }: RiskIndicatorCardProps) {
  const config = RISK_CONFIG[risk.level];
  const Icon = config.icon;

  return (
    <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border ${config.border} ${config.bg} p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg}`}>
            <Icon className={`h-6 w-6 ${config.text}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${config.text}`}>{config.label}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{config.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{risk.score}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">/ 100</div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${risk.score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${config.bar}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-500">Solde minimum projeté</p>
          <p
            className={`text-lg font-semibold ${
              risk.minimumBalance < 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {risk.minimumBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-500">Jours avant solde négatif</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {risk.daysToNegative !== null ? `${risk.daysToNegative}j` : "—"}
          </p>
        </div>
      </div>

      {risk.alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {risk.alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-white/5 p-3"
            >
              <Info size={14} className={`mt-0.5 shrink-0 ${config.text}`} />
              <p className="text-xs text-gray-700 dark:text-slate-300">{alert}</p>
            </div>
          ))}
        </div>
      )}
    </m.div>
    </LazyMotion>
  );
}
