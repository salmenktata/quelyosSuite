import { useState } from "react";
import { GlassPanel, GlassButton } from "@/components/ui/glass";
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
    <GlassPanel>
      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
          <input
            type="text"
            placeholder="Rechercher un budget..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as BudgetStatus })}
          className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
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
          className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
        >
          <option value="ALL">Toutes périodes</option>
          <option value="WEEKLY">Hebdomadaire</option>
          <option value="MONTHLY">Mensuel</option>
          <option value="QUARTERLY">Trimestriel</option>
          <option value="QUARTERLY">Annuel</option>
          <option value="CUSTOM">Personnalisé</option>
        </select>

        {/* Extended Filters Toggle */}
        <GlassButton
          variant="subtle"
          onClick={() => setShowExtended(!showExtended)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showExtended ? "rotate-180" : ""}`} />
        </GlassButton>

        {/* Reset Filters */}
        {activeFilterCount > 0 && (
          <GlassButton
            variant="ghost"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </GlassButton>
        )}
      </div>

      {/* Extended Filters Panel */}
      {showExtended && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {/* Category Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-indigo-100 mb-2">
              Catégories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-sm text-indigo-100/60">Aucune catégorie disponible</p>
              ) : (
                categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.categoryIds.includes(category.id)
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
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
              <label className="block text-sm font-medium text-indigo-100 mb-2">
                Période active - Du
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-2">
                Au
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
