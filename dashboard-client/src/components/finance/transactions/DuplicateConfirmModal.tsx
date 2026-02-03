

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { AnimatePresence, ScaleInBounce, Hoverable } from "@/lib/finance/compat/animated";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface DuplicateMatch {
  transactionId: number;
  description: string;
  amount: number;
  date: string;
  similarity_score: number;
  description_similarity: number;
  amount_proximity: number;
  date_proximity: number;
}

interface Props {
  isOpen: boolean;
  matches: DuplicateMatch[];
  newTransaction: {
    description: string;
    amount: number;
    date: string;
  };
  onConfirmDuplicate: (matchId: number) => void;
  onIgnore: () => void;
  onCancel: () => void;
}

export function DuplicateConfirmModal({
  isOpen,
  matches,
  newTransaction,
  onConfirmDuplicate,
  onIgnore,
  onCancel,
}: Props) {
  const topMatch = matches[0];
  const confidencePercent = Math.round((topMatch?.similarity_score ?? 0) * 100);

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isOpen && matches.length > 0 && topMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <ScaleInBounce className="relative w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-900/20 p-6 shadow-2xl backdrop-blur-xl">
          {/* Animated gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/10 to-amber-500/0 opacity-50" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">
                  Doublon potentiel détecté
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Cette transaction ressemble fortement à une transaction existante.
                </p>
              </div>
              <button
                onClick={onCancel}
                className="text-slate-400 transition-colors hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Confidence badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Similarité :</span>
              <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1">
                <span className="text-sm font-semibold text-amber-300">
                  {confidencePercent}%
                </span>
              </div>
            </div>

            {/* Comparison */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Nouvelle transaction */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Nouvelle transaction
                </p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">
                    {newTransaction.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {new Date(newTransaction.date).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="font-semibold text-white">
                      {newTransaction.amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction existante */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Transaction existante
                </p>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-white">
                    {topMatch.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {new Date(topMatch.date).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="font-semibold text-white">
                      {topMatch.amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Détails de la similarité
              </p>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Description</span>
                  <span className="font-medium text-white">
                    {Math.round(topMatch.description_similarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Montant</span>
                  <span className="font-medium text-white">
                    {Math.round(topMatch.amount_proximity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Date</span>
                  <span className="font-medium text-white">
                    {Math.round(topMatch.date_proximity * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Hoverable enableScale>
                <button
                  type="button"
                  onClick={() => onConfirmDuplicate(topMatch.transactionId)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-6 py-3 text-sm font-medium text-rose-300 transition-all hover:border-rose-400/50 hover:bg-rose-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  C'est un doublon
                </button>
              </Hoverable>
              <Hoverable enableScale>
                <button
                  type="button"
                  onClick={onIgnore}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20"
                >
                  Créer quand même
                </button>
              </Hoverable>
            </div>

            {/* Helper text */}
            <p className="text-center text-xs text-slate-400">
              Si c'est un doublon, la transaction ne sera pas créée. Sinon, elle sera enregistrée normalement.
            </p>
          </div>
            </div>
          </ScaleInBounce>
        </div>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
}
