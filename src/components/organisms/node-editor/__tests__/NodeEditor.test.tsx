import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { NodeEditor } from '../NodeEditor'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderNodeEditor(locked = false): void {
  render(
    <ThemeProvider theme={theme}>
      <NodeEditor locked={locked} />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

describe('NodeEditor', () => {
  it('renders empty object with ContainerDropZone', () => {
    renderNodeEditor()
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('renders nested objects when expanded', () => {
    useJsonStore.setState({ jsonValue: { nested: { a: 1 } } })
    useUiStore.getState().toggleExpand(JSON.stringify(['nested']))
    renderNodeEditor()
    expect(screen.getByDisplayValue('nested')).toBeInTheDocument()
  })

  it('root type selector changes root value', () => {
    useJsonStore.setState({ jsonValue: 'hello' })
    renderNodeEditor()
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('renders root for primitive string type', () => {
    useJsonStore.setState({ jsonValue: 'hello' })
    renderNodeEditor()
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  it('renders root for primitive number type', () => {
    useJsonStore.setState({ jsonValue: 42 })
    renderNodeEditor()
    expect(screen.getByRole('textbox')).toHaveValue('42')
  })

  it('renders root for primitive boolean type', () => {
    useJsonStore.setState({ jsonValue: true })
    renderNodeEditor()
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('renders root for null type', () => {
    useJsonStore.setState({ jsonValue: null })
    renderNodeEditor()
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })
})
