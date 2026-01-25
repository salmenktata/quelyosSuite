type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";

interface BudgetProgressBarProps {
  percentage: number;
  status: BudgetStatus;
  className?: string;
}

export function BudgetProgressBar({ percentage, status, className = "" }: BudgetProgressBarProps) {
  const getProgressColor = (status: BudgetStatus) => {
    switch (status) {
      case "EXCEEDED":
        return "bg-gradient-to-r from-rose-500 to-pink-600";
      case "WARNING":
        return "bg-gradient-to-r from-amber-500 to-orange-600";
      case "ON_TRACK":
        return "bg-gradient-to-r from-emerald-500 to-teal-600";
      default:
        return "bg-gradient-to-r from-emerald-500 to-teal-600";
    }
  };

  const clamped = Math.min(percentage, 100);

  return (
    <div
      className={`w-full h-2 overflow-hidden rounded-full bg-white/10 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Budget utilization"
      data-progress
    >
      <div
        className={`h-full transition-all duration-500 ${getProgressColor(status)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
