import { useState } from 'react'
import { useStockForecast } from '@/hooks/useStockAdvanced'
import type { StockForecastParams } from '@/types/stock'

export default function StockForecast() {
  const [productId, setProductId] = useState<number>(0)
  const [params, setParams] = useState<StockForecastParams>({
    product_id: 0,
    forecast_days: 30,
    method: 'moving_average',
    period_days: 90,
  })

  const { data, isLoading, error } = useStockForecast(params)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParams({ ...params, product_id: productId })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Prévisions de Stock</h1>
        <p className="text-gray-600">
          Analyse prédictive des besoins stock basée sur l'historique des ventes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID Produit *</label>
            <input
              type="number"
              value={productId || ''}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jours de prévision</label>
            <input
              type="number"
              value={params.forecast_days}
              onChange={(e) => setParams({ ...params, forecast_days: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              min="7"
              max="180"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Méthode</label>
            <select
              value={params.method}
              onChange={(e) =>
                setParams({ ...params, method: e.target.value as 'moving_average' | 'linear_trend' })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="moving_average">Moyenne mobile</option>
              <option value="linear_trend">Tendance linéaire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Période historique (jours)</label>
            <input
              type="number"
              value={params.period_days}
              onChange={(e) => setParams({ ...params, period_days: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              min="30"
              max="365"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Générer les prévisions
        </button>
      </form>

      {isLoading && <div className="text-center py-8">Chargement...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error.message}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Stock actuel</div>
              <div className="text-2xl font-bold">{data.metrics.current_stock}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Prévision totale</div>
              <div className="text-2xl font-bold">{data.metrics.total_forecast.toFixed(1)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Moyenne quotidienne</div>
              <div className="text-2xl font-bold">{data.metrics.avg_daily_forecast.toFixed(1)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Jours de stock restants</div>
              <div className="text-2xl font-bold">{data.metrics.days_of_stock.toFixed(0)}</div>
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="font-semibold mb-3">Recommandations</h2>
              <div className="space-y-2">
                {data.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded ${
                      rec.type === 'warning'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : rec.type === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    {rec.message}
                    {rec.qty_to_order && (
                      <span className="font-semibold ml-2">
                        (Qté à commander : {rec.qty_to_order})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Prévisions détaillées ({data.forecast_days} jours)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Qté prévue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.forecast.map((day, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">{day.date}</td>
                      <td className="px-4 py-2 text-sm text-right">{day.qty_forecast.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
