import { useState } from 'react'
import { useLotTraceability } from '@/hooks/useStockAdvanced'
import type { TraceabilityMove } from '@/types/stock'

export default function LotTraceability() {
  const [lotId, setLotId] = useState<number>(0)
  const [searchLotId, setSearchLotId] = useState<number>(0)

  const { data, isLoading, error } = useLotTraceability(searchLotId)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchLotId(lotId)
  }

  const renderMoveTable = (moves: TraceabilityMove[], title: string) => {
    if (moves.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">Aucun mouvement {title.toLowerCase()}</div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium">Date</th>
              <th className="px-3 py-2 text-left text-sm font-medium">De</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Vers</th>
              <th className="px-3 py-2 text-right text-sm font-medium">Qté</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Référence</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Partenaire</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {moves.map((move) => (
              <tr key={move.id}>
                <td className="px-3 py-2 text-sm">
                  {move.date ? new Date(move.date).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="px-3 py-2 text-sm">{move.location_src}</td>
                <td className="px-3 py-2 text-sm">{move.location_dest}</td>
                <td className="px-3 py-2 text-sm text-right">
                  {move.quantity} {move.uom}
                </td>
                <td className="px-3 py-2 text-sm">
                  {move.picking_name || move.reference || '-'}
                </td>
                <td className="px-3 py-2 text-sm">{move.partner || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Traçabilité Lot/Série</h1>
        <p className="text-gray-600">
          Visualisez l'historique complet des mouvements d'un lot : amont (origine) et aval
          (destination)
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">ID Lot/Numéro de série</label>
            <input
              type="number"
              value={lotId || ''}
              onChange={(e) => setLotId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Entrez l'ID du lot"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Rechercher
            </button>
          </div>
        </div>
      </form>

      {isLoading && <div className="text-center py-8">Chargement...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error.message}
        </div>
      )}

      {data && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold mb-3">Informations Lot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Numéro</div>
                <div className="font-medium">{data.lot.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Produit</div>
                <div className="font-medium">
                  {data.lot.product_name}
                  {data.lot.product_sku && (
                    <span className="text-gray-500 ml-2 text-sm">({data.lot.product_sku})</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Stock actuel</div>
                <div className="font-medium">{data.lot.stock_qty}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Expiration</div>
                <div className="font-medium">
                  {data.lot.expiration_date
                    ? new Date(data.lot.expiration_date).toLocaleDateString('fr-FR')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Traçabilité Amont</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {data.upstream_count} mouvement{data.upstream_count > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">D'où vient ce lot (réceptions, etc.)</p>
              {renderMoveTable(data.upstream, 'amont')}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Traçabilité Aval</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {data.downstream_count} mouvement{data.downstream_count > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Où va ce lot (livraisons, etc.)</p>
              {renderMoveTable(data.downstream, 'aval')}
            </div>
          </div>
        </>
      )}

      {!data && !isLoading && !error && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded text-center">
          <p className="text-blue-800">
            Entrez l'ID d'un lot pour visualiser sa traçabilité complète
          </p>
        </div>
      )}
    </div>
  )
}
