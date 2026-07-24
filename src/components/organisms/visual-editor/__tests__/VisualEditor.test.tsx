import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { VisualEditor } from '../VisualEditor'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderVisualEditor(): void {
  render(
    <ThemeProvider theme={theme}>
      <VisualEditor />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useUiStore.getState().cancelEditing()
})

describe('VisualEditor', () => {
  it('renders with title "Modelo (visual)"', () => {
    renderVisualEditor()
    expect(screen.getByText('Modelo (visual)')).toBeInTheDocument()
  })

  it('renders NodeEditor', () => {
    renderVisualEditor()
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('renders PalettePanel (desktop buttons)', () => {
    renderVisualEditor()
    expect(screen.getByText('string')).toBeInTheDocument()
    expect(screen.getByText('number')).toBeInTheDocument()
  })
})
