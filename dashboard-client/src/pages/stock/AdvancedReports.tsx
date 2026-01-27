import { useState } from 'react'
import { useAdvancedStockReports } from '@/hooks/useStockAdvanced'

export default function AdvancedReports() {
  const [daysThreshold, setDaysThreshold] = useState(90)
  const { data, isLoading } = useAdvancedStockReports({ days_threshold: daysThreshold })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Rapports Stock Avancés</h1>
        <p className="text-gray-600">
          Analyse des ruptures, stock mort et anomalies pour optimiser la gestion
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium mb-2">
          Seuil inactivité (jours) pour dead stock
        </label>
        <input
          type="number"
          value={daysThreshold}
          onChange={(e) => setDaysThreshold(Number(e.target.value))}
          className="border rounded px-3 py-2"
          min="30"
          max="365"
        />
      </div>

      {isLoading && <div className="text-center py-8">Chargement...</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Ruptures</div>
              <div className="text-2xl font-bold text-red-600">{data.kpis.stockout_count}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Dead Stock</div>
              <div className="text-2xl font-bold text-orange-600">
                {data.kpis.dead_stock_count}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Anomalies</div>
              <div className="text-2xl font-bold text-yellow-600">{data.kpis.anomaly_count}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Valeur Dead Stock</div>
              <div className="text-2xl font-bold">{data.kpis.total_dead_stock_value.toFixed(2)} €</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-3 text-red-700">
                Ruptures de Stock ({data.stockouts.count})
              </h2>
              {data.stockouts.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium">Produit</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">SKU</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Stock</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Min</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Manquant</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">Entrepôt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.stockouts.items.map((item) => (
                        <tr key={item.product_id}>
                          <td className="px-3 py-2 text-sm">{item.product_name}</td>
                          <td className="px-3 py-2 text-sm">{item.product_sku}</td>
                          <td className="px-3 py-2 text-sm text-right text-red-600">
                            {item.current_stock}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">{item.min_qty}</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold">
                            {item.shortage}
                          </td>
                          <td className="px-3 py-2 text-sm">{item.warehouse}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">Aucune rupture détectée</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-3 text-orange-700">
                Dead Stock ({data.dead_stock.count} - immobilisé &gt; {data.dead_stock.days_threshold}j)
              </h2>
              {data.dead_stock.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium">Produit</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">SKU</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Qté</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Valeur</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Jours inactif</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">Dernier mouv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.dead_stock.items.map((item) => (
                        <tr key={item.product_id}>
                          <td className="px-3 py-2 text-sm">{item.product_name}</td>
                          <td className="px-3 py-2 text-sm">{item.product_sku}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.qty_available}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.value.toFixed(2)} €</td>
                          <td className="px-3 py-2 text-sm text-right text-orange-600">
                            {item.days_inactive}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {item.last_move_date
                              ? new Date(item.last_move_date).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">Aucun dead stock détecté</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-3 text-yellow-700">
                Anomalies Stock ({data.anomalies.count})
              </h2>
              {data.anomalies.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium">Produit</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">SKU</th>
                        <th className="px-3 py-2 text-right text-sm font-medium">Stock</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">Type</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">Sévérité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.anomalies.items.map((item) => (
                        <tr key={item.product_id}>
                          <td className="px-3 py-2 text-sm">{item.product_name}</td>
                          <td className="px-3 py-2 text-sm">{item.product_sku}</td>
                          <td className="px-3 py-2 text-sm text-right text-red-600">
                            {item.qty_available}
                          </td>
                          <td className="px-3 py-2 text-sm">Stock négatif</td>
                          <td className="px-3 py-2 text-sm">
                            <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs">
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">Aucune anomalie détectée</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
