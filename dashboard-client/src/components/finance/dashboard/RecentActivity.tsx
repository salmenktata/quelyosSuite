import { memo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StaggerContainer, StaggerItem } from "@/lib/finance/compat/animated";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Briefcase,
  Home,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";
import type { DashboardTransaction } from "@/lib/finance/reporting";
import { api } from "@/lib/finance/api";
import { showToast } from "@/lib/notifications";

interface RecentActivityProps {
  transactions: DashboardTransaction[];
  formatAmount: (amount: number) => string;
}

function getTransactionIcon(type: "credit" | "debit", category: string | null) {
  if (type === "credit") {
    return <ArrowDownLeft className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
  }
  if (category?.toLowerCase().includes("shopping") || category?.toLowerCase().includes("achat")) {
    return <ShoppingCart className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
  }
  if (category?.toLowerCase().includes("business") || category?.toLowerCase().includes("professionnel")) {
    return <Briefcase className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
  }
  if (category?.toLowerCase().includes("home") || category?.toLowerCase().includes("maison")) {
    return <Home className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
  }
  return <ArrowUpRight className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
}

export const RecentActivity = memo(function RecentActivity({
  transactions,
  formatAmount,
}: RecentActivityProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return api(`/transactions/${transactionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      showToast("Transaction supprimée", "success");
      setOpenMenuId(null);
    },
    onError: () => {
      showToast("Erreur lors de la suppression", "error");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (transaction: DashboardTransaction) => {
      return api("/transactions", {
        method: "POST",
        body: JSON.stringify({
          amount: transaction.amount,
          type: transaction.type,
          categoryId: transaction.category?.id,
          description: `${transaction.description} (copie)`,
          occurredAt: new Date().toISOString(),
          status: "CONFIRMED",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      showToast("Transaction dupliquée", "success");
      setOpenMenuId(null);
    },
    onError: () => {
      showToast("Erreur lors de la duplication", "error");
    },
  });

  const handleDelete = (transaction: DashboardTransaction) => {
    if (confirm(`Supprimer la transaction "${transaction.description}" ?`)) {
      deleteMutation.mutate(transaction.id);
    }
  };

  const handleDuplicate = (transaction: DashboardTransaction) => {
    duplicateMutation.mutate(transaction);
  };

  const handleEdit = useCallback((transactionId: number) => {
    navigate(`/finance/transactions?edit=${transactionId}`);
  }, [navigate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6" data-guide="recent-transactions">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Activité récente
        </h2>
        <Link
          to="/finance/transactions"
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        >
          Voir tout →
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune transaction récente.
          </p>
        </div>
      ) : (
        <StaggerContainer speed="fast" className="space-y-2">
          {transactions.map((tx) => (
            <StaggerItem key={tx.id}>
              <div className="group relative flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="rounded-lg bg-white dark:bg-gray-600 p-2 shadow-sm">
                  {getTransactionIcon(tx.type, tx.category?.name || null)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tx.description || tx.category?.name || "Transaction"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(tx.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {tx.category && (
                      <>
                        <span>•</span>
                        <span className="truncate">{tx.category.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold flex-shrink-0 ${
                    tx.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatAmount(tx.amount)}
                </p>

                {/* Quick actions menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === tx.id ? null : tx.id)}
                    className="rounded p-1 opacity-0 transition-all hover:bg-gray-200 dark:hover:bg-gray-600 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {openMenuId === tx.id && (
                    <div className="absolute right-0 top-8 z-50 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
                      <div className="p-1">
                        <button
                          onClick={() => handleEdit(tx.id)}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDuplicate(tx)}
                          disabled={duplicateMutation.isPending}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Copy className="h-4 w-4" />
                          Dupliquer
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deleteMutation.isPending}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
});
