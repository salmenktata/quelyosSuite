/**
 * Page Export FEC Comptable - Fichier des Écritures Comptables
 *
 * Fonctionnalités:
 * - Sélection période fiscale (année/dates custom)
 * - Génération fichier FEC conforme DGFIP
 * - Format: texte pipe-delimited, UTF-8
 * - Téléchargement automatique fichier .txt
 * - Nom fichier: {SIREN}FEC{YYYYMMDD}.txt
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { FileDown, Calendar } from 'lucide-react'
import { logger } from '@quelyos/logger'
import { getBackendUrl } from '@quelyos/config'
import { financeNotices } from '@/lib/notices/finance-notices'

export default function ExportFECPage() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'current_year' | 'last_year' | 'custom'>('current_year')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleExport = async () => {
    try {
      setLoading(true)

      // Déterminer dates selon période sélectionnée
      let from = dateFrom
      let to = dateTo

      const now = new Date()
      const currentYear = now.getFullYear()

      if (period === 'current_year') {
        from = `${currentYear}-01-01`
        to = `${currentYear}-12-31`
      } else if (period === 'last_year') {
        from = `${currentYear - 1}-01-01`
        to = `${currentYear - 1}-12-31`
      }

      if (!from || !to) {
        alert('Veuillez sélectionner une période')
        return
      }

      // Appel API avec fetch natif pour récupérer le fichier
      const token = localStorage.getItem('authToken')
      const backendUrl = getBackendUrl(process.env.NODE_ENV as 'development' | 'production')

      const response = await fetch(`${backendUrl}/api/finance/accounting/export-fec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date_from: from,
          date_to: to,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      // Extraire nom fichier depuis header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'export_fec.txt'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Télécharger fichier
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`Fichier FEC ${filename} téléchargé avec succès`)
    } catch (err) {
      logger.error('Erreur export FEC:', err)
      alert('Erreur lors de l\'export FEC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Paramètres', href: '/finance/settings' },
            { label: 'Export FEC' },
          ]}
        />

        <PageNotice config={financeNotices.exportFec} className="![animation:none]" />

        {/* Header */}
        <div>
          <h1 className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
            Export FEC Comptable
          </h1>
          <p className="![animation:none] mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fichier des Écritures Comptables conforme DGFIP pour audit fiscal
          </p>
        </div>

        {/* Formulaire */}
        <div className="![animation:none] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="![animation:none] flex items-center gap-2 mb-4">
            <Calendar className="![animation:none] h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white">
              Sélection Période
            </h2>
          </div>

          <div className="![animation:none] space-y-4">
            {/* Périodes prédéfinies */}
            <div className="![animation:none] space-y-2">
              <label className="![animation:none] flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value="current_year"
                  checked={period === 'current_year'}
                  onChange={(e) => setPeriod(e.target.value as 'current_year')}
                  className="![animation:none] text-indigo-600"
                />
                <span className="![animation:none] text-gray-700 dark:text-gray-300">
                  Année en cours ({new Date().getFullYear()})
                </span>
              </label>

              <label className="![animation:none] flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value="last_year"
                  checked={period === 'last_year'}
                  onChange={(e) => setPeriod(e.target.value as 'last_year')}
                  className="![animation:none] text-indigo-600"
                />
                <span className="![animation:none] text-gray-700 dark:text-gray-300">
                  Année précédente ({new Date().getFullYear() - 1})
                </span>
              </label>

              <label className="![animation:none] flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value="custom"
                  checked={period === 'custom'}
                  onChange={(e) => setPeriod(e.target.value as 'custom')}
                  className="![animation:none] text-indigo-600"
                />
                <span className="![animation:none] text-gray-700 dark:text-gray-300">Période personnalisée</span>
              </label>
            </div>

            {/* Dates personnalisées */}
            {period === 'custom' && (
              <div className="![animation:none] grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="![animation:none] block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="![animation:none] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Informations FEC */}
            <div className="![animation:none] p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="![animation:none] text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Format FEC
              </h3>
              <ul className="![animation:none] text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Format: Texte délimité par pipes (|)</li>
                <li>• Encodage: UTF-8</li>
                <li>• Nom fichier: {'{SIREN}'}FEC{'{YYYYMMDD}'}.txt</li>
                <li>• Conforme norme DGFIP 2014</li>
                <li>• Inclut toutes les écritures comptables validées de la période</li>
              </ul>
            </div>

            {/* Bouton export */}
            <div className="![animation:none] pt-4">
              <Button
                variant="primary"
                icon={<FileDown />}
                onClick={handleExport}
                disabled={loading || (period === 'custom' && (!dateFrom || !dateTo))}
                className="![animation:none] w-full"
              >
                {loading ? 'Génération en cours...' : 'Générer et Télécharger FEC'}
              </Button>
            </div>
          </div>
        </div>

        {/* Aide */}
        <div className="![animation:none] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="![animation:none] text-sm font-medium text-gray-900 dark:text-white mb-2">
            À quoi sert le FEC ?
          </h3>
          <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
            Le Fichier des Écritures Comptables (FEC) est obligatoire en France pour toute
            entreprise tenant sa comptabilité au moyen de systèmes informatisés. Il doit être
            fourni lors d&apos;un contrôle fiscal et contient l&apos;ensemble des écritures
            comptables de l&apos;exercice. Le format est normalisé par l&apos;administration
            fiscale (article A47 A-1 du Livre des procédures fiscales).
          </p>
        </div>
      </div>
    </Layout>
  )
}
