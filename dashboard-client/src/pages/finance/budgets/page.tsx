

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { GlassCard, GlassPanel, GlassButton } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useApiData } from "@/hooks/finance/useApiData";
import { BudgetStatsCards } from "@/components/finance/budgets/BudgetStatsCards";
import { BudgetFilters, type BudgetFilterState } from "@/components/finance/budgets/BudgetFilters";
import { BudgetTable } from "@/components/finance/budgets/BudgetTable";
import { BudgetCard } from "@/components/finance/budgets/BudgetCard";
import { BudgetAnalytics } from "@/components/finance/budgets/BudgetAnalytics";
import { BudgetExport } from "@/components/finance/budgets/BudgetExport";
import { BudgetFormModal } from "@/components/finance/budgets/BudgetFormModal";
import { Plus, Sparkles } from "lucide-react";
import type { CreateBudgetRequest, UpdateBudgetRequest } from "@/types/api";

type Budget = {
  id: number;
  name: string;
  amount: number;
  createdAt: string;
  currentSpending?: number;
  percentageUsed?: number;
  status?: "ON_TRACK" | "WARNING" | "EXCEEDED";
  category?: { id: number; name: string } | null;
  period?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  startDate?: string;
  endDate?: string | null;
};

type Category = {
  id: number;
  name: string;
  kind: "INCOME" | "EXPENSE";
};

type SortColumn = "name" | "category" | "period" | "amount" | "percentageUsed" | "status";
type SortDirection = "asc" | "desc";

export default function BudgetsPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  // Fetch budgets with automatic caching
  const {
    data: budgets,
    loading: budgetsLoading,
    error: budgetsError,
    refetch: refetchBudgets
  } = useApiData<Budget[]>({
    fetcher: () => api<Budget[]>("/budgets?includeSpending=true"),
    cacheKey: "budgets",
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
  });

  // Fetch categories with automatic caching
  const {
    data: categories,
    loading: categoriesLoading
  } = useApiData<Category[]>({
    fetcher: () => api<Category[]>("/categories"),
    cacheKey: "categories",
    cacheTime: 10 * 60 * 1000, // 10 minutes cache (categories change less frequently)
  });

  // Combined loading and error states
  const loading = budgetsLoading || categoriesLoading;
  const error = budgetsError?.message || null;

  // Filtres
  const [filters, setFilters] = useState<BudgetFilterState>({
    search: "",
    status: "ALL",
    period: "ALL",
    categoryIds: [],
    dateFrom: "",
    dateTo: ""
  });

  // Tri
  const [sortBy, setSortBy] = useState<SortColumn>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close forms
      if (e.key === "Escape") {
        if (showCreateForm) {
          setShowCreateForm(false);
        } else if (editingBudget) {
          setEditingBudget(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateForm, editingBudget]);

  const handleCreateBudget = useCallback(async (formData: {
    name: string;
    amount: string;
    categoryId: number | null;
    period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
    startDate: string;
    endDate: string;
  }) => {
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.period === "CUSTOM" && formData.endDate ? formData.endDate : null
      };

      await api("/budgets", {
        method: "POST",
        body: payload as CreateBudgetRequest
      });

      await refetchBudgets();
      setShowCreateForm(false);
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  }, [refetchBudgets]);

  // Logique de filtrage
  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];
    let result = [...budgets];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.category?.name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status !== "ALL") {
      result = result.filter(b => b.status === filters.status);
    }

    // Period filter
    if (filters.period !== "ALL") {
      result = result.filter(b => b.period === filters.period);
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      result = result.filter(b =>
        b.category && filters.categoryIds.includes(b.category.id)
      );
    }

    // Date range filter (check if budget is active in range)
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(b => {
        if (!b.startDate) return true; // Include budgets without dates

        const budgetStart = new Date(b.startDate);
        const budgetEnd = b.endDate ? new Date(b.endDate) : new Date('2100-01-01');
        const rangeStart = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
        const rangeEnd = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-01-01');

        return budgetStart <= rangeEnd && budgetEnd >= rangeStart;
      });
    }

    return result;
  }, [budgets, filters]);

  // Logique de tri
  const sortedBudgets = useMemo(() => {
    const result = [...filteredBudgets];

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "category":
        result.sort((a, b) => {
          const catA = a.category?.name || "";
          const catB = b.category?.name || "";
          return catA.localeCompare(catB);
        });
        break;
      case "period":
        result.sort((a, b) => {
          const periodA = a.period || "";
          const periodB = b.period || "";
          return periodA.localeCompare(periodB);
        });
        break;
      case "amount":
        result.sort((a, b) => a.amount - b.amount);
        break;
      case "percentageUsed":
        result.sort((a, b) => (a.percentageUsed || 0) - (b.percentageUsed || 0));
        break;
      case "status":
        const statusOrder = { ON_TRACK: 1, WARNING: 2, EXCEEDED: 3 };
        result.sort((a, b) => {
          const orderA = a.status ? statusOrder[a.status] : 999;
          const orderB = b.status ? statusOrder[b.status] : 999;
          return orderA - orderB;
        });
        break;
    }

    return sortDir === "desc" ? result.reverse() : result;
  }, [filteredBudgets, sortBy, sortDir]);

  // Handler de tri
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  // Handlers d'actions
  const handleEdit = useCallback((budget: Budget) => {
    setShowCreateForm(false);
    setEditingBudget(budget);
  }, []);

  const handleDuplicate = useCallback(async (budget: Budget) => {
    try {
      await api("/budgets", {
        method: "POST",
        body: {
          name: `${budget.name} (copie)`,
          amount: budget.amount,
          categoryId: budget.category?.id || null,
          period: budget.period || "MONTHLY",
          startDate: budget.startDate || new Date().toISOString(),
          endDate: budget.endDate || null
        } as CreateBudgetRequest
      });
      await refetchBudgets();
    } catch (err) {
      // Error will be handled by useApiData
    }
  }, [refetchBudgets]);

  const handleDelete = useCallback(async (budget: Budget) => {
    if (!confirm(`Supprimer le budget "${budget.name}" ?`)) return;

    try {
      await api(`/budgets/${budget.id}`, { method: "DELETE" });
      await refetchBudgets();
    } catch (err) {
      // Error will be handled by useApiData
    }
  }, [refetchBudgets]);

  const handleUpdateBudget = useCallback(async (formData: {
    name: string;
    amount: string;
    categoryId: number | null;
    period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
    startDate: string;
    endDate: string;
  }) => {
    if (!editingBudget) return;

    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.period === "CUSTOM" && formData.endDate ? formData.endDate : null
      };

      await api(`/budgets/${editingBudget.id}`, {
        method: "PUT",
        body: payload as UpdateBudgetRequest
      });

      await refetchBudgets();
      setEditingBudget(null);
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  }, [editingBudget, refetchBudgets]);

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Budgets</p>
        <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-2xl md:text-3xl font-semibold text-transparent">
          Pilotez vos enveloppes
        </h1>
        <p className="text-sm text-indigo-100/80 hidden md:block">Créez, ajustez et suivez vos budgets par période.</p>
      </div>

      {/* Stats KPIs Section */}
      {budgets && budgets.length > 0 && (
        <div className="relative">
          <BudgetStatsCards budgets={budgets} formatCurrency={formatAmount} />
        </div>
      )}

      {/* Filters Section */}
      {budgets && budgets.length > 0 && (
        <div className="relative">
          <BudgetFilters
            filters={filters}
            onFilterChange={setFilters}
            categories={categories || []}
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="relative flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">Mes budgets</h2>
          <p className="text-sm text-indigo-100/80">
            {budgets?.length || 0} budget{(budgets?.length || 0) > 1 ? "s" : ""} créé{(budgets?.length || 0) > 1 ? "s" : ""} • {sortedBudgets.length} affiché{sortedBudgets.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {budgets && budgets.length > 0 && (
            <BudgetExport
              allBudgets={budgets}
              filteredBudgets={sortedBudgets}
              formatCurrency={formatAmount}
            />
          )}
          <GlassButton
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Annuler" : "Créer un budget"}
          </GlassButton>
        </div>
      </div>

      {/* Inline Budget Creation Form (collapsible) */}
      {showCreateForm && (
        <BudgetFormModal
          mode="create"
          categories={categories || []}
          onSubmit={handleCreateBudget}
          onCancel={() => setShowCreateForm(false)}
          error={error}
        />
      )}

      {/* Budgets List - Desktop Table View */}
      <div className="relative hidden md:block">
        <GlassPanel gradient="purple">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-xl animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-32" />
                  <div className="h-4 bg-white/10 rounded w-24" />
                  <div className="h-4 bg-white/10 rounded w-20" />
                  <div className="flex-1 h-4 bg-white/10 rounded" />
                  <div className="h-4 bg-white/10 rounded w-16" />
                </div>
              ))}
            </div>
          ) : !budgets || budgets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Aucun budget pour le moment</h3>
              <p className="text-sm text-indigo-100/60 mb-6">Créez votre premier budget pour commencer à piloter vos dépenses</p>
              <GlassButton
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier budget
              </GlassButton>
            </div>
          ) : (
            <BudgetTable
              budgets={sortedBudgets}
              formatCurrency={formatAmount}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          )}

          {!loading && budgets && budgets.length > 0 && sortedBudgets.length === 0 && (
            <div className="py-8 text-center text-indigo-100/60">
              Aucun budget ne correspond aux filtres sélectionnés.
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Budgets List - Mobile Card View */}
      <div className="relative md:hidden space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {!loading && (!budgets || budgets.length === 0) && (
          <GlassCard className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Aucun budget</h3>
            <p className="text-sm text-indigo-100/60 mb-4 px-4">Créez votre premier budget pour commencer</p>
            <GlassButton
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un budget
            </GlassButton>
          </GlassCard>
        )}

        {!loading && budgets && budgets.length > 0 && sortedBudgets.length === 0 && (
          <GlassCard variant="subtle" className="px-4 py-3 text-sm text-indigo-100/80">
            Aucun budget ne correspond aux filtres sélectionnés.
          </GlassCard>
        )}

        {!loading &&
          sortedBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              formatCurrency={formatAmount}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
      </div>

      {/* Inline Edit Form */}
      {editingBudget && (
        <BudgetFormModal
          mode="edit"
          initialData={{
            name: editingBudget.name || "",
            amount: editingBudget.amount ? editingBudget.amount.toString() : "0",
            categoryId: editingBudget.category?.id || null,
            period: editingBudget.period || "MONTHLY",
            startDate: editingBudget.startDate ? editingBudget.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
            endDate: editingBudget.endDate ? editingBudget.endDate.split("T")[0] : ""
          }}
          categories={categories || []}
          onSubmit={handleUpdateBudget}
          onCancel={() => setEditingBudget(null)}
          error={error}
        />
      )}

      {/* Analytics Section */}
      {budgets && budgets.length > 0 && (
        <BudgetAnalytics
          budgets={budgets}
          isExpanded={showAnalytics}
          onToggle={() => setShowAnalytics(!showAnalytics)}
          formatCurrency={formatAmount}
        />
      )}

    </div>
  );
}
