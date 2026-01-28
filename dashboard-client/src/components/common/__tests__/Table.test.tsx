import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table, Column } from '../Table'

interface TestItem {
  id: number
  name: string
  email: string
}

const mockData: TestItem[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
  { id: 3, name: 'Charlie', email: 'charlie@test.com' },
]

const columns: Column<TestItem>[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email' },
]

describe('Table', () => {
  it('renders table with data', () => {
    render(<Table columns={columns} data={mockData} getRowKey={(item) => item.id} />)

    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Table columns={columns} data={[]} loading getRowKey={(item) => item.id} />)

    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('shows empty message when no data', () => {
    render(<Table columns={columns} data={[]} getRowKey={(item) => item.id} />)

    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    render(
      <Table
        columns={columns}
        data={[]}
        emptyMessage="Aucun utilisateur"
        getRowKey={(item) => item.id}
      />
    )

    expect(screen.getByText('Aucun utilisateur')).toBeInTheDocument()
  })

  it('calls onRowClick when row is clicked', async () => {
    const handleRowClick = vi.fn()

    render(
      <Table
        columns={columns}
        data={mockData}
        onRowClick={handleRowClick}
        getRowKey={(item) => item.id}
      />
    )

    await userEvent.click(screen.getByText('Alice'))
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('sorts data when sortable column header is clicked', async () => {
    render(<Table columns={columns} data={mockData} getRowKey={(item) => item.id} />)

    const nameHeader = screen.getByText('Nom')
    await userEvent.click(nameHeader)

    // After first click: ascending
    const rows = screen.getAllByRole('row')
    // First row is header, data rows start at index 1
    expect(rows[1]).toHaveTextContent('Alice')

    // Click again for descending
    await userEvent.click(nameHeader)
    const rowsDesc = screen.getAllByRole('row')
    expect(rowsDesc[1]).toHaveTextContent('Charlie')
  })

  it('renders custom cell content with render function', () => {
    const columnsWithRender: Column<TestItem>[] = [
      {
        key: 'name',
        label: 'Nom',
        render: (item) => <strong data-testid={`custom-name-${item.id}`}>{item.name.toUpperCase()}</strong>,
      },
    ]

    render(<Table columns={columnsWithRender} data={mockData} getRowKey={(item) => item.id} />)

    expect(screen.getByTestId('custom-name-1')).toHaveTextContent('ALICE')
    expect(screen.getByTestId('custom-name-2')).toHaveTextContent('BOB')
  })

  it('shows hover actions when provided', async () => {
    render(
      <Table
        columns={columns}
        data={mockData}
        getRowKey={(item) => item.id}
        hoverActions={(item) => <button data-testid={`action-${item.id}`}>Edit</button>}
      />
    )

    // Actions column should exist
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByTestId('action-1')).toBeInTheDocument()
  })
})
