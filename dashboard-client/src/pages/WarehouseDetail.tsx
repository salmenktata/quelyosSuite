import { useParams, useNavigate } from 'react-router-dom';
import { useWarehouseDetail } from '../hooks/useWarehouses';

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const warehouseId = parseInt(id || '0', 10);

  const { data: warehouse, isLoading, error } = useWarehouseDetail(warehouseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur : Entrepôt introuvable</p>
        <button
          onClick={() => navigate('/warehouses')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour aux entrepôts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/warehouses')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-white"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux entrepôts
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{warehouse.name}</h1>
              {warehouse.active ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Inactif
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Code: {warehouse.code}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entreprise</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {warehouse.company_name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre de locations</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{warehouse.location_count}</p>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Locations de stock</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {warehouse.location_count} location(s) dans cet entrepôt
          </p>
        </div>

        <div className="p-6">
          {warehouse.locations && warehouse.locations.length > 0 ? (
            <div className="space-y-3">
              {warehouse.locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{location.complete_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Type: {location.usage}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">ID: {location.id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Aucune location dans cet entrepôt</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Gestion multi-entrepôts</p>
            <p className="mt-1">
              Utilisez la page <strong>Produits</strong> pour voir le stock détaillé par location.
              Vous pouvez également créer des transferts de stock entre entrepôts depuis la page{' '}
              <strong>Mouvements de Stock</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
