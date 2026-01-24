---
name: "[P1] Interface Backoffice Factures - EXEMPLE"
about: Exemple d'issue P1 remplie pour la fonctionnalité Factures
title: '[P1] Interface Backoffice Factures (Invoices.tsx + InvoiceDetail.tsx)'
labels: 'parité, P1, enhancement, sprint-1'
assignees: ''
---

## 📋 Informations Gap

**Module concerné** : Factures

**Priorité** : 🟡 P1 (Important) - **HAUTE PRIORITÉ** 🏅

**Effort estimé** : 1 jour

**Impact métier** : ⭐⭐⭐⭐⭐ Haute (Obligation légale, comptabilité)

**Sprint recommandé** : Sprint 1 - Production MVP

---

## 🎯 Description de la Fonctionnalité Odoo

**Fonctionnalité Odoo native** :
Odoo permet de générer des factures depuis les commandes confirmées, de les valider, d'enregistrer les paiements et de télécharger les PDF. L'interface affiche la liste de toutes les factures avec filtres (statut, client, date, montant) et permet d'accéder au détail de chaque facture.

**Modèle(s) Odoo utilisé(s)** :
- `account.move` (factures et avoirs)

**Champs Odoo concernés** :
- `name` : Numéro de facture (ex: INV/2026/0001)
- `invoice_date` : Date d'émission
- `invoice_date_due` : Date d'échéance
- `partner_id` : Client (res.partner)
- `move_type` : Type (out_invoice, out_refund, in_invoice, in_refund)
- `state` : Statut (draft, posted, cancel)
- `payment_state` : État paiement (not_paid, in_payment, paid, partial, reversed)
- `amount_untaxed` : Montant HT
- `amount_tax` : Montant TVA
- `amount_total` : Montant TTC
- `invoice_line_ids` : Lignes de facture (account.move.line)
- `invoice_origin` : Commande d'origine (sale.order référence)

---

## 🔴 Gap Actuel dans Quelyos

**Ce qui manque** :
- ❌ Aucune page admin pour visualiser les factures
- ❌ Impossible de télécharger les PDF de factures depuis l'interface
- ❌ Impossible de créer une facture depuis une commande dans l'UI
- ❌ Impossible de confirmer/valider une facture brouillon
- ❌ Impossible d'enregistrer un paiement sur une facture

**Impact utilisateur** :
- L'admin ne peut pas gérer la facturation sans accéder à Odoo directement
- Obligation légale non respectée (factures non accessibles)
- Comptabilité impossible à gérer via Quelyos
- SAV bloqué (impossible de voir les factures clients)

**Workaround actuel** :
Accéder à l'interface Odoo native (http://localhost:8069) pour gérer les factures → **Solution NON ACCEPTABLE** car l'objectif est de remplacer 100% des interfaces Odoo.

---

## ✅ Solution Proposée

### Backend API

**Endpoint(s) à créer/modifier** :
- ✅ `POST /api/ecommerce/invoices` - Liste factures (pagination, filtres) - **DÉJÀ EXISTE**
- ✅ `POST /api/ecommerce/invoices/<id>` - Détail facture - **DÉJÀ EXISTE**
- ✅ `POST /api/ecommerce/orders/<id>/create-invoice` - Créer facture depuis commande - **DÉJÀ EXISTE**
- ✅ `POST /api/ecommerce/invoices/<id>/post` - Valider facture (draft → posted) - **DÉJÀ EXISTE**
- [ ] `POST /api/ecommerce/invoices/<id>/download-pdf` - Télécharger PDF - **À CRÉER**

**Backend 100% prêt !** Seul endpoint manquant : download PDF (effort : 30 min)

**Paramètres `/invoices` (liste)** :
```json
{
  "limit": 20,
  "offset": 0,
  "state": "posted|draft|cancel",  // Filtre statut
  "payment_state": "paid|not_paid|partial",  // Filtre paiement
  "partner_id": 42,  // Filtre client
  "date_from": "2026-01-01",  // Filtre date début
  "date_to": "2026-01-31"  // Filtre date fin
}
```

**Réponse attendue** :
```json
{
  "data": {
    "invoices": [
      {
        "id": 1,
        "name": "INV/2026/0001",
        "invoice_date": "2026-01-24",
        "invoice_date_due": "2026-02-24",
        "partner": {
          "id": 42,
          "name": "Client Test"
        },
        "move_type": "out_invoice",
        "state": "posted",
        "payment_state": "not_paid",
        "amount_untaxed": 100.00,
        "amount_tax": 20.00,
        "amount_total": 120.00,
        "invoice_origin": "SO/2026/0042"
      }
    ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

**Modèles Odoo à exploiter** :
- `account.move.search_read([...])` pour liste paginée avec filtres
- `account.move.browse(id)` pour détail
- `sale.order.browse(id)._create_invoices()` pour création depuis commande
- `account.move.action_post()` pour valider facture brouillon
- `ir.actions.report._render_qweb_pdf('account.report_invoice', [id])` pour PDF

**Approche "surcouche" respectée** :
- [x] Aucune modification schéma Odoo ✅
- [x] Utilisation exclusive modèles existants ✅
- [x] API JSON-RPC uniquement ✅

---

### Frontend / Backoffice

**Page(s) à créer/modifier** :
- [ ] `backoffice/src/pages/Invoices.tsx` (~300 lignes) - Liste factures avec filtres
- [ ] `backoffice/src/pages/InvoiceDetail.tsx` (~250 lignes) - Détail facture
- [ ] `backoffice/src/pages/OrderDetail.tsx` (modifier) - Ajouter bouton "Créer facture"

**Composant(s) UI** :
- Réutiliser composants existants : `Table`, `Badge`, `Button`, `Modal`, `Skeleton`, `Breadcrumbs`
- Aucun nouveau composant nécessaire

**Hook(s) React Query** :
- [x] `useInvoices()` dans `backoffice/src/hooks/useInvoices.ts` - **DÉJÀ EXISTE**
- [ ] Compléter avec `useInvoice(id)`, `useCreateInvoice()`, `useConfirmInvoice()`, `useDownloadInvoicePDF()`

**Types TypeScript** :
```typescript
// backoffice/src/types/index.ts
export interface Invoice {
  id: number
  name: string
  invoice_date: string
  invoice_date_due: string
  partner: {
    id: number
    name: string
    email?: string
  }
  move_type: 'out_invoice' | 'out_refund' | 'in_invoice' | 'in_refund'
  state: 'draft' | 'posted' | 'cancel'
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'
  amount_untaxed: number
  amount_tax: number
  amount_total: number
  invoice_origin?: string  // N° commande
  invoice_line_ids: InvoiceLine[]
  currency: {
    id: number
    name: string
    symbol: string
  }
}

export interface InvoiceLine {
  id: number
  name: string  // Description produit
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
  product_id?: {
    id: number
    name: string
  }
}
```

---

## 📝 Spécifications Techniques

### Étapes d'Implémentation

#### 1. Backend (30 min)

- [ ] Ajouter endpoint `download_invoice_pdf()` dans `main.py` :
  ```python
  @http.route('/api/ecommerce/invoices/<int:invoice_id>/download-pdf', ...)
  def download_invoice_pdf(self, invoice_id, **kwargs):
      invoice = request.env['account.move'].sudo().browse(invoice_id)
      pdf = request.env.ref('account.account_invoices').render_qweb_pdf([invoice_id])[0]
      pdf_base64 = base64.b64encode(pdf).decode()
      return {
          'data': {
              'filename': f'{invoice.name.replace("/", "_")}.pdf',
              'content': pdf_base64
          }
      }
  ```

- [ ] Tester endpoint avec Postman

#### 2. Types TypeScript (15 min)

- [x] Types `Invoice` et `InvoiceLine` déjà définis dans `types/index.ts`
- [ ] Vérifier cohérence avec réponse API actuelle

#### 3. API Client (15 min)

- [ ] Ajouter méthode dans `lib/api.ts` :
  ```typescript
  async downloadInvoicePDF(invoiceId: number): Promise<{ filename: string; content: string }> {
    return this.request<{ filename: string; content: string }>(
      `/api/ecommerce/invoices/${invoiceId}/download-pdf`
    )
  }
  ```

#### 4. Hook React Query (30 min)

- [ ] Compléter `hooks/useInvoices.ts` :
  ```typescript
  export function useInvoice(id: number) {
    return useQuery(['invoice', id], () => api.getInvoice(id))
  }

  export function useCreateInvoice() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (orderId: number) => api.createInvoiceFromOrder(orderId),
      onSuccess: () => {
        queryClient.invalidateQueries(['invoices'])
        toast.success('Facture créée avec succès')
      }
    })
  }

  export function useConfirmInvoice() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (invoiceId: number) => api.confirmInvoice(invoiceId),
      onSuccess: () => {
        queryClient.invalidateQueries(['invoices'])
        toast.success('Facture confirmée')
      }
    })
  }

  export function useDownloadInvoicePDF() {
    return useMutation({
      mutationFn: async (invoiceId: number) => {
        const { filename, content } = await api.downloadInvoicePDF(invoiceId)
        // Trigger download
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${content}`
        link.download = filename
        link.click()
      }
    })
  }
  ```

#### 5. Page Invoices.tsx (2-3h)

Structure similaire à Orders.tsx :

```typescript
export function Invoices() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    state: '',
    payment_state: '',
    partner_id: null,
    date_from: '',
    date_to: ''
  })

  const { data, isLoading } = useInvoices({ ...filters, limit: 20, offset: (page - 1) * 20 })

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'Factures' }]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Factures</h1>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select value={filters.state} onChange={...}>
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="posted">Validée</option>
          <option value="cancel">Annulée</option>
        </select>

        <select value={filters.payment_state} onChange={...}>
          <option value="">Tous les paiements</option>
          <option value="not_paid">Non payée</option>
          <option value="paid">Payée</option>
          <option value="partial">Partiellement payée</option>
        </select>

        <input type="date" placeholder="Date début" value={filters.date_from} onChange={...} />
        <input type="date" placeholder="Date fin" value={filters.date_to} onChange={...} />
      </div>

      {/* Tableau */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : (
        <Table
          columns={[
            { key: 'name', label: 'Numéro' },
            { key: 'invoice_date', label: 'Date' },
            { key: 'partner', label: 'Client', render: (inv) => inv.partner.name },
            { key: 'invoice_origin', label: 'Commande' },
            { key: 'amount_total', label: 'Total TTC', render: formatCurrency },
            { key: 'state', label: 'Statut', render: (inv) => <Badge variant={...}>{inv.state}</Badge> },
            { key: 'payment_state', label: 'Paiement', render: (inv) => <Badge variant={...}>{inv.payment_state}</Badge> }
          ]}
          data={data?.invoices || []}
          onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
        />
      )}

      {/* Pagination */}
      <Pagination total={data?.total} currentPage={page} onPageChange={setPage} />
    </div>
  )
}
```

#### 6. Page InvoiceDetail.tsx (2-3h)

Structure similaire à OrderDetail.tsx :

```typescript
export function InvoiceDetail() {
  const { id } = useParams()
  const { data: invoice, isLoading } = useInvoice(Number(id))
  const confirmMutation = useConfirmInvoice()
  const downloadMutation = useDownloadInvoicePDF()

  if (isLoading) return <Skeleton />

  return (
    <div className="p-6">
      <Breadcrumbs items={[
        { label: 'Accueil', href: '/' },
        { label: 'Factures', href: '/invoices' },
        { label: invoice.name }
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{invoice.name}</h1>
        <div className="flex gap-2">
          {invoice.state === 'draft' && (
            <Button onClick={() => confirmMutation.mutate(invoice.id)}>
              Confirmer facture
            </Button>
          )}
          <Button variant="secondary" onClick={() => downloadMutation.mutate(invoice.id)}>
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Grille informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Informations facture</h2>
          <p>Date émission : {invoice.invoice_date}</p>
          <p>Date échéance : {invoice.invoice_date_due}</p>
          <p>Commande : {invoice.invoice_origin}</p>
          <p>Statut : <Badge>{invoice.state}</Badge></p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Client</h2>
          <p>{invoice.partner.name}</p>
          <p>{invoice.partner.email}</p>
        </div>
      </div>

      {/* Lignes facture */}
      <Table
        columns={[
          { key: 'name', label: 'Description' },
          { key: 'quantity', label: 'Quantité' },
          { key: 'price_unit', label: 'Prix unitaire', render: formatCurrency },
          { key: 'price_total', label: 'Total TTC', render: formatCurrency }
        ]}
        data={invoice.invoice_line_ids}
      />

      {/* Totaux */}
      <div className="text-right mt-4">
        <p>Total HT : {formatCurrency(invoice.amount_untaxed)}</p>
        <p>TVA : {formatCurrency(invoice.amount_tax)}</p>
        <p className="text-xl font-bold">Total TTC : {formatCurrency(invoice.amount_total)}</p>
      </div>
    </div>
  )
}
```

#### 7. Modification OrderDetail.tsx (30 min)

- [ ] Ajouter bouton "Créer facture" si `order.state === 'sale'` et pas de facture existante
- [ ] Afficher lien vers facture si existe

```typescript
{order.state === 'sale' && !order.invoice_ids?.length && (
  <Button onClick={() => createInvoiceMutation.mutate(order.id)}>
    Créer facture
  </Button>
)}

{order.invoice_ids?.length > 0 && (
  <Link href={`/invoices/${order.invoice_ids[0]}`}>
    <Button variant="secondary">Voir facture</Button>
  </Link>
)}
```

#### 8. Navigation Sidebar (5 min)

- [ ] Ajouter lien "Factures" dans `Layout.tsx` :
  ```typescript
  {
    name: 'Factures',
    href: '/invoices',
    icon: <DocumentTextIcon />
  }
  ```

---

## 🧪 Critères d'Acceptation

- [ ] Page Invoices.tsx opérationnelle avec liste paginée
- [ ] Filtres fonctionnels (statut, paiement, dates, client)
- [ ] Navigation vers détail facture au clic sur ligne
- [ ] Page InvoiceDetail.tsx complète avec toutes infos
- [ ] Bouton "Télécharger PDF" fonctionnel (download navigateur)
- [ ] Bouton "Confirmer facture" si draft (draft → posted)
- [ ] Bouton "Créer facture" dans OrderDetail.tsx si applicable
- [ ] Lien vers facture depuis OrderDetail.tsx si existe
- [ ] Skeleton loading pendant chargement
- [ ] Empty state si aucune facture
- [ ] Toasts success/error après actions
- [ ] Responsive (mobile, tablette, desktop)
- [ ] Mode sombre fonctionnel
- [ ] Navigation clavier (accessibilité)
- [ ] Breadcrumbs navigation cohérents

---

## 📚 Références

**Audit de parité source** : `/parity` 2026-01-24 - Module Factures 40% → Backend 100% prêt, UI manquante

**Documentation Odoo** :
- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html#odoo.models.Model
- Model `account.move` : https://github.com/odoo/odoo/blob/19.0/addons/account/models/account_move.py

**Sprint Plan** : [PARITY_SPRINT_PLAN.md](../../PARITY_SPRINT_PLAN.md) - Sprint 1, Tâche 1.1

**CLAUDE.md - Règles de parité** : [Section "Principe Fondamental : Parité Fonctionnelle Totale avec Odoo"](../../CLAUDE.md#principe-fondamental--parité-fonctionnelle-totale-avec-odoo)

**Endpoints backend existants** :
- Définis dans `backend/addons/quelyos_api/controllers/main.py` lignes 5280-5437

---

## 💬 Notes Complémentaires

**Effort réel estimé** : 6-8 heures (1 journée)

**Dépendances** :
- Aucune dépendance externe, tous les composants UI existent déjà
- Hook useInvoices existe déjà, à compléter seulement

**Avantages** :
- Backend 100% prêt → gain de temps considérable
- Composants UI réutilisables → cohérence UX garantie
- Aucune modification Odoo nécessaire → approche surcouche respectée

**Risques** :
- Aucun risque technique identifié
- Tâche straightforward avec exemples similaires (Orders, Customers)

**Prochaine étape après implémentation** :
- Tester workflow complet : Commande confirmée → Créer facture → Confirmer facture → Télécharger PDF
- Ré-exécuter `/parity` pour valider progression (Factures 40% → ~95%)
