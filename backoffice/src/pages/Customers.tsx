import { Layout } from '../components/Layout'

export default function Customers() {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Gérer les comptes clients</p>
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestion des clients
            </h3>
            <p className="text-gray-600 mb-6">
              Cette fonctionnalité sera disponible prochainement. Elle permettra de visualiser et
              gérer tous les comptes clients de votre boutique.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-blue-900 mb-2">Fonctionnalités à venir :</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Liste de tous les clients</li>
                <li>• Détails et historique des commandes</li>
                <li>• Gestion des adresses de livraison</li>
                <li>• Statistiques par client</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
