import { Layout } from '@/components/common'
import { Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ApiGuide() {
  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Guide : Obtenir vos clés API Images
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Débloquez la recherche illimitée d'images pour vos Hero Slides en 2 minutes
          </p>
        </div>

        {/* Quick link to config */}
        <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                Vous avez déjà vos clés API ?
              </p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Configurez-les directement dans les paramètres du site
              </p>
            </div>
            <Link
              to="/site-config"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Configurer maintenant
            </Link>
          </div>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* Option 1: Unsplash */}
          <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Option 1 : Unsplash (Recommandé)
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  50 requêtes/heure gratuit
                  <span className="mx-2">•</span>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Upgrade gratuit à 5000 req/h
                </div>
              </div>
              <a
                href="https://unsplash.com/oauth/applications/new"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition flex items-center gap-2 shrink-0"
              >
                Créer une application
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Étapes (30 secondes)
                </h3>
                <ol className="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
                  <li>
                    Aller sur{' '}
                    <a
                      href="https://unsplash.com/oauth/applications/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      unsplash.com/oauth/applications/new
                    </a>
                  </li>
                  <li>Se connecter ou créer un compte gratuit</li>
                  <li>
                    Remplir le formulaire :
                    <ul className="ml-6 mt-2 space-y-1 list-disc text-sm">
                      <li><strong>Application name :</strong> Quelyos Backoffice</li>
                      <li><strong>Description :</strong> Image search for hero slides</li>
                      <li>Cocher "I accept the terms"</li>
                    </ul>
                  </li>
                  <li>Cliquer "Create Application"</li>
                  <li>
                    Copier la clé <strong className="text-indigo-600 dark:text-indigo-400">Access Key</strong>{' '}
                    (commence par xxx...)
                  </li>
                </ol>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Exemple de clé Access Key :
                </p>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  abc123xyz789def456ghi789jkl012mno345pqr678stu901vwx234yz
                </code>
              </div>
            </div>
          </section>

          {/* Option 2: Pexels */}
          <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Option 2 : Pexels (Alternative)
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  200 requêtes/heure gratuit
                </div>
              </div>
              <a
                href="https://www.pexels.com/api/new/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition flex items-center gap-2 shrink-0"
              >
                Créer une clé API
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Étapes (30 secondes)
                </h3>
                <ol className="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
                  <li>
                    Aller sur{' '}
                    <a
                      href="https://www.pexels.com/api/new/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      pexels.com/api/new/
                    </a>
                  </li>
                  <li>Se connecter ou créer un compte gratuit</li>
                  <li>
                    Remplir le formulaire :
                    <ul className="ml-6 mt-2 space-y-1 list-disc text-sm">
                      <li><strong>First Name / Last Name :</strong> Votre nom</li>
                      <li><strong>Email :</strong> (pré-rempli)</li>
                      <li><strong>Use case :</strong> Website/App</li>
                      <li><strong>Description :</strong> E-commerce hero slide images</li>
                    </ul>
                  </li>
                  <li>Cliquer "Generate API Key"</li>
                  <li>Copier la clé API affichée</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Exemple de clé API Key :
                </p>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  abc123xyz789def456ghi789jkl012mno345pqr678stu901vwx234yz567
                </code>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Configuration dans le backoffice
            </h2>

            <div className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
                <li>
                  Aller dans{' '}
                  <Link
                    to="/site-config"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Configuration du site
                  </Link>
                </li>
                <li>Descendre jusqu'à la section "Clés API Images"</li>
                <li>Coller votre clé Unsplash et/ou Pexels dans les champs</li>
                <li>Cliquer sur "Sauvegarder les clés"</li>
                <li>
                  Recharger la page{' '}
                  <Link to="/hero-slides" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Hero Slides
                  </Link>{' '}
                  pour tester la recherche
                </li>
              </ol>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Bon à savoir
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Les clés sont stockées de manière sécurisée dans Odoo</li>
                  <li>Vous pouvez configurer une seule API ou les deux</li>
                  <li>Sans clé, 4 images de démonstration restent disponibles</li>
                  <li>Vous pouvez toujours coller une URL d'image manuellement</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              Dépannage
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Erreur "Clé invalide ou expirée"
                </h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Vérifiez que la clé est bien copiée (pas d'espace avant/après)</li>
                  <li>Unsplash : Ne copiez que l'Access Key (pas de "Client-ID" devant)</li>
                  <li>Régénérez une nouvelle clé si nécessaire</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Erreur "Limite atteinte"
                </h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Unsplash : 50 requêtes/heure → Attendez 1h ou utilisez Pexels</li>
                  <li>Pexels : 200 requêtes/heure → Attendez 1h ou utilisez Unsplash</li>
                  <li>Solution : Configurez les 2 APIs pour avoir plus de requêtes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  La recherche ne fonctionne toujours pas
                </h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Rechargez complètement la page Hero Slides (Ctrl+R ou Cmd+R)</li>
                  <li>Vérifiez votre connexion internet</li>
                  <li>Utilisez les images de démonstration en attendant</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Back to config */}
          <div className="flex justify-center pt-4">
            <Link
              to="/site-config"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Key className="w-5 h-5" />
              Aller à la configuration
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
