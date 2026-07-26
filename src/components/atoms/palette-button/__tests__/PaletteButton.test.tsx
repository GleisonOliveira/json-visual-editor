import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaletteButton } from '../PaletteButton'
import { Type, Hash } from 'lucide-react'

describe('PaletteButton', () => {
  it('renders with correct icon and label', () => {
    render(<PaletteButton type="string" icon={<Type size={14} />} disabled={false} />)
    expect(screen.getByText('string')).toBeInTheDocument()
  })

  it('draggable=true when disabled=false', () => {
    render(<PaletteButton type="string" icon={<Type size={14} />} disabled={false} />)
    const button = screen.getByText('string').closest('button')!
    expect(button).toHaveAttribute('draggable', 'true')
  })

  it('draggable=false when disabled=true', () => {
    render(<PaletteButton type="string" icon={<Type size={14} />} disabled={true} />)
    const button = screen.getByText('string').closest('button')!
    expect(button).toHaveAttribute('draggable', 'false')
  })

  it('disabled when disabled=true', () => {
    render(<PaletteButton type="number" icon={<Hash size={14} />} disabled={true} />)
    const button = screen.getByText('number').closest('button')!
    expect(button).toBeDisabled()
  })

  it('enabled when disabled=false', () => {
    render(<PaletteButton type="number" icon={<Hash size={14} />} disabled={false} />)
    const button = screen.getByText('number').closest('button')!
    expect(button).toBeEnabled()
  })
})
