# Sprint 2 - Exemple Validation Zod + React Hook Form

## 🎯 Objectif

Montrer comment migrer un formulaire vers React Hook Form avec validation Zod inline.

---

## 📝 Exemple : Formulaire Création Facture

### Avant (Validation Manuelle)

```tsx
// ❌ Ancien code - Validation manuelle
export default function NewInvoicePage() {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [invoiceDate, setInvoiceDate] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>([...])

  const handleSubmit = async () => {
    // Validation manuelle avec alert()
    if (!customerId) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (lines.some(line => !line.description)) {
      alert('Veuillez remplir toutes les descriptions')
      return
    }

    // Appel API manuel
    try {
      setLoading(true)
      const response = await apiClient.post('/finance/invoices/create', {...})
      if (response.data.success) {
        navigate(`/invoicing/invoices/${response.data.data.id}`)
      }
    } catch (err) {
      alert('Erreur')
    }
  }

  return (
    <form>
      <label>Client *</label>
      <select
        value={customerId || ''}
        onChange={(e) => setCustomerId(Number(e.target.value))}
      >
        <option value="">Sélectionner</option>
      </select>

      <label>Date facture *</label>
      <input
        type="date"
        value={invoiceDate}
        onChange={(e) => setInvoiceDate(e.target.value)}
      />

      {/* Pas de feedback inline, pas de validation temps réel */}
    </form>
  )
}
```

### Après (Validation Zod + React Hook Form)

```tsx
// ✅ Nouveau code - Validation automatique
import { useInvoiceForm } from '@/hooks/useInvoiceForm'
import { FormField, FormInput, FormSelect } from '@/components/forms'

export default function NewInvoicePage() {
  const {
    form,
    fields,
    addLine,
    removeLine,
    handleSubmit,
    isSubmitting,
  } = useInvoiceForm()

  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={handleSubmit}>
      {/* Champ avec validation inline automatique */}
      <FormField
        label="Client"
        error={errors.customerId?.message}
        required
      >
        <FormSelect
          {...register('customerId', { valueAsNumber: true })}
          error={errors.customerId?.message}
        >
          <option value={0}>Sélectionner un client</option>
          {/* Options clients */}
        </FormSelect>
      </FormField>

      {/* Date avec validation format automatique */}
      <FormField
        label="Date facture"
        error={errors.invoiceDate?.message}
        required
      >
        <FormInput
          type="date"
          {...register('invoiceDate')}
          error={errors.invoiceDate?.message}
        />
      </FormField>

      {/* Lignes dynamiques avec validation */}
      {fields.map((field, index) => (
        <div key={field.id}>
          <FormField
            label="Description"
            error={errors.lines?.[index]?.description?.message}
            required
          >
            <FormInput
              {...register(`lines.${index}.description`)}
              error={errors.lines?.[index]?.description?.message}
              placeholder="Description de la prestation"
            />
          </FormField>

          <FormField
            label="Quantité"
            error={errors.lines?.[index]?.quantity?.message}
          >
            <FormInput
              type="number"
              step="0.01"
              {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
              error={errors.lines?.[index]?.quantity?.message}
            />
          </FormField>

          <FormField
            label="Prix unitaire"
            error={errors.lines?.[index]?.unitPrice?.message}
          >
            <FormInput
              type="number"
              step="0.01"
              {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
              error={errors.lines?.[index]?.unitPrice?.message}
            />
          </FormField>

          <Button
            variant="ghost"
            onClick={() => removeLine(index)}
            disabled={fields.length === 1}
          >
            Supprimer
          </Button>
        </div>
      ))}

      <Button variant="secondary" onClick={addLine}>
        Ajouter une ligne
      </Button>

      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Création...' : 'Créer la facture'}
      </Button>
    </form>
  )
}
```

---

## 🎨 Avantages

### 1. Validation Automatique
```typescript
// Schéma Zod définit les règles une seule fois
export const invoiceCreateSchema = z.object({
  customerId: z.number().positive('Veuillez sélectionner un client'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  lines: z.array(z.object({
    description: z.string().min(1, 'Description requise'),
    quantity: z.number().min(0.01, 'Quantité doit être > 0'),
    unitPrice: z.number().min(0, 'Prix doit être positif'),
  })).min(1, 'Au moins une ligne requise'),
})

// ✅ Validation appliquée automatiquement :
// - Au blur (onBlur mode)
// - À la soumission
// - Feedback inline immédiat
```

### 2. Feedback Inline Contextuel

**Avant** :
- ❌ `alert()` bloquant toute la page
- ❌ Pas de feedback sur quel champ a l'erreur
- ❌ Utilisateur doit fermer alert → chercher le champ → corriger

**Après** :
- ✅ Message d'erreur sous le champ concerné
- ✅ Icône AlertCircle rouge
- ✅ Border rouge sur input erroné
- ✅ Animation fade-in smooth
- ✅ Utilisateur voit immédiatement où corriger

### 3. Type Safety

```typescript
// ✅ TypeScript inféré automatiquement depuis Zod
type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>

// Autocomplétion IDE sur form.watch(), errors, etc.
const lines = form.watch('lines') // Type : InvoiceLineInput[]
const error = errors.customerId?.message // Type : string | undefined
```

### 4. Moins de Code Boilerplate

**Avant** :
- 8 useState (customerId, invoiceDate, dueDate, reference, note, lines, loading, error)
- Fonctions updateLine(), validation manuelle, gestion loading...
- ~150 lignes code formulaire

**Après** :
- 1 useForm() hook
- Validation automatique
- Gestion état automatique
- ~80 lignes code formulaire (-47% code)

### 5. UX Professionnelle

- ✅ Validation onBlur (pas trop intrusif)
- ✅ Affichage erreurs uniquement après interaction
- ✅ Hints/conseils au survol
- ✅ Required fields marqués visuellement (*)
- ✅ Disabled state pendant soumission
- ✅ Toast success/error après soumission

---

## 🔧 Fichiers Créés

```
dashboard-client/src/
├── lib/validation/schemas.ts
│   └── invoiceCreateSchema ✅ Mis à jour
├── hooks/useInvoiceForm.ts ✅ Nouveau
│   └── Hook réutilisable avec validation + mutation
└── components/forms/
    ├── FormField.tsx ✅ Nouveau
    │   └── Composant label + error inline
    └── index.ts ✅ Nouveau
```

---

## 🚀 Prochaines Étapes

### Pages à Migrer (Priorité)

1. **✅ Création facture** (`/invoicing/invoices/new`)
   - Formulaire complet avec lignes dynamiques
   - Validation 8 champs + N lignes

2. **Édition facture** (`/invoicing/invoices/[id]/edit`)
   - Réutiliser `useInvoiceForm` avec mode édition
   - Pré-remplir valeurs existantes

3. **Création client rapide** (`/crm/customers/new`)
   - Formulaire simple 5 champs
   - Validation email, téléphone, SIRET

4. **Création produit** (`/store/catalog/products/new`)
   - Validation SKU, prix, stock
   - Upload image avec preview

5. **Paramètres utilisateur** (`/settings/profile`)
   - Validation email, téléphone
   - Changement mot de passe sécurisé

### Pattern Réplicable

```typescript
// 1. Créer schéma Zod
export const myFormSchema = z.object({
  field1: z.string().min(1, 'Requis'),
  field2: z.number().positive(),
})

// 2. Créer hook personnalisé
export function useMyForm() {
  const form = useForm({
    resolver: zodResolver(myFormSchema),
    defaultValues: {...},
  })

  const mutation = useMutation({
    mutationFn: async (data) => apiClient.post('/endpoint', data),
    onSuccess: () => toast.success('Succès'),
  })

  return { form, handleSubmit: form.handleSubmit((data) => mutation.mutate(data)) }
}

// 3. Utiliser dans composant
function MyPage() {
  const { form, handleSubmit } = useMyForm()
  const { register, formState: { errors } } = form

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Champ 1" error={errors.field1?.message}>
        <FormInput {...register('field1')} />
      </FormField>
      <Button type="submit">Envoyer</Button>
    </form>
  )
}
```

---

## ✅ Checklist Migration Formulaire

- [ ] Créer schéma Zod dans `schemas.ts`
- [ ] Créer hook personnalisé `useXxxForm.ts` (optionnel si simple)
- [ ] Remplacer useState par useForm
- [ ] Remplacer inputs natifs par `<FormField>` + `<FormInput>`
- [ ] Ajouter `{...register('fieldName')}` sur chaque input
- [ ] Afficher `errors.fieldName?.message` dans FormField
- [ ] Supprimer validation manuelle (if/alert)
- [ ] Remplacer appel API manuel par useMutation
- [ ] Tester : validation onBlur, soumission, erreurs inline

---

## 📖 Ressources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Exemple complet : `useInvoiceForm.ts`](./../dashboard-client/src/hooks/useInvoiceForm.ts)
- [Composants forms : `FormField.tsx`](./../dashboard-client/src/components/forms/FormField.tsx)
