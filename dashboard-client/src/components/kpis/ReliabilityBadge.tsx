import { cn } from "@/lib/utils";

interface ReliabilityData {
  score: number;
  level: "high" | "medium" | "low" | "excellent" | "good" | "moderate" | "poor";
  factors?: string[];
  prerequisites?: {
    met: string[];
    missing: string[];
    warnings: string[];
  };
}

interface ReliabilityBadgeProps {
  reliability: ReliabilityData;
  showDetails?: boolean;
  reportId?: string;
  className?: string;
}

export function ReliabilityBadge({ reliability, showDetails, className }: ReliabilityBadgeProps) {
  // Convertir les niveaux ReliabilityScore en niveaux ReliabilityData
  const normalizeLevel = (level: ReliabilityData['level']): "high" | "medium" | "low" => {
    if (level === "excellent" || level === "good") return "high";
    if (level === "moderate") return "medium";
    if (level === "poor") return "low";
    return level as "high" | "medium" | "low";
  };

  const normalizedLevel = normalizeLevel(reliability.level);

  const colors = {
    high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const labels = {
    high: "Fiable",
    medium: "Modéré",
    low: "Faible",
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border", colors[normalizedLevel])}>
        <span className="text-sm font-medium">{labels[normalizedLevel]}</span>
        <span className="text-xs opacity-80">{Math.round(reliability.score * 100)}%</span>
      </div>
      {showDetails && reliability.factors && reliability.factors.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-1">
          {reliability.factors.map((factor, i) => (
            <li key={i}>{factor}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
