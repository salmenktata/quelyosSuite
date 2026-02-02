

import { AlertTriangle } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface AnomalyAlertBadgeProps {
  severity: "low" | "medium" | "high";
  explanation: string;
  score?: number;
  onDismiss?: () => void;
}

export default function AnomalyAlertBadge({
  severity,
  explanation,
  score,
  onDismiss,
}: AnomalyAlertBadgeProps) {
  const colors = {
    low: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-300",
      icon: "text-yellow-400",
    },
    medium: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-300",
      icon: "text-orange-400",
    },
    high: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-300",
      icon: "text-red-400",
    },
  };

  const severityConfig = colors[severity];

  const severityLabels = {
    low: "Attention",
    medium: "Anomalie détectée",
    high: "Anomalie importante",
  };

  return (
    <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        px-3 py-2 rounded-lg border
        ${severityConfig.bg}
        ${severityConfig.border}
        ${severityConfig.text}
        flex items-start gap-2
      `}
    >
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityConfig.icon}`} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5">{severityLabels[severity]}</p>
        <p className="text-xs opacity-80 leading-relaxed">{explanation}</p>

        {score !== undefined && (
          <p className="text-[10px] opacity-60 mt-1">
            Score d&apos;anomalie : {Math.round(score * 100)}%
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="
            text-xs opacity-60 hover:opacity-100
            transition-opacity px-2 py-1 rounded
            hover:bg-white/5
          "
          aria-label="Ignorer l'alerte"
        >
          ×
        </button>
      )}
    </m.div>
    </LazyMotion>
  );
}
