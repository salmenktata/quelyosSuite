/**
 * Page Informations Légales — Super Admin
 *
 * Formulaire de gestion des mentions légales :
 * - Société (raison sociale, forme juridique, capital, SIRET, etc.)
 * - Contact (emails)
 * - Hébergement
 * - Juridiction
 * - Médiateur
 */

import { useState, useEffect, useCallback } from 'react'
import { Save, Building2, Mail, Server, Scale, Users, Loader2 } from 'lucide-react'
import { gateway } from '@/lib/api/gateway'
import { useToast } from '@/contexts/ToastContext'

interface LegalData {
  company_name: string
  legal_form: string
  capital: string
  siret: string
  siren: string
  rcs: string
  tva_intra: string
  address: string
  director: string
  director_title: string
  email: string
  email_legal: string
  email_dpo: string
  email_support: string
  hosting_provider: string
  hosting_address: string
  hosting_country: string
  jurisdiction_courts: string
  mediator_name: string
  mediator_website: string
}

const EMPTY_DATA: LegalData = {
  company_name: '',
  legal_form: '',
  capital: '',
  siret: '',
  siren: '',
  rcs: '',
  tva_intra: '',
  address: '',
  director: '',
  director_title: '',
  email: '',
  email_legal: '',
  email_dpo: '',
  email_support: '',
  hosting_provider: '',
  hosting_address: '',
  hosting_country: '',
  jurisdiction_courts: '',
  mediator_name: '',
  mediator_website: '',
}

interface ApiResponse {
  success: boolean
  data?: LegalData
  error?: string
  message?: string
}

export function LegalSettings() {
  const [data, setData] = useState<LegalData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await gateway.get<ApiResponse>('/api/super-admin/settings/legal')
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChange = (field: keyof LegalData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await gateway.post<ApiResponse>('/api/super-admin/settings/legal', data)
    if (res.success) {
      toast.success('Paramètres légaux sauvegardés')
    } else {
      toast.error(res.error || 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentions légales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Informations légales affichées sur les sites vitrines
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {/* Société */}
      <Section icon={Building2} title="Société" color="indigo">
        <Field label="Raison sociale" value={data.company_name} onChange={v => handleChange('company_name', v)} />
        <Field label="Forme juridique" value={data.legal_form} onChange={v => handleChange('legal_form', v)} placeholder="ex: SAS, SARL..." />
        <Field label="Capital social" value={data.capital} onChange={v => handleChange('capital', v)} placeholder="ex: 10 000 €" />
        <Field label="SIRET" value={data.siret} onChange={v => handleChange('siret', v)} />
        <Field label="SIREN" value={data.siren} onChange={v => handleChange('siren', v)} />
        <Field label="RCS" value={data.rcs} onChange={v => handleChange('rcs', v)} placeholder="ex: RCS Paris B 123 456 789" />
        <Field label="N° TVA intracommunautaire" value={data.tva_intra} onChange={v => handleChange('tva_intra', v)} placeholder="ex: FR XX XXXXXXXXX" />
        <Field label="Adresse du siège" value={data.address} onChange={v => handleChange('address', v)} />
        <Field label="Dirigeant" value={data.director} onChange={v => handleChange('director', v)} />
        <Field label="Titre du dirigeant" value={data.director_title} onChange={v => handleChange('director_title', v)} placeholder="ex: Président" />
      </Section>

      {/* Contact */}
      <Section icon={Mail} title="Contact" color="violet">
        <Field label="Email général" value={data.email} onChange={v => handleChange('email', v)} type="email" />
        <Field label="Email juridique" value={data.email_legal} onChange={v => handleChange('email_legal', v)} type="email" />
        <Field label="Email DPO" value={data.email_dpo} onChange={v => handleChange('email_dpo', v)} type="email" />
        <Field label="Email support" value={data.email_support} onChange={v => handleChange('email_support', v)} type="email" />
      </Section>

      {/* Hébergement */}
      <Section icon={Server} title="Hébergement" color="emerald">
        <Field label="Hébergeur" value={data.hosting_provider} onChange={v => handleChange('hosting_provider', v)} />
        <Field label={`Adresse de l'hébergeur`} value={data.hosting_address} onChange={v => handleChange('hosting_address', v)} />
        <Field label={`Pays de l'hébergeur`} value={data.hosting_country} onChange={v => handleChange('hosting_country', v)} />
      </Section>

      {/* Juridiction */}
      <Section icon={Scale} title="Juridiction" color="amber">
        <Field label="Tribunaux compétents" value={data.jurisdiction_courts} onChange={v => handleChange('jurisdiction_courts', v)} placeholder="ex: Tribunaux compétents de Paris" />
      </Section>

      {/* Médiateur */}
      <Section icon={Users} title="Médiateur" color="cyan">
        <Field label="Nom du médiateur" value={data.mediator_name} onChange={v => handleChange('mediator_name', v)} />
        <Field label="Site web du médiateur" value={data.mediator_website} onChange={v => handleChange('mediator_website', v)} type="url" />
      </Section>
    </div>
  )
}

export default LegalSettings

// --- Sous-composants ---

function Section({ icon: Icon, title, color, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  color: string
  children: React.ReactNode
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    violet: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    cyan: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
      />
    </div>
  )
}
