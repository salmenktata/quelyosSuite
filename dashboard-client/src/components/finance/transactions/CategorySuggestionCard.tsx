

import React, { useEffect, useState } from "react";
import { api } from "@/lib/finance/api";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { logger } from '@quelyos/logger';

interface CategorySuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

interface CategorySuggestionResponse {
  suggestions: CategorySuggestion[];
  recommended: CategorySuggestion | null;
  model_info: {
    exists: boolean;
    samples_used?: number;
    accuracy?: number;
  };
}

interface Props {
  description: string;
  amount: number;
  type: "credit" | "debit";
  currentCategoryId?: string;
  onAccept: (categoryId: number, categoryName: string) => void;
  onReject: () => void;
}

export function CategorySuggestionCard({
  description,
  amount,
  type,
  currentCategoryId,
  onAccept,
  onReject,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [_error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset when inputs change
    setSuggestion(null);
    setError(null);
    setDismissed(false);

    // Only fetch if we have description and amount
    if (!description || !amount || amount <= 0) {
      return;
    }

    // Don't fetch if user has already selected a category manually
    if (currentCategoryId) {
      return;
    }

    // Debounce to avoid too many requests
    const timer = setTimeout(() => {
      fetchSuggestion();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, amount, type]);

  async function fetchSuggestion() {
    setLoading(true);
    setError(null);

    try {
      const response = await api<CategorySuggestionResponse>(
        "/finance/suggestions/categorize",
        {
          method: "POST",
          body: {
            description,
            amount: Number(amount),
            type,
          },
        }
      );

      // Only show if confidence >= 60%
      if (response.recommended && response.recommended.confidence >= 0.6) {
        setSuggestion(response.recommended);
      } else {
        setSuggestion(null);
      }
    } catch (_err) {
      // Silently fail - ML suggestions are optional
      logger.error("Failed to fetch category suggestion:", err);
      setError(null); // Don't show error to user
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!suggestion) return;
    onAccept(suggestion.categoryId, suggestion.categoryName);
    setDismissed(true);
  }

  function handleReject() {
    onReject();
    setDismissed(true);
    setSuggestion(null);
  }

  // Don't render if:
  // - Loading or no suggestion
  // - User dismissed
  // - User already selected a category
  if (loading || !suggestion || dismissed || currentCategoryId) {
    return null;
  }

  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 backdrop-blur-sm">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-400/5 to-purple-500/0 opacity-50" />

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Suggestion IA</h3>
              <p className="text-xs text-indigo-200/80">
                Catégorie recommandée
              </p>
            </div>
          </div>

          {/* Confidence badge */}
          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
            <span className="text-xs font-semibold text-emerald-300">
              {confidencePercent}% confiance
            </span>
          </div>
        </div>

        {/* Suggested category */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5">
            <p className="text-sm font-medium text-white">
              {suggestion.categoryName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accepter
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-all hover:border-rose-400/50 hover:bg-rose-500/20"
          >
            <XCircle className="h-4 w-4" />
            Ignorer
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-indigo-100/60">
          Cette suggestion est basée sur l'analyse de vos transactions passées.
        </p>
      </div>
    </div>
  );
}
