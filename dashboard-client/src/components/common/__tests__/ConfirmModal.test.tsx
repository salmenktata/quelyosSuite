import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '../ConfirmModal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirmer la suppression',
    message: 'Voulez-vous vraiment supprimer cet élément ?',
  }

  it('renders when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument()
    expect(screen.getByText('Voulez-vous vraiment supprimer cet élément ?')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Confirmer la suppression')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: /confirmer/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('uses custom button texts', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Supprimer"
        cancelText="Non merci"
      />
    )

    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /non merci/i })).toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
