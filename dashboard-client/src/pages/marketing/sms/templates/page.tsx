/**
 * Templates SMS Marketing
 *
 * Fonctionnalités :
 * - Liste templates SMS réutilisables avec recherche
 * - Création/édition templates avec aperçu temps réel
 * - Variables dynamiques ({{prenom}}, {{nom}}, {{company}}, {{montant}}, etc.)
 * - Prévisualisation SMS avec compteur caractères (160/306/459)
 * - Gestion catégories templates (Bienvenue, Relance, Promo, Transaction, etc.)
 * - Historique utilisation par template
 * - Import/Export templates en JSON
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { marketingNotices } from '@/lib/notices'
import {
  MessageSquare,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Tag,
  BarChart,
  Download,
  Upload,
} from 'lucide-react'

interface SMSTemplate {
  id: number
  name: string
  category: string
  content: string
  variables: string[]
  used: number
  createdAt: string
}

export default function MarketingSMSTemplates() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPreview, setShowPreview] = useState<number | null>(null)

  // Mock data
  const categories = [
    { id: 'all', name: 'Tous', count: 18 },
    { id: 'welcome', name: 'Bienvenue', count: 4 },
    { id: 'followup', name: 'Relance', count: 5 },
    { id: 'promo', name: 'Promotions', count: 6 },
    { id: 'transaction', name: 'Transactions', count: 3 },
  ]

  const templates: SMSTemplate[] = [
    {
      id: 1,
      name: 'Bienvenue Nouveau Client',
      category: 'welcome',
      content:
        'Bienvenue {{prenom}} ! Merci de rejoindre {{company}}. Profitez de -10% avec le code WELCOME10 sur votre première commande.',
      variables: ['prenom', 'company'],
      used: 342,
      createdAt: '2025-01-15',
    },
    {
      id: 2,
      name: 'Relance Panier Abandonné',
      category: 'followup',
      content:
        'Bonjour {{prenom}}, vous avez oublié {{nb_articles}} article(s) dans votre panier. Finalisez votre commande maintenant : {{lien}}',
      variables: ['prenom', 'nb_articles', 'lien'],
      used: 218,
      createdAt: '2025-01-10',
    },
    {
      id: 3,
      name: 'Flash Sale 24h',
      category: 'promo',
      content:
        '🔥 FLASH SALE ! -{{reduction}}% sur {{produit}} pendant 24h seulement. Code : {{code_promo}}. {{lien}}',
      variables: ['reduction', 'produit', 'code_promo', 'lien'],
      used: 567,
      createdAt: '2025-01-08',
    },
    {
      id: 4,
      name: 'Confirmation Paiement',
      category: 'transaction',
      content:
        'Paiement de {{montant}}€ reçu pour la commande #{{numero_commande}}. Merci {{prenom}} ! Suivi : {{lien_suivi}}',
      variables: ['montant', 'numero_commande', 'prenom', 'lien_suivi'],
      used: 1243,
      createdAt: '2025-01-05',
    },
    {
      id: 5,
      name: 'Relance Lead Inactif',
      category: 'followup',
      content:
        'Bonjour {{prenom}}, cela fait {{jours}} jours. Besoin d\'aide ? Répondez OUI pour être recontacté par notre équipe.',
      variables: ['prenom', 'jours'],
      used: 89,
      createdAt: '2025-01-03',
    },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const countCharacters = (text: string) => {
    // Remplacer variables par placeholder pour estimation
    const withoutVars = text.replace(/{{[^}]+}}/g, 'XXXXX')
    return withoutVars.length
  }

  const getSMSParts = (charCount: number) => {
    if (charCount <= 160) return { parts: 1, max: 160 }
    if (charCount <= 306) return { parts: 2, max: 306 }
    return { parts: 3, max: 459 }
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Marketing', path: '/marketing' },
          { label: 'SMS', path: '/marketing/sms' },
          { label: 'Templates', path: '/marketing/sms/templates' },
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Templates SMS
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <Button
              href="/marketing/sms/templates/new"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Nouveau Template
            </Button>
          </div>
        </div>

        <PageNotice notices={marketingNotices} currentPath="/marketing/sms/templates" />

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categories.slice(1).map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {cat.count}
                  </p>
                </div>
                <Tag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Liste Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucun template trouvé
              </p>
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const charCount = countCharacters(template.content)
              const smsInfo = getSMSParts(charCount)

              return (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {categories.find((c) => c.id === template.category)?.name}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <BarChart className="h-4 w-4" />
                          {template.used} utilisations
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu Template */}
                  <div className="mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {template.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {charCount} caractères • {smsInfo.parts} SMS ({smsInfo.max} max)
                      </span>
                    </div>
                  </div>

                  {/* Variables */}
                  {template.variables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Variables :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-2 py-1 rounded text-xs font-mono bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                          >
                            {'{{' + variable + '}}'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
                      className="flex-1 justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </Button>
                    <Button
                      href={`/marketing/sms/templates/${template.id}/edit`}
                      className="flex-1 justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                      Éditer
                    </Button>
                    <Button
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      className="p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Actions en bas */}
        <div className="flex justify-end gap-3">
          <Button
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4" />
            Exporter JSON
          </Button>
        </div>
      </div>
    </Layout>
  )
}
