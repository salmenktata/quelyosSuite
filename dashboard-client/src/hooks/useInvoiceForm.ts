/**
 * Hook formulaire facture avec validation Zod
 *
 * Fonctionnalités :
 * - Validation temps réel avec React Hook Form + Zod
 * - Gestion lignes dynamiques (ajout/suppression)
 * - Calcul automatique totaux
 * - Mutation TanStack Query pour création
 * - Toast feedback
 *
 * @example
 * const { form, addLine, removeLine, handleSubmit } = useInvoiceForm()
 */

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { invoiceCreateSchema, type InvoiceCreateInput } from '@/lib/validation/schemas'

interface CreateInvoiceResponse {
  success: boolean
  data: {
    id: number
    name: string
  }
  error?: string
}

/**
 * Hook formulaire création facture
 */
export function useInvoiceForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // React Hook Form avec validation Zod
  const form = useForm<InvoiceCreateInput>({
    resolver: zodResolver(invoiceCreateSchema),
    defaultValues: {
      customerId: 0,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      reference: '',
      note: '',
      lines: [
        {
          productId: null,
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxIds: [],
        },
      ],
    },
    mode: 'onBlur', // Valide au blur pour ne pas être trop intrusif
  })

  // Gestion lignes dynamiques
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  // Mutation création facture
  const createMutation = useMutation({
    mutationFn: async (data: InvoiceCreateInput) => {
      const response = await apiClient.post<CreateInvoiceResponse>('/finance/invoices/create', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur création facture')
      }

      return response.data.data
    },

    onMutate: () => {
      toast.loading('Création facture...', { id: 'create-invoice' })
    },

    onSuccess: (data) => {
      toast.success(`Facture ${data.name} créée avec succès`, { id: 'create-invoice' })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      navigate(`/invoicing/invoices/${data.id}`)
    },

    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`, { id: 'create-invoice' })
    },
  })

  // Helpers
  const addLine = () => {
    append({
      productId: null,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxIds: [],
    })
  }

  const removeLine = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    } else {
      toast.error('La facture doit contenir au moins une ligne')
    }
  }

  const calculateTotal = () => {
    const lines = form.watch('lines')
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
  }

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data)
  })

  return {
    form,
    fields,
    addLine,
    removeLine,
    calculateTotal,
    handleSubmit,
    isSubmitting: createMutation.isPending,
  }
}
