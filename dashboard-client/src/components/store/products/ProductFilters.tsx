import { Tag, ChevronDown } from 'lucide-react'
import {
  Button,
  Badge,
  SearchAutocomplete,
  AttributeFilter,
  BackendImage,
  type SearchSuggestion,
  type Attribute,
} from '@/components/common'
import { Image as ImageIcon } from 'lucide-react'
import type { Product, Category } from '@/types'

interface ProductFiltersProps {
  searchInput: string
  setSearchInput: (value: string) => void
  handleSearch: (query: string) => void
  handleSelectSuggestion: (item: SearchSuggestion<Product>) => void
  fetchProductSuggestions: (query: string) => Promise<SearchSuggestion<Product>[]>
  categoryFilter: number | undefined
  setCategoryFilter: (value: number | undefined) => void
  categories: Category[]
  stockStatusFilter: 'in_stock' | 'low_stock' | 'out_of_stock' | undefined
  setStockStatusFilter: (value: 'in_stock' | 'low_stock' | 'out_of_stock' | undefined) => void
  priceMin: string
  setPriceMin: (value: string) => void
  priceMax: string
  setPriceMax: (value: string) => void
  includeArchived: boolean
  setIncludeArchived: (value: boolean) => void
  showAttributeFilters: boolean
  setShowAttributeFilters: (value: boolean) => void
  attributes: Attribute[]
  attributesLoading: boolean
  selectedAttributeValues: number[]
  setSelectedAttributeValues: (values: number[]) => void
  searchQuery: string
  setPage: (page: number) => void
  resetFilters: () => void
}

export function ProductFilters({
  searchInput,
  setSearchInput,
  handleSearch,
  handleSelectSuggestion,
  fetchProductSuggestions,
  categoryFilter,
  setCategoryFilter,
  categories,
  stockStatusFilter,
  setStockStatusFilter,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  includeArchived,
  setIncludeArchived,
  showAttributeFilters,
  setShowAttributeFilters,
  attributes,
  attributesLoading,
  selectedAttributeValues,
  setSelectedAttributeValues,
  searchQuery,
  setPage,
  resetFilters,
}: ProductFiltersProps) {
  const hasActiveFilters = categoryFilter || stockStatusFilter || searchQuery || priceMin || priceMax || selectedAttributeValues.length > 0

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche avec autocomplétion */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Rechercher
          </label>
          <SearchAutocomplete<Product>
            placeholder="Nom, SKU ou description..."
            value={searchInput}
            onChange={setSearchInput}
            onSearch={handleSearch}
            onSelect={handleSelectSuggestion}
            fetchSuggestions={fetchProductSuggestions}
            renderSuggestion={(item, isHighlighted) => (
              <div
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                  isHighlighted
                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  {item.data.image ? (
                    <BackendImage
                      src={item.data.image}
                      alt={item.data.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isHighlighted ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'
                  }`}>
                    {item.data.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.data.default_code && <span className="mr-2">{item.data.default_code}</span>}
                    <span className="font-medium">{item.data.price?.toFixed(2)} €</span>
                  </p>
                </div>
              </div>
            )}
          />
        </div>

        {/* Filtre catégorie */}
        <div>
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
          >
            Catégorie
          </label>
          <select
            id="category-filter"
            value={categoryFilter || ''}
            onChange={(e) => {
              setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)
              setPage(0)
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
          >
            <option value="">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre statut stock */}
        <div>
          <label
            htmlFor="stock-filter"
            className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
          >
            Statut stock
          </label>
          <select
            id="stock-filter"
            value={stockStatusFilter || ''}
            onChange={(e) => {
              setStockStatusFilter(
                e.target.value as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined || undefined
              )
              setPage(0)
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
          >
            <option value="">Tous</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock faible</option>
            <option value="out_of_stock">Rupture</option>
          </select>
        </div>
      </div>

      {/* Filtres de prix */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="price-min"
            className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
          >
            Prix minimum (€)
          </label>
          <input
            id="price-min"
            type="number"
            step="0.01"
            min="0"
            value={priceMin}
            onChange={(e) => {
              setPriceMin(e.target.value)
              setPage(0)
            }}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="price-max"
            className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
          >
            Prix maximum (€)
          </label>
          <input
            id="price-max"
            type="number"
            step="0.01"
            min="0"
            value={priceMax}
            onChange={(e) => {
              setPriceMax(e.target.value)
              setPage(0)
            }}
            placeholder="1000.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Options supplémentaires */}
      <div className="mt-4 flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => {
              setIncludeArchived(e.target.checked)
              setPage(0)
            }}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
            Inclure les produits archivés
          </span>
        </label>

        {attributes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAttributeFilters(!showAttributeFilters)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${showAttributeFilters
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            <Tag className="w-4 h-4" />
            Filtrer par attributs
            {selectedAttributeValues.length > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {selectedAttributeValues.length}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showAttributeFilters ? 'rotate-180' : ''}`}
            />
          </Button>
        )}
      </div>

      {/* Panneau des filtres d'attributs */}
      {showAttributeFilters && attributes.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Filtrer par attributs
            </h3>
            {selectedAttributeValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAttributeValues([])
                  setPage(0)
                }}
                className="!p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Effacer tout ({selectedAttributeValues.length})
              </Button>
            )}
          </div>
          <AttributeFilter
            attributes={attributes}
            selectedValues={selectedAttributeValues}
            onChange={(values) => {
              setSelectedAttributeValues(values)
              setPage(0)
            }}
            loading={attributesLoading}
          />
        </div>
      )}

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Filtres actifs :</span>
          {searchQuery && (
            <Badge variant="info">Recherche: &quot;{searchQuery}&quot;</Badge>
          )}
          {categoryFilter && (
            <Badge variant="info">
              Catégorie: {categories.find((c: Category) => c.id === categoryFilter)?.name}
            </Badge>
          )}
          {stockStatusFilter && (
            <Badge variant="info">
              Stock: {stockStatusFilter === 'in_stock' ? 'En stock' : stockStatusFilter === 'low_stock' ? 'Faible' : 'Rupture'}
            </Badge>
          )}
          {priceMin && (
            <Badge variant="info">Prix min: {priceMin} €</Badge>
          )}
          {priceMax && (
            <Badge variant="info">Prix max: {priceMax} €</Badge>
          )}
          {selectedAttributeValues.length > 0 && (
            <Badge variant="info">
              {selectedAttributeValues.length} attribut{selectedAttributeValues.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  )
}
