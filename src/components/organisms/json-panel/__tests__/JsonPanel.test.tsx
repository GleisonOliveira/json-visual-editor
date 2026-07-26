import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { JsonPanel } from '../JsonPanel'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderJsonPanel(): void {
  render(
    <ThemeProvider theme={theme}>
      <JsonPanel />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().cancelEditing()
})

describe('JsonPanel', () => {
  it('renders formatted JSON in read-only mode', () => {
    useJsonStore.setState({ jsonValue: { a: 1 } })
    renderJsonPanel()
    expect(screen.getByText('JSON Final')).toBeInTheDocument()
    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
  })

  it('shows "Somente leitura" when not editing', () => {
    renderJsonPanel()
    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
  })

  it('shows "Modo edição manual" when editing', () => {
    useUiStore.getState().startEditing('{}')
    renderJsonPanel()
    expect(screen.getByText('Modo edição manual — valide ou cancele para continuar')).toBeInTheDocument()
  })

  it('CodeMirror has accessible name for JSON viewer', () => {
    renderJsonPanel()
    const cm = document.querySelector('[role="textbox"]')
    expect(cm).toBeInTheDocument()
    expect(cm).toHaveAttribute('aria-label', 'Visualização de JSON')
  })
})
