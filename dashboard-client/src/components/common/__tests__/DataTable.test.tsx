import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from '../DataTable/DataTable'
import type { DataTableColumn } from '@quelyos/types'

interface TestRow {
  id: number
  name: string
  email: string
  amount: number
}

const testData: TestRow[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com', amount: 100 },
  { id: 2, name: 'Bob', email: 'bob@test.com', amount: 200 },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', amount: 50 },
]

const columns: DataTableColumn<TestRow>[] = [
  { id: 'name', key: 'name', label: 'Nom', accessor: (row) => <span>{row.name}</span>, sortable: true },
  { id: 'email', key: 'email', label: 'Email', accessor: (row) => <span>{row.email}</span> },
  { id: 'amount', key: 'amount', label: 'Montant', accessor: (row) => <span>{row.amount} EUR</span>, sortable: true, align: 'right' },
]

const keyExtractor = (row: TestRow) => row.id

describe('DataTable', () => {
  it('renders data rows in desktop table', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
      />
    )

    expect(screen.getAllByText('Alice')).toHaveLength(2) // desktop + mobile
    expect(screen.getAllByText('Bob')).toHaveLength(2)
    expect(screen.getAllByText('Charlie')).toHaveLength(2)
  })

  it('renders column headers', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
      />
    )

    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Montant')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        isLoading={true}
      />
    )

    // Should not render data
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    // Should render skeleton (animated divs)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state with role="alert"', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        error="Connexion au serveur impossible"
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('Connexion au serveur impossible')).toBeInTheDocument()
  })

  it('shows empty message when data is empty', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyMessage="Aucun client trouvé"
      />
    )

    expect(screen.getByText('Aucun client trouvé')).toBeInTheDocument()
  })

  it('shows default empty message', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
      />
    )

    expect(screen.getByText('Aucune donnée à afficher')).toBeInTheDocument()
  })

  it('shows custom empty component', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyComponent={<div data-testid="custom-empty">Empty state</div>}
      />
    )

    expect(screen.getByTestId('custom-empty')).toBeInTheDocument()
  })

  it('handles sort via onSortChange', () => {
    const onSortChange = vi.fn()

    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        sortField="name"
        sortOrder="asc"
        onSortChange={onSortChange}
      />
    )

    // Click on a sortable column header
    fireEvent.click(screen.getByText('Nom'))

    expect(onSortChange).toHaveBeenCalledWith('name', 'desc')
  })

  it('handles sort toggle on new column', () => {
    const onSortChange = vi.fn()

    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        sortField="name"
        sortOrder="asc"
        onSortChange={onSortChange}
      />
    )

    // Click on different column
    fireEvent.click(screen.getByText('Montant'))

    expect(onSortChange).toHaveBeenCalledWith('amount', 'asc')
  })

  it('renders bulk action bar when items are selected', () => {
    const onExecute = vi.fn()
    const selectedSet = new Set([1, 2])

    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        bulkActions={[
          { id: 'delete', label: 'Supprimer', onClick: onExecute, onExecute, variant: 'danger' },
        ]}
        selectedItems={testData.filter((d) => selectedSet.has(d.id))}
        onSelectionChange={vi.fn()}
      />
    )

    expect(screen.getByText('Supprimer')).toBeInTheDocument()
    expect(screen.getByText(/2 éléments sélectionnés/)).toBeInTheDocument()
  })

  it('does not render pagination when total <= limit', () => {
    const { container } = render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        pagination={{
          total: 3,
          offset: 0,
          limit: 20,
          onPageChange: vi.fn(),
        }}
      />
    )

    expect(screen.queryByText('Suivant')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-label="Page suivante"]')).not.toBeInTheDocument()
  })

  it('renders pagination when total > limit', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        pagination={{
          total: 100,
          offset: 0,
          limit: 20,
          onPageChange: vi.fn(),
        }}
      />
    )

    expect(screen.getByText(/Affichage 1 à 20 sur 100/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={keyExtractor}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
