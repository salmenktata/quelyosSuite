/**
 * Page Paramètres Facturation - Personnalisation des factures
 *
 * Fonctionnalités:
 * - Upload logo facture
 * - Sélecteur couleur primaire
 * - Éditeur pied de page factures
 * - Prévisualisation en temps réel
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { Save, FileText, Palette, Image as ImageIcon } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'

type InvoiceSettings = {
  x_invoice_logo_url: string
  x_invoice_primary_color: string
  x_invoice_footer_text: string
}

export default function InvoicingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<InvoiceSettings>({
    x_invoice_logo_url: '',
    x_invoice_primary_color: '#01613a',
    x_invoice_footer_text: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // TODO: Créer endpoint GET /api/tenants/current/settings
      // Pour l'instant, valeurs par défaut
      setSettings({
        x_invoice_logo_url: '',
        x_invoice_primary_color: '#01613a',
        x_invoice_footer_text: 'Merci pour votre confiance.\nPaiement par virement bancaire : IBAN FR76 XXXX XXXX XXXX XXXX XXXX XXX\nSIRET : XXX XXX XXX XXXXX - TVA : FR XX XXX XXX XXX'
      })
    } catch (err) {
      logger.error('Erreur chargement paramètres:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // TODO: Créer endpoint PUT /api/tenants/current/settings
      const response = await apiClient.put<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/tenants/current/settings', settings)

      if (response.data.success) {
        alert('Paramètres sauvegardés avec succès')
      } else {
        alert(`Erreur: ${response.data.error}`)
      }
    } catch (err) {
      logger.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Paramètres', href: '/finance/settings' },
            { label: 'Facturation' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paramètres Facturation
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Personnalisez l&apos;apparence de vos factures
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {/* Logo Facture */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logo Facture
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL du logo
              </label>
              <input
                type="url"
                value={settings.x_invoice_logo_url}
                onChange={(e) =>
                  setSettings({ ...settings, x_invoice_logo_url: e.target.value })
                }
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Si vide, le logo principal du tenant sera utilisé
              </p>
            </div>

            {settings.x_invoice_logo_url && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prévisualisation
                </p>
                <img
                  src={settings.x_invoice_logo_url}
                  alt="Logo facture"
                  className="h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-logo.png'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Couleur Primaire */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Couleur Primaire
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.x_invoice_primary_color}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    x_invoice_primary_color: e.target.value
                  })
                }
                className="w-20 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <div>
                <input
                  type="text"
                  value={settings.x_invoice_primary_color}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      x_invoice_primary_color: e.target.value
                    })
                  }
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#01613a"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Format hexadécimal (#RRGGBB)
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prévisualisation
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-24 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: settings.x_invoice_primary_color }}
                />
                <p
                  className="font-semibold"
                  style={{ color: settings.x_invoice_primary_color }}
                >
                  Titre Facture
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de Page */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pied de Page Factures
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texte personnalisé
              </label>
              <textarea
                value={settings.x_invoice_footer_text}
                onChange={(e) =>
                  setSettings({ ...settings, x_invoice_footer_text: e.target.value })
                }
                rows={6}
                placeholder="Merci pour votre confiance.&#10;Paiement par virement bancaire : IBAN FR76 XXXX XXXX XXXX&#10;SIRET : XXX XXX XXX - TVA : FR XX XXX XXX XXX"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Affiché en bas de chaque facture PDF (mentions légales, coordonnées bancaires, etc.)
              </p>
            </div>

            {settings.x_invoice_footer_text && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-t-2 border-gray-300 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prévisualisation
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {settings.x_invoice_footer_text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
