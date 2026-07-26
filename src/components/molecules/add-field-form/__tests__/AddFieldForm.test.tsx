import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { AddFieldForm } from '../AddFieldForm'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'
import { ContainerProvider } from '../../../../core/containerContext'
import { container } from '../../../../core/container'

const theme = createTheme()

function renderAddFieldForm(): void {
  render(
    <ContainerProvider value={container}>
      <ThemeProvider theme={theme}>
        <AddFieldForm />
      </ThemeProvider>
    </ContainerProvider>
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

  it('all form fields disabled when editingJson is true', () => {
    useUiStore.getState().startEditing('{}')
    renderAddFieldForm()

    const comboboxes = screen.getAllByRole('combobox')

    for (const cb of comboboxes) {
      expect(cb).toHaveAttribute('aria-disabled', 'true')
    }

    const nameInput = screen.getByPlaceholderText('nome do campo')
    expect(nameInput).toBeDisabled()

    const addBtn = screen.getByText('Adicionar')
    expect(addBtn).toBeDisabled()
  })

  it('switch toggle has accessible name', () => {
    renderAddFieldForm()
    const switchEl = screen.getByRole('switch')
    const input = switchEl.tagName === 'INPUT' ? switchEl : switchEl.querySelector('input')
    expect(input).toBeTruthy()
    expect(input).toHaveAttribute('aria-label', 'Nulo')
  })

  it('heading uses h2 element for proper hierarchy', () => {
    renderAddFieldForm()
    const heading = screen.getByRole('heading', { name: /adicionar dados ao json/i })
    expect(heading.tagName).toBe('H2')
  })

  it('form fields have autocomplete off', () => {
    renderAddFieldForm()
    useUiStore.getState().setFieldName('test')
    const nameInput = screen.getByPlaceholderText('nome do campo')
    expect(nameInput).toHaveAttribute('autocomplete', 'off')
  })
})
