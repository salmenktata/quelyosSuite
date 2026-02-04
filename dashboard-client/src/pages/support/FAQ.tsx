/**
 * FAQ Support - Gestion questions fréquentes
 *
 * Fonctionnalités :
 * - Liste questions-réponses avec recherche multi-critères
 * - Catégories FAQ (Compte, Facturation, Technique, Produits, etc.)
 * - Création/édition questions-réponses (formulaire inline)
 * - Ordre d'affichage drag & drop (placeholder)
 * - Statistiques consultations par question
 * - Publication/dépublication questions
 * - Export FAQ (CSV, JSON)
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { supportNotices } from '@/lib/notices'
import {
  FileQuestion,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart,
  Tag,
} from 'lucide-react'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
  published: boolean
  views: number
  order: number
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Mock data
  const categories = [
    { id: 'all', name: 'Toutes', count: 24 },
    { id: 'account', name: 'Compte & Connexion', count: 8 },
    { id: 'billing', name: 'Facturation', count: 6 },
    { id: 'technical', name: 'Technique', count: 5 },
    { id: 'products', name: 'Produits', count: 3 },
    { id: 'other', name: 'Autre', count: 2 },
  ]

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'Comment réinitialiser mon mot de passe ?',
      answer:
        'Pour réinitialiser votre mot de passe, cliquez sur "Mot de passe oublié" sur la page de connexion. Vous recevrez un email avec un lien pour créer un nouveau mot de passe.',
      category: 'account',
      published: true,
      views: 342,
      order: 1,
    },
    {
      id: 2,
      question: 'Comment modifier mes informations de facturation ?',
      answer:
        'Rendez-vous dans Paramètres > Facturation. Vous pourrez modifier vos informations de paiement, adresse de facturation et télécharger vos factures.',
      category: 'billing',
      published: true,
      views: 218,
      order: 2,
    },
    {
      id: 3,
      question: 'Quels sont les modes de paiement acceptés ?',
      answer:
        'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex), virements SEPA et prélèvements automatiques pour les abonnements.',
      category: 'billing',
      published: true,
      views: 156,
      order: 3,
    },
    {
      id: 4,
      question: 'Comment contacter le support technique ?',
      answer:
        'Vous pouvez créer un ticket depuis le menu Support ou nous envoyer un email à support@quelyos.com. Notre équipe vous répond sous 24h.',
      category: 'technical',
      published: true,
      views: 89,
      order: 4,
    },
    {
      id: 5,
      question: 'Comment activer l\'authentification à deux facteurs (2FA) ?',
      answer:
        'Allez dans Paramètres > Sécurité & 2FA. Scannez le QR code avec votre application d\'authentification (Google Authenticator, Authy, etc.).',
      category: 'account',
      published: false,
      views: 12,
      order: 5,
    },
  ]

  const filteredFAQ = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Support', path: '/support' },
          { label: 'FAQ', path: '/support/faq' },
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion FAQ
            </h1>
          </div>
          <Button
            href="/support/faq/new"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Question
          </Button>
        </div>

        <PageNotice notices={supportNotices} currentPath="/support/faq" />

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
                <Tag className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Liste FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFAQ.length === 0 ? (
              <div className="p-8 text-center">
                <FileQuestion className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Aucune question trouvée
                </p>
              </div>
            ) : (
              filteredFAQ.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-2 text-left w-full group"
                      >
                        {expandedId === item.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {item.question}
                        </h3>
                      </button>

                      {expandedId === item.id && (
                        <div className="mt-3 ml-7">
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {item.answer}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {item.views} vues
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart className="h-4 w-4" />
                              Position {item.order}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              {categories.find((c) => c.id === item.category)?.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {item.published ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                          Publié
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          Brouillon
                        </span>
                      )}
                      <Button
                        href={`/support/faq/${item.id}/edit`}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <button
                        type="button"
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions en bas */}
        <div className="flex justify-end gap-3">
          <Button
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Exporter CSV
          </Button>
          <Button
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Exporter JSON
          </Button>
        </div>
      </div>
    </Layout>
  )
}
