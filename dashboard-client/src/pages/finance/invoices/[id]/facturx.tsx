/**
 * Factur-X (ZUGFeRD) - Export facture e-invoicing européen
 *
 * Fonctionnalités:
 * - Validation conformité EN 16931 (directive UE 2014/55/UE)
 * - Génération PDF/A-3 avec XML embarqué
 * - Profils : BASIC, COMFORT, EXTENDED
 * - Vérification champs obligatoires
 * - Téléchargement facture hybride (PDF + XML structuré)
 * - Interopérabilité factures électroniques EU
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { Download, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'
import { getBackendUrl } from '@quelyos/config'
import { financeNotices } from '@/lib/notices/finance-notices'

type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  conformityLevel: string
}

export default function FacturXPage() {
  const { id } = useParams<{ id: string }>()

  const [validating, setValidating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<'BASIC' | 'COMFORT' | 'EXTENDED'>('BASIC')

  useEffect(() => {
    if (id) {
      handleValidate()
    }
  }, [id])

  const handleValidate = async () => {
    try {
      setValidating(true)

      const response = await apiClient.post<{
        success: boolean
        data: ValidationResult
        error?: string
      }>(`/finance/invoices/${id}/facturx/validate`)

      if (response.data.success && response.data.data) {
        setValidation(response.data.data)
      } else {
        alert(`Erreur: ${response.data.error}`)
      }
    } catch (err) {
      logger.error('Erreur validation Factur-X:', err)
      alert('Erreur lors de la validation')
    } finally {
      setValidating(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)

      const token = localStorage.getItem('authToken')
      const backendUrl = getBackendUrl(process.env.NODE_ENV as 'development' | 'production')

      const response = await fetch(`${backendUrl}/api/finance/invoices/${id}/facturx?profile=${selectedProfile}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      // Extraire nom fichier
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `facture_${id}_FacturX.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Télécharger
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`Facture Factur-X téléchargée : ${filename}`)
    } catch (err) {
      logger.error('Erreur téléchargement Factur-X:', err)
      alert('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Factures', href: '/invoicing/invoices' },
            { label: `Facture ${id}`, href: `/finance/invoices/${id}` },
            { label: 'Factur-X' },
          ]}
        />

        <PageNotice config={financeNotices.facturx} className="![animation:none]" />

        {/* Header */}
        <div>
          <h1 className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
            Export Factur-X (ZUGFeRD)
          </h1>
          <p className="![animation:none] mt-1 text-sm text-gray-500 dark:text-gray-400">
            Génération facture électronique conforme norme européenne EN 16931
          </p>
        </div>

        {/* Validation Status */}
        {validating ? (
          <div className="![animation:none] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="![animation:none] flex items-center gap-3">
              <Loader className="![animation:none] h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <p className="![animation:none] text-gray-700 dark:text-gray-300">
                Validation conformité EN 16931 en cours...
              </p>
            </div>
          </div>
        ) : validation ? (
          <div className={`rounded-xl border p-6 shadow-sm ${
            validation.valid
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="![animation:none] flex items-start gap-3 mb-4">
              {validation.valid ? (
                <CheckCircle className="![animation:none] h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="![animation:none] h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="![animation:none] flex-1">
                <h2 className={`text-lg font-semibold ${
                  validation.valid
                    ? 'text-green-900 dark:text-green-300'
                    : 'text-red-900 dark:text-red-300'
                }`}>
                  {validation.valid ? 'Facture Conforme EN 16931' : 'Facture Non-Conforme'}
                </h2>
                <p className={`text-sm mt-1 ${
                  validation.valid
                    ? 'text-green-800 dark:text-green-400'
                    : 'text-red-800 dark:text-red-400'
                }`}>
                  Niveau : {validation.conformityLevel.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Erreurs */}
            {validation.errors.length > 0 && (
              <div className="![animation:none] mb-4">
                <h3 className="![animation:none] text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                  Erreurs Bloquantes ({validation.errors.length})
                </h3>
                <ul className="![animation:none] space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="![animation:none] text-sm text-red-800 dark:text-red-400 flex items-start gap-2">
                      <span className="![animation:none] text-red-600 dark:text-red-400">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avertissements */}
            {validation.warnings.length > 0 && (
              <div>
                <h3 className="![animation:none] text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                  Avertissements ({validation.warnings.length})
                </h3>
                <ul className="![animation:none] space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="![animation:none] text-sm text-yellow-800 dark:text-yellow-400 flex items-start gap-2">
                      <span className="![animation:none] text-yellow-600 dark:text-yellow-400">⚠</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Profil Factur-X */}
        <div className="![animation:none] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profil Factur-X
          </h2>

          <div className="![animation:none] space-y-3">
            {[
              { id: 'BASIC', name: 'BASIC', desc: 'Minimum légal - Champs essentiels uniquement (factures simples)' },
              { id: 'COMFORT', name: 'COMFORT', desc: 'Standard - Données étendues pour comptabilité (recommandé)' },
              { id: 'EXTENDED', name: 'EXTENDED', desc: 'Complet - Tous détails (supply chain, logistique)' },
            ].map((profile) => (
              <label
                key={profile.id}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  selectedProfile === profile.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="profile"
                  value={profile.id}
                  checked={selectedProfile === profile.id}
                  onChange={(e) => setSelectedProfile(e.target.value as any)}
                  className="![animation:none] mt-1"
                />
                <div className="![animation:none] flex-1">
                  <p className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                    {profile.name}
                  </p>
                  <p className="![animation:none] text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {profile.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="![animation:none] flex gap-3">
          <Button
            variant="secondary"
            icon={<FileText />}
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? 'Validation...' : 'Re-valider'}
          </Button>
          <Button
            variant="primary"
            icon={downloading ? <Loader className="![animation:none] animate-spin" /> : <Download />}
            onClick={handleDownload}
            disabled={downloading || (validation && !validation.valid)}
            className="![animation:none] flex-1"
          >
            {downloading ? 'Génération en cours...' : 'Télécharger Factur-X (PDF/A-3 + XML)'}
          </Button>
        </div>

        {/* Info */}
        <div className="![animation:none] p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="![animation:none] text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Qu&apos;est-ce que Factur-X ?
          </h3>
          <ul className="![animation:none] text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Format hybride : PDF lisible humain + XML machine-readable embarqué</li>
            <li>• Norme EN 16931 (directive UE 2014/55/UE) obligatoire B2G depuis 2020</li>
            <li>• Interopérable avec ZUGFeRD (Allemagne), FatturaPA (Italie)</li>
            <li>• Archivage légal conforme PDF/A-3 (conservation 10 ans)</li>
            <li>• Automatisation comptabilité récepteur (extraction données XML)</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
