import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { GlassPanel } from '@quelyos/ui/glass';
import type { ForecastAccount } from "@/types/forecast";

interface AccountBreakdownProps {
  accounts: ForecastAccount[];
  currency: string;
}

export function AccountBreakdown({ accounts, currency }: AccountBreakdownProps) {
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);

  if (accounts.length === 0) return null;

  return (
    <GlassPanel gradient="indigo" className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Détail par compte</h2>
        <p className="text-sm text-gray-600 dark:text-indigo-100/80">
          Projection individuelle de chaque compte bancaire
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((acc) => {
          const futureImpact = acc.projectedBalance - acc.baseBalance;
          const isExpanded = expandedAccount === acc.accountId;

          return (
            <motion.div
              key={acc.accountId}
              layout
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
            >
              <button
                onClick={() => setExpandedAccount(isExpanded ? null : acc.accountId)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                    <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{acc.accountName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      Solde actuel :{" "}
                      {acc.baseBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}{" "}
                      {currency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {acc.projectedBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}{" "}
                      {currency}
                    </p>
                    <p
                      className={`flex items-center justify-end gap-1 text-xs ${
                        futureImpact >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {futureImpact >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {futureImpact >= 0 ? "+" : ""}
                      {futureImpact.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 dark:text-slate-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && acc.daily.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-white/5"
                  >
                    <div className="max-h-60 overflow-auto p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 dark:text-slate-500">
                            <th className="pb-2">Date</th>
                            <th className="pb-2 text-right">Entrées</th>
                            <th className="pb-2 text-right">Sorties</th>
                            <th className="pb-2 text-right">Solde</th>
                          </tr>
                        </thead>
                        <tbody>
                          {acc.daily.slice(0, 30).map((day, i) => (
                            <tr key={i} className="border-t border-gray-100 dark:border-white/5">
                              <td className="py-2 text-gray-700 dark:text-slate-300">
                                {new Date(day.date).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </td>
                              <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">
                                +
                                {(day.credit + day.plannedCredit).toLocaleString("fr-FR", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                                -
                                {(day.debit + day.plannedDebit).toLocaleString("fr-FR", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                                {day.balance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
