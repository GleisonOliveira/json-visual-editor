import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { JsonToolbar } from '../JsonToolbar'
import { useUiStore } from '../../../../store/uiStore'
import { useJsonStore } from '../../../../store/jsonStore'

const theme = createTheme()

function renderToolbar(): void {
  render(
    <ThemeProvider theme={theme}>
      <JsonToolbar />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useUiStore.getState().cancelEditing()
  useJsonStore.setState({ jsonValue: {} })
})

describe('JsonToolbar', () => {
  it('shows Editar JSON + Copiar + Copiar minificado + Baixar when not editing', () => {
    renderToolbar()
    expect(screen.getByText('Editar JSON')).toBeInTheDocument()
    expect(screen.getByText('Copiar')).toBeInTheDocument()
    expect(screen.getByText('Copiar minificado')).toBeInTheDocument()
    expect(screen.getByText('Baixar')).toBeInTheDocument()
  })

  it('shows Cancelar + Validar when editing', () => {
    useUiStore.getState().startEditing('{}')
    renderToolbar()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Validar')).toBeInTheDocument()
  })

  it('Editar JSON calls startEditing', async () => {
    const user = userEvent.setup()
    useJsonStore.setState({ jsonValue: { a: 1 } })
    renderToolbar()
    await user.click(screen.getByText('Editar JSON'))
    expect(useUiStore.getState().editingJson).toBe(true)
  })

  it('Cancelar calls cancelEditing', async () => {
    const user = userEvent.setup()
    useUiStore.getState().startEditing('{}')
    renderToolbar()
    await user.click(screen.getByText('Cancelar'))
    expect(useUiStore.getState().editingJson).toBe(false)
  })

  it('Validar with valid JSON applies and calls cancelEditing', async () => {
    const user = userEvent.setup()
    useUiStore.getState().startEditing('{"x":1}')
    renderToolbar()
    await user.click(screen.getByText('Validar'))
    expect(useUiStore.getState().editingJson).toBe(false)
    expect(useJsonStore.getState().jsonValue).toEqual({ x: 1 })
  })

  it('Validar with invalid JSON shows error toast', async () => {
    const user = userEvent.setup()
    useUiStore.getState().startEditing('{invalid}')
    renderToolbar()
    await user.click(screen.getByText('Validar'))
    expect(useUiStore.getState().toast?.severity).toBe('error')
  })

  it('Baixar uses setTimeout to revoke object URL', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    renderToolbar()
    const baixarBtn = screen.getByText('Baixar')
    baixarBtn.click()
    expect(revokeSpy).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 100))
    expect(revokeSpy).toHaveBeenCalled()
    revokeSpy.mockRestore()
  })
})
