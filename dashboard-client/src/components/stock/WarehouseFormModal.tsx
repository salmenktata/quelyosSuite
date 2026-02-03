import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Check, ChevronRight, Building, MapPin, FileText } from 'lucide-react'
import { useCreateWarehouse, type CreateWarehouseData } from '@/hooks/useWarehouses'
import { logger } from '@quelyos/logger'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const step1Schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  code: z.string()
    .min(1, 'Code requis')
    .max(5, 'Code trop long (max 5 caractères)')
    .regex(/^[A-Z0-9-]+$/, 'Code invalide : lettres majuscules, chiffres et tirets uniquement')
    .transform(val => val.toUpperCase()),
  company_id: z.number().min(1, 'Société requise'),
})

const step2Schema = z.object({
  use_existing_partner: z.boolean(),
  partner_id: z.number().optional(),
  partner_name: z.string().optional(),
  partner_street: z.string().optional(),
  partner_city: z.string().optional(),
  partner_zip: z.string().optional(),
  partner_country_id: z.number().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface WarehouseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (warehouseId: number) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT
// ═══════════════════════════════════════════════════════════════════════════

export function WarehouseFormModal({ isOpen, onClose, onSuccess }: WarehouseFormModalProps) {
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  const { mutate: createWarehouse, isPending } = useCreateWarehouse()

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      code: '',
      company_id: 1, // TODO: Récupérer depuis contexte ou API
    }
  })

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      use_existing_partner: false,
      partner_id: undefined,
      partner_name: '',
      partner_street: '',
      partner_city: '',
      partner_zip: '',
      partner_country_id: undefined,
    }
  })

  // Auto-générer le code depuis le nom
  const handleNameChange = (name: string) => {
    form1.setValue('name', name)
    // Générer code automatiquement (ex: "Entrepôt Paris" -> "PARIS")
    const words = name.trim().split(' ')
    const lastWord = words[words.length - 1] ?? ''
    const autoCode = lastWord.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 5)
    if (autoCode && !form1.getValues('code')) {
      form1.setValue('code', autoCode)
    }
  }

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setStep(2)
  }

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data)
    setStep(3)
  }

  const handleFinalSubmit = () => {
    if (!step1Data) return

    const createData: CreateWarehouseData = {
      name: step1Data.name,
      code: step1Data.code,
      company_id: step1Data.company_id,
    }

    // Ajouter les données du partner si présentes
    if (step2Data) {
      if (step2Data.use_existing_partner && step2Data.partner_id) {
        createData.partner_id = step2Data.partner_id
      } else if (!step2Data.use_existing_partner && step2Data.partner_name) {
        createData.partner_data = {
          name: step2Data.partner_name,
          street: step2Data.partner_street,
          city: step2Data.partner_city,
          zip: step2Data.partner_zip,
          country_id: step2Data.partner_country_id,
        }
      }
    }

    createWarehouse(createData, {
      onSuccess: (data) => {
        logger.info('[WarehouseFormModal] Warehouse created:', data)
        onClose()
        const result = data as { id?: number } | undefined
        if (onSuccess && result?.id) {
          onSuccess(result.id)
        }
      },
      onError: (error: Error) => {
        logger.error('[WarehouseFormModal] Error:', error)
        // TODO: Afficher toast d'erreur
        alert(error.message)
      }
    })
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const _handleReset = () => {
    setStep(1)
    setStep1Data(null)
    setStep2Data(null)
    form1.reset()
    form2.reset()
  }

  if (!isOpen) return null

  // Extraire la valeur watch() pour éviter warning React Compiler
  const useExistingPartner = form2.watch('use_existing_partner')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Créer un Entrepôt
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= i ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step > i ? <Check className="h-4 w-4" /> : i}
                  </div>
                  {i < 3 && (
                    <ChevronRight className={`mx-2 h-4 w-4 ${
                      step > i ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-sm text-gray-600">
              {step === 1 && 'Informations de base'}
              {step === 2 && 'Adresse (optionnel)'}
              {step === 3 && 'Confirmation'}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Étape 1: Informations de base */}
            {step === 1 && (
              <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    <Building className="inline mr-2 h-4 w-4" />
                    Nom de l'entrepôt *
                  </label>
                  <input
                    type="text"
                    {...form1.register('name')}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Entrepôt Paris"
                  />
                  {form1.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{form1.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Code entrepôt * (max 5 caractères)
                  </label>
                  <input
                    type="text"
                    {...form1.register('code')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm uppercase"
                    placeholder="PARIS"
                    maxLength={5}
                  />
                  {form1.formState.errors.code && (
                    <p className="mt-1 text-sm text-red-600">{form1.formState.errors.code.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Lettres majuscules, chiffres et tirets uniquement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Société *
                  </label>
                  <select
                    {...form1.register('company_id', { valueAsNumber: true })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value={1}>Ma Société</option>
                    {/* TODO: Charger depuis API */}
                  </select>
                  {form1.formState.errors.company_id && (
                    <p className="mt-1 text-sm text-red-600">{form1.formState.errors.company_id.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Suivant
                  </button>
                </div>
              </form>
            )}

            {/* Étape 2: Adresse */}
            {step === 2 && (
              <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form2.register('use_existing_partner')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Utiliser une adresse existante
                    </span>
                  </label>
                </div>

                {useExistingPartner ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Sélectionner un contact
                    </label>
                    <select
                      {...form2.register('partner_id', { valueAsNumber: true })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">-- Sélectionner --</option>
                      {/* TODO: Charger depuis API */}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        <MapPin className="inline mr-2 h-4 w-4" />
                        Nom du contact
                      </label>
                      <input
                        type="text"
                        {...form2.register('partner_name')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Entrepôt Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Rue
                      </label>
                      <input
                        type="text"
                        {...form2.register('partner_street')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          {...form2.register('partner_city')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Code postal
                        </label>
                        <input
                          type="text"
                          {...form2.register('partner_zip')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <p className="text-xs text-gray-500">
                  Cette étape est optionnelle. Vous pouvez passer si vous n'avez pas d'adresse à associer.
                </p>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-200 text-gray-900 dark:text-white rounded-md hover:bg-gray-300"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Suivant
                  </button>
                </div>
              </form>
            )}

            {/* Étape 3: Confirmation */}
            {step === 3 && step1Data && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <FileText className="inline mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Récapitulatif</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom :</label>
                    <p className="text-gray-900 dark:text-white">{step1Data.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Code :</label>
                    <p className="text-gray-900 dark:text-white font-mono">{step1Data.code}</p>
                  </div>
                  {step2Data?.partner_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Adresse :</label>
                      <p className="text-gray-900 dark:text-white">
                        {step2Data.partner_name}
                        {step2Data.partner_street && <>, {step2Data.partner_street}</>}
                        {step2Data.partner_city && <>, {step2Data.partner_city}</>}
                        {step2Data.partner_zip && <> {step2Data.partner_zip}</>}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p>Les emplacements suivants seront créés automatiquement :</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>{step1Data.code}/Stock (stock principal)</li>
                    <li>{step1Data.code}/Input (réceptions)</li>
                    <li>{step1Data.code}/Output (expéditions)</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-200 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? 'Création...' : 'Créer l\'entrepôt'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
