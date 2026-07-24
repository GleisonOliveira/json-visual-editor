import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { AddFieldForm } from '../AddFieldForm'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderAddFieldForm(): void {
  render(
    <ThemeProvider theme={theme}>
      <AddFieldForm />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().cancelEditing()
  useUiStore.getState().setFieldName('newField')
  useUiStore.getState().setFieldType('string')
  useUiStore.getState().setTargetLabel('Início')
  useUiStore.getState().setValueIsNull(false)
  useUiStore.getState().setValueText('item')
  useUiStore.getState().setNameError(null)
  useUiStore.getState().setValueError(null)
})

describe('AddFieldForm', () => {
  it('renders all form fields', () => {
    renderAddFieldForm()
    expect(screen.getByText('Adicionar dados ao JSON')).toBeInTheDocument()
    expect(screen.getAllByText('Inserir em').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Tipo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Nome do campo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Nulo')).toBeInTheDocument()
    expect(screen.getByText('Adicionar')).toBeInTheDocument()
  })

  it('target selector shows Inicio (object)', () => {
    renderAddFieldForm()
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes[0]).toHaveTextContent(/Inicio/)
  })

  it('submit with empty name shows error', async () => {
    const user = userEvent.setup()
    useUiStore.getState().setFieldName('')
    renderAddFieldForm()
    await user.click(screen.getByText('Adicionar'))
    expect(useUiStore.getState().nameError).toBe('Informe um nome.')
  })

  it('submit with valid data calls handleApplyInsert', async () => {
    const user = userEvent.setup()
    useUiStore.getState().setFieldName('myField')
    useUiStore.getState().setValueText('hello')
    renderAddFieldForm()
    await user.click(screen.getByText('Adicionar'))
    const json = useJsonStore.getState().jsonValue as Record<string, unknown>
    expect(json['myField']).toBe('hello')
  })
})
