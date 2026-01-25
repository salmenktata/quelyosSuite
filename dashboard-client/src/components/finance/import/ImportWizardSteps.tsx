"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportWizardStepsProps } from "@/types/import";

export function ImportWizardSteps({
  steps,
  currentStep,
  onStepClick,
}: ImportWizardStepsProps) {
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStepStyles = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return {
          circle: "bg-emerald-500 border-emerald-400",
          text: "text-emerald-300",
          line: "bg-emerald-500/50",
        };
      case 'current':
        return {
          circle: "bg-indigo-500 border-indigo-400 ring-4 ring-indigo-500/20",
          text: "text-white font-semibold",
          line: "bg-white/10",
        };
      case 'pending':
        return {
          circle: "bg-white/5 border-white/20",
          text: "text-white/40",
          line: "bg-white/10",
        };
    }
  };

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop: Horizontal layout */}
      <ol className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const status = getStepStatus(idx);
          const styles = getStepStyles(status);
          const Icon = step.icon;
          const isClickable = onStepClick && status === 'completed';

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className={cn(
                  "group flex flex-col items-center gap-2 relative",
                  isClickable && "cursor-pointer hover:opacity-80 transition"
                )}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                    styles.circle
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <Icon className="h-6 w-6 text-current" />
                  )}
                </div>
                <span className={cn("text-sm transition-colors", styles.text)}>
                  {step.label}
                </span>
              </button>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    styles.line
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: Vertical compact layout */}
      <ol className="md:hidden space-y-3">
        {steps.map((step, idx) => {
          const status = getStepStatus(idx);
          const styles = getStepStyles(status);
          const Icon = step.icon;
          const isClickable = onStepClick && status === 'completed';

          return (
            <li key={step.id}>
              <button
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 w-full text-left",
                  isClickable && "cursor-pointer hover:opacity-80 transition"
                )}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {/* Step Circle (smaller on mobile) */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    styles.circle
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <Icon className="h-5 w-5 text-current" />
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm transition-colors", styles.text)}>
                    {step.label}
                  </p>
                  {status === 'current' && (
                    <p className="text-xs text-indigo-300/70 mt-0.5">
                      En cours
                    </p>
                  )}
                </div>

                {/* Step Number Badge */}
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    status === 'completed' && "bg-emerald-500/20 text-emerald-300",
                    status === 'current' && "bg-indigo-500/20 text-indigo-300",
                    status === 'pending' && "bg-white/5 text-white/30"
                  )}
                >
                  {idx + 1}
                </div>
              </button>

              {/* Vertical connector line */}
              {idx < steps.length - 1 && (
                <div className="ml-5 pl-5 py-2">
                  <div
                    className={cn(
                      "w-0.5 h-6 transition-colors",
                      styles.line
                    )}
                    aria-hidden="true"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
