import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PalettePanel } from '../PalettePanel'

describe('PalettePanel', () => {
  it('renders 6 palette buttons', () => {
    render(<PalettePanel />)
    expect(screen.getByText('string')).toBeInTheDocument()
    expect(screen.getByText('number')).toBeInTheDocument()
    expect(screen.getByText('boolean')).toBeInTheDocument()
    expect(screen.getByText('object')).toBeInTheDocument()
    expect(screen.getByText('array')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
  })

  it('all buttons are draggable when not editing', () => {
    render(<PalettePanel />)
    const buttons = ['string', 'number', 'boolean', 'object', 'array', 'null']

    for (const type of buttons) {
      const btn = screen.getByText(type).closest('button')!
      expect(btn).toHaveAttribute('draggable', 'true')
    }
  })
})
