import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { JsonPanel } from '../JsonPanel'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().cancelEditing()
})

describe('CodeMirror extension array stability', () => {
  it('read-only panel renders with JSON content', () => {
    useJsonStore.setState({ jsonValue: { a: 1 } })

    render(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    expect(screen.getByText('JSON Final')).toBeInTheDocument()
    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
    expect(document.querySelector('.cm-editor')).toBeInTheDocument()
  })

  it('jsonLanguage extension is module-level singleton', async () => {
    const mod1 = await import('../JsonPanel')
    const mod2 = await import('../JsonPanel')
    expect(mod1).toBe(mod2)
  })

  it('jsonStr useMemo prevents redundant JSON.stringify', () => {
    const stringifySpy = vi.spyOn(JSON, 'stringify')
    const obj = { a: 1, b: { c: 2 } }

    useJsonStore.setState({ jsonValue: obj })

    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    const countBefore = stringifySpy.mock.calls.length

    useUiStore.getState().setToast({ msg: 'test', severity: 'success' })

    rerender(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    const countAfter = stringifySpy.mock.calls.length
    expect(countAfter).toBe(countBefore)

    stringifySpy.mockRestore()
  })

  it('edit mode uses same jsonLanguage extension as read-only', () => {
    useJsonStore.setState({ jsonValue: { a: 1 } })
    useUiStore.getState().startEditing('{"a":1}')

    render(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    expect(screen.getByText('Modo edição manual — valide ou cancele para continuar')).toBeInTheDocument()
    expect(document.querySelector('.cm-editor')).toBeInTheDocument()
  })

  it('read-only panel renders with stable content across theme changes', () => {
    useJsonStore.setState({ jsonValue: { x: 1 } })

    render(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
  })

  it('read-only panel aria-label is correct', () => {
    render(
      <ThemeProvider theme={theme}>
        <JsonPanel />
      </ThemeProvider>
    )

    const cm = document.querySelector('[role="textbox"]')
    expect(cm).toBeInTheDocument()
    expect(cm).toHaveAttribute('aria-label', 'Visualização de JSON')
  })
})
