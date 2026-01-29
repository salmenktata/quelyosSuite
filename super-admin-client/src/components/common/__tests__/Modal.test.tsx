import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
  }

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('displays description when provided', () => {
    render(<Modal {...defaultProps} description="Modal description" />)
    expect(screen.getByText('Modal description')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <Modal {...defaultProps}>
        <p>Custom content</p>
      </Modal>
    )
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn()
    render(<Modal {...defaultProps} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: /confirmer/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('uses custom button texts', () => {
    render(
      <Modal
        {...defaultProps}
        confirmText="Valider"
        cancelText="Fermer"
        onConfirm={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /valider/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('hides default actions when hideDefaultActions is true', () => {
    render(<Modal {...defaultProps} hideDefaultActions />)
    expect(screen.queryByRole('button', { name: /annuler/i })).not.toBeInTheDocument()
  })
})
