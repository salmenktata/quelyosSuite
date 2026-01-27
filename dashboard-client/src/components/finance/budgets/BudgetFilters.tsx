import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

type BudgetStatus = "ALL" | "ON_TRACK" | "WARNING" | "EXCEEDED";
type BudgetPeriod = "ALL" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

export interface BudgetFilterState {
  search: string;
  status: BudgetStatus;
  period: BudgetPeriod;
  categoryIds: number[];
  dateFrom: string;
  dateTo: string;
}

interface Category {
  id: number;
  name: string;
}

interface BudgetFiltersProps {
  filters: BudgetFilterState;
  onFilterChange: (filters: BudgetFilterState) => void;
  categories: Category[];
}

export function BudgetFilters({ filters, onFilterChange, categories }: BudgetFiltersProps) {
  const [showExtended, setShowExtended] = useState(false);

  const activeFilterCount = (() => {
    let count = 0;
    if (filters.status !== "ALL") count++;
    if (filters.period !== "ALL") count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  })();

  const resetFilters = () => {
    onFilterChange({
      search: "",
      status: "ALL",
      period: "ALL",
      categoryIds: [],
      dateFrom: "",
      dateTo: ""
    });
    setShowExtended(false);
  };

  const toggleCategory = (categoryId: number) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];

    onFilterChange({ ...filters, categoryIds: newCategoryIds });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un budget..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as BudgetStatus })}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">Tous statuts</option>
          <option value="ON_TRACK">Sur la bonne voie</option>
          <option value="WARNING">Attention</option>
          <option value="EXCEEDED">Dépassé</option>
        </select>

        {/* Period Filter */}
        <select
          value={filters.period}
          onChange={(e) => onFilterChange({ ...filters, period: e.target.value as BudgetPeriod })}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">Toutes périodes</option>
          <option value="WEEKLY">Hebdomadaire</option>
          <option value="MONTHLY">Mensuel</option>
          <option value="QUARTERLY">Trimestriel</option>
          <option value="YEARLY">Annuel</option>
          <option value="CUSTOM">Personnalisé</option>
        </select>

        {/* Extended Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowExtended(!showExtended)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showExtended ? "rotate-180" : ""}`} />
        </button>

        {/* Reset Filters */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Extended Filters Panel */}
      {showExtended && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Category Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune catégorie disponible</p>
              ) : (
                categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.categoryIds.includes(category.id)
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Période active - Du
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Au
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
