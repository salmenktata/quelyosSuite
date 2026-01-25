# DataTable - Composant Générique

Composant de tableau React TypeScript générique avec tri, pagination, recherche et responsive.

## Features

✅ **Accessibilité WCAG 2.1 AA**
- Navigation clavier complète (Tab, Enter, Space)
- ARIA labels et roles appropriés
- Tri accessible avec `aria-sort`
- Focus indicators visibles

✅ **Responsive Mobile-First**
- Vue tableau sur desktop (≥ 1024px)
- Vue cards sur mobile (< 1024px)
- Configuration personnalisable

✅ **Tri Multi-Colonnes**
- Tri côté client ou serveur
- Fonction de tri personnalisée
- Indication visuelle du tri actif

✅ **Pagination**
- Navigation page par page
- Affichage "X à Y sur Z"
- Numéros de pages cliquables

✅ **Bulk Actions**
- Sélection multiple avec checkboxes
- Barre d'actions contextuelle
- Actions personnalisables

✅ **Loading & Empty States**
- Skeleton loading intégré
- Empty state personnalisable
- Gestion d'erreurs

---

## Installation

```bash
# Déjà inclus dans le projet
# Aucune installation nécessaire
```

---

## Usage Basique

```tsx
import { DataTable, DataTableColumn } from '@/components/common/DataTable'
import type { Customer } from '@/types'

const columns: DataTableColumn<Customer>[] = [
  {
    id: 'name',
    label: 'Nom',
    accessor: (row) => row.name,
    sortable: true,
  },
  {
    id: 'email',
    label: 'Email',
    accessor: (row) => row.email,
  },
  {
    id: 'total',
    label: 'Total',
    accessor: (row) => formatPrice(row.total_spent),
    align: 'right',
    sortable: true,
  },
]

function CustomersList() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useCustomers({ limit: 20, offset: page * 20 })

  return (
    <DataTable
      data={data?.customers || []}
      columns={columns}
      keyExtractor={(row) => row.id}
      isLoading={isLoading}
      pagination={{
        currentPage: page,
        pageSize: 20,
        totalItems: data?.total || 0,
        onPageChange: setPage,
      }}
    />
  )
}
```

---

## API

### Props `DataTable<T>`

| Prop | Type | Description | Requis |
|------|------|-------------|--------|
| `data` | `T[]` | Données à afficher | ✅ |
| `columns` | `DataTableColumn<T>[]` | Configuration des colonnes | ✅ |
| `keyExtractor` | `(row: T) => string \| number` | Fonction pour extraire la clé unique | ✅ |
| `isLoading` | `boolean` | État de chargement | ❌ |
| `error` | `string \| null` | Message d'erreur | ❌ |
| `mobileConfig` | `MobileCardConfig<T>` | Config vue mobile personnalisée | ❌ |
| `sortField` | `string` | Champ actuellement trié (contrôlé) | ❌ |
| `sortOrder` | `'asc' \| 'desc'` | Ordre de tri (contrôlé) | ❌ |
| `onSortChange` | `(field: string, order: SortOrder) => void` | Callback changement tri | ❌ |
| `pagination` | `PaginationConfig` | Configuration pagination | ❌ |
| `bulkActions` | `BulkAction<T>[]` | Actions bulk disponibles | ❌ |
| `selectedItems` | `T[]` | Éléments sélectionnés (contrôlé) | ❌ |
| `onSelectionChange` | `(items: T[]) => void` | Callback changement sélection | ❌ |
| `emptyMessage` | `string` | Message si aucune donnée | ❌ |
| `emptyComponent` | `ReactNode` | Composant custom empty state | ❌ |
| `skeletonRows` | `number` | Nombre lignes skeleton (défaut: 5) | ❌ |

### Type `DataTableColumn<T>`

```tsx
interface DataTableColumn<T> {
  id: string                          // Identifiant unique
  label: string                       // Label affiché dans header
  accessor: (row: T) => ReactNode     // Fonction pour extraire la valeur
  sortable?: boolean                  // Colonne triable ? (défaut: false)
  sortFn?: (a: T, b: T) => number    // Fonction tri personnalisée
  width?: string                      // Largeur CSS
  align?: 'left' | 'center' | 'right' // Alignement (défaut: 'left')
  showOnMobile?: boolean              // Afficher sur mobile ? (défaut: false)
  cellClassName?: string              // Classe CSS cellule
  headerClassName?: string            // Classe CSS header
}
```

### Type `BulkAction<T>`

```tsx
interface BulkAction<T> {
  id: string
  label: string
  icon?: ReactNode
  onExecute: (selectedItems: T[]) => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}
```

---

## Exemples

### 1. Tri Contrôlé (Serveur)

```tsx
function OrdersList() {
  const [sortField, setSortField] = useState('date_order')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const { data } = useOrders({
    sort_by: sortField,
    sort_order: sortOrder,
  })

  const handleSortChange = (field: string, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
  }

  return (
    <DataTable
      data={data?.orders || []}
      columns={columns}
      keyExtractor={(row) => row.id}
      sortField={sortField}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
    />
  )
}
```

### 2. Bulk Actions

```tsx
const bulkActions: BulkAction<Product>[] = [
  {
    id: 'archive',
    label: 'Archiver',
    icon: <ArchiveBoxIcon className="h-5 w-5" />,
    variant: 'secondary',
    onExecute: async (products) => {
      await archiveProducts(products.map(p => p.id))
      toast.success(`${products.length} produits archivés`)
    },
  },
  {
    id: 'delete',
    label: 'Supprimer',
    icon: <TrashIcon className="h-5 w-5" />,
    variant: 'danger',
    onExecute: async (products) => {
      if (confirm(`Supprimer ${products.length} produits ?`)) {
        await deleteProducts(products.map(p => p.id))
      }
    },
  },
]

<DataTable
  data={products}
  columns={columns}
  keyExtractor={(row) => row.id}
  bulkActions={bulkActions}
/>
```

### 3. Vue Mobile Personnalisée

```tsx
const mobileConfig: MobileCardConfig<Order> = {
  renderCard: (order) => (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{order.name}</span>
        <Badge variant={getStatusVariant(order.state)}>
          {order.state}
        </Badge>
      </div>
      <div className="text-sm text-gray-600">
        {order.customer.name} • {formatPrice(order.amount_total)}
      </div>
    </div>
  ),
  renderActions: (order) => (
    <Link to={`/orders/${order.id}`}>
      <Button variant="primary" size="sm">Voir détails</Button>
    </Link>
  ),
}

<DataTable
  data={orders}
  columns={columns}
  keyExtractor={(row) => row.id}
  mobileConfig={mobileConfig}
/>
```

### 4. Empty State Personnalisé

```tsx
const emptyComponent = (
  <div className="p-12 text-center">
    <UserGroupIcon className="w-20 h-20 mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Aucun client</h3>
    <p className="text-gray-600 mb-6">
      Créez votre premier client pour commencer
    </p>
    <Link to="/customers/create">
      <Button variant="primary">Créer un client</Button>
    </Link>
  </div>
)

<DataTable
  data={customers}
  columns={columns}
  keyExtractor={(row) => row.id}
  emptyComponent={emptyComponent}
/>
```

---

## Accessibilité

Le DataTable respecte WCAG 2.1 AA :

- ✅ Headers avec `scope="col"`
- ✅ Tri avec `aria-sort` et `aria-label`
- ✅ Navigation clavier (Tab, Enter, Space)
- ✅ Focus indicators `focus:ring-2`
- ✅ Pagination avec `aria-label`
- ✅ Checkboxes avec labels appropriés

---

## Performance

**Tri Côté Client vs Serveur**

- **Client** : Utilisez tri non contrôlé (pas de `onSortChange`). Bon pour < 500 éléments.
- **Serveur** : Utilisez tri contrôlé avec `onSortChange`. Bon pour > 500 éléments.

**Optimisations**

- `useMemo` pour tri et sélection (évite re-calculs)
- Skeleton loading (meilleure UX que spinner)
- Lazy loading avec pagination

---

## Migration depuis TableCustom

**Avant** :
```tsx
<table>
  <thead>
    <tr>
      <th onClick={() => handleSort('name')}>Nom</th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => <tr key={row.id}>...</tr>)}
  </tbody>
</table>
```

**Après** :
```tsx
<DataTable
  data={data}
  columns={[
    { id: 'name', label: 'Nom', accessor: (row) => row.name, sortable: true }
  ]}
  keyExtractor={(row) => row.id}
/>
```

**Bénéfices** :
- ✅ -50% de code
- ✅ Responsive automatique
- ✅ Accessibilité garantie
- ✅ Tri + pagination + bulk actions gratuits

---

## Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './DataTable'

test('affiche les données correctement', () => {
  const data = [{ id: 1, name: 'Test' }]
  const columns = [
    { id: 'name', label: 'Nom', accessor: (row) => row.name }
  ]

  render(
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(row) => row.id}
    />
  )

  expect(screen.getByText('Test')).toBeInTheDocument()
})

test('tri fonctionne', () => {
  const handleSort = jest.fn()

  render(
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(row) => row.id}
      onSortChange={handleSort}
    />
  )

  fireEvent.click(screen.getByText('Nom'))
  expect(handleSort).toHaveBeenCalledWith('name', 'asc')
})
```

---

## Support

Pour toute question ou bug, consultez la documentation du projet ou créez une issue.
