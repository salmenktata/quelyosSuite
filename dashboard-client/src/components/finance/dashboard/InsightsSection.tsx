import { memo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass";
import { StaggerContainer, StaggerItem } from "@/lib/finance/compat/animated";
import type { DashboardInsight } from "@/lib/finance/reporting";

interface InsightsSectionProps {
  insights: DashboardInsight[];
}

// Map insight type to icon
function getInsightIcon(type: DashboardInsight["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-400" />;
    case "error":
      return <XCircle className="h-5 w-5 text-rose-400" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-400" />;
  }
}

// Map insight type to background color
function getInsightBg(type: DashboardInsight["type"]) {
  switch (type) {
    case "success":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "warning":
      return "bg-amber-500/10 border-amber-500/20";
    case "error":
      return "bg-rose-500/10 border-rose-500/20";
    case "info":
    default:
      return "bg-blue-500/10 border-blue-500/20";
  }
}

export const InsightsSection = memo(function InsightsSection({
  insights,
}: InsightsSectionProps) {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h2 className="text-xl font-semibold text-white">
          Ce qu&apos;on a remarqué
        </h2>
      </div>
      {insights.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-slate-400">
            Aucun insight disponible pour le moment.
          </p>
        </div>
      ) : (
        <StaggerContainer speed="fast" className="space-y-3">
          {insights.map((insight, index) => (
            <StaggerItem key={`${insight.title}-${index}`}>
              <Link
                to={insight.actionUrl}
                className={`flex items-start gap-3 rounded-lg border p-4 transition-all duration-150 hover:scale-[1.02] hover:bg-white/[0.08] ${getInsightBg(insight.type)}`}
              >
                <div className="rounded-lg bg-white/10 p-2">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <p className="mb-1 font-medium text-white">{insight.title}</p>
                  <p className="mb-2 text-sm text-slate-400">
                    {insight.description}
                  </p>
                  <p className="text-xs font-medium text-violet-400 hover:text-violet-300">
                    {insight.action} →
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </GlassCard>
  );
});
