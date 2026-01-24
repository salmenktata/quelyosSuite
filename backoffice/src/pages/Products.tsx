import { Layout } from '../components/Layout'

export default function Products() {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-600 mt-2">Gérer le catalogue de produits</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestion des produits
            </h3>
            <p className="text-gray-600 mb-6">
              Cette fonctionnalité sera disponible prochainement. Elle permettra de gérer tout
              votre catalogue de produits et catégories.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-blue-900 mb-2">Fonctionnalités à venir :</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Liste de tous les produits</li>
                <li>• Création et édition de produits</li>
                <li>• Gestion des catégories</li>
                <li>• Upload d'images</li>
                <li>• Gestion des stocks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
