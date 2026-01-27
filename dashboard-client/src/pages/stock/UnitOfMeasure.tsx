import { useState } from 'react'
import {
  useUnitOfMeasures,
  useUomCategories,
  useUomConversion,
} from '@/hooks/useStockAdvanced'
import type { UomConvertParams } from '@/types/stock'

export default function UnitOfMeasure() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [conversionParams, setConversionParams] = useState<UomConvertParams>({
    qty: 1,
    from_uom_id: 0,
    to_uom_id: 0,
  })

  const { data: categoriesData } = useUomCategories()
  const { data: uomsData } = useUnitOfMeasures({ category_id: selectedCategory })
  const convertMutation = useUomConversion()

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault()
    if (conversionParams.from_uom_id && conversionParams.to_uom_id) {
      convertMutation.mutate(conversionParams)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Unités de Mesure (UoM)</h1>
        <p className="text-gray-600">
          Gestion des unités de mesure et conversions entre UoM compatibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Catégories UoM</h2>
          <div className="space-y-2">
            {categoriesData?.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)
                }
                className={`w-full text-left p-3 rounded border ${
                  selectedCategory === cat.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{cat.name}</div>
                <div className="text-sm text-gray-500">{cat.uom_count} unités</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-4">
            {selectedCategory ? 'Unités de la catégorie' : 'Toutes les unités'}
          </h2>
          {uomsData && uomsData.uoms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium">Nom</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Type</th>
                    <th className="px-3 py-2 text-right text-sm font-medium">Facteur</th>
                    <th className="px-3 py-2 text-right text-sm font-medium">Arrondi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {uomsData.uoms.map((uom) => (
                    <tr key={uom.id}>
                      <td className="px-3 py-2 text-sm">{uom.name}</td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            uom.uom_type === 'reference'
                              ? 'bg-blue-100 text-blue-800'
                              : uom.uom_type === 'bigger'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {uom.uom_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-right">{uom.factor.toFixed(4)}</td>
                      <td className="px-3 py-2 text-sm text-right">{uom.rounding}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {selectedCategory
                ? 'Aucune unité dans cette catégorie'
                : 'Sélectionnez une catégorie'}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Convertisseur UoM</h2>
        <form onSubmit={handleConvert} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input
                type="number"
                step="0.0001"
                value={conversionParams.qty}
                onChange={(e) =>
                  setConversionParams({ ...conversionParams, qty: Number(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">De (UoM ID)</label>
              <input
                type="number"
                value={conversionParams.from_uom_id || ''}
                onChange={(e) =>
                  setConversionParams({ ...conversionParams, from_uom_id: Number(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vers (UoM ID)</label>
              <input
                type="number"
                value={conversionParams.to_uom_id || ''}
                onChange={(e) =>
                  setConversionParams({ ...conversionParams, to_uom_id: Number(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending ? 'Conversion...' : 'Convertir'}
          </button>
        </form>

        {convertMutation.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {convertMutation.error.message}
          </div>
        )}

        {convertMutation.isSuccess && convertMutation.data && (
          <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded">
            <div className="font-semibold mb-2">Résultat :</div>
            <div className="text-lg">{convertMutation.data.formula}</div>
            <div className="text-sm text-gray-600 mt-2">
              {convertMutation.data.original_qty} {convertMutation.data.from_uom.name} ={' '}
              {convertMutation.data.converted_qty} {convertMutation.data.to_uom.name}
            </div>
          </div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded">
          <div className="text-sm text-blue-800">
            <strong>Astuce :</strong> Sélectionnez une catégorie ci-dessus pour voir les IDs des
            UoM compatibles. Seules les UoM de la même catégorie peuvent être converties entre
            elles.
          </div>
        </div>
      </div>
    </div>
  )
}
