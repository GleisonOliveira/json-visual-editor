import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ContainerDropZone } from '../ContainerDropZone'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderDropZone(
  parentPath: Array<string | number> = [],
  parentKind: 'object' | 'array' = 'object',
  locked = false
): void {
  render(
    <ThemeProvider theme={theme}>
      <ContainerDropZone parentPath={parentPath} parentKind={parentKind} locked={locked} />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

function createMockDataTransfer(data: string): { getData: (type: string) => string; dropEffect: string; preventDefault: () => void; stopPropagation: () => void } {
  const store: Record<string, string> = { 'application/jsonve-dnd': data }

  return {
    getData: (type: string) => store[type] ?? '',
    dropEffect: '',
    preventDefault: () => {},
    stopPropagation: () => {},
  }
}

describe('ContainerDropZone', () => {
  it('renders "Arraste itens para cá" text', () => {
    renderDropZone()
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('visual feedback on dragEnter', () => {
    renderDropZone()
    const box = screen.getByText('Arraste itens para cá').closest('[class*="MuiBox"]')!
    fireEvent.dragEnter(box, { dataTransfer: { dropEffect: '' } })
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('locked=true does not prevent rendering', () => {
    renderDropZone([], 'object', true)
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('drop with palette payload inserts new field into store', () => {
    renderDropZone([], 'object', false)
    const text = screen.getByText('Arraste itens para cá')
    const raw = JSON.stringify({ fromPalette: true, paletteType: 'string' })
    const dt = createMockDataTransfer(raw)
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dt, configurable: true })
    text.dispatchEvent(dropEvent)
    const json = useJsonStore.getState().jsonValue as Record<string, unknown>
    const keys = Object.keys(json)
    expect(keys.length).toBe(1)
    expect(json[keys[0]!]).toBe('')
  })

  it('locked=true prevents drop insertion', () => {
    renderDropZone([], 'object', true)
    const text = screen.getByText('Arraste itens para cá')
    const raw = JSON.stringify({ fromPalette: true, paletteType: 'string' })
    const dt = createMockDataTransfer(raw)
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dt, configurable: true })
    text.dispatchEvent(dropEvent)
    expect(useJsonStore.getState().jsonValue).toEqual({})
  })
})
