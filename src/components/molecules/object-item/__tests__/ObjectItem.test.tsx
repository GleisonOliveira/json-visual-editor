import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ObjectItem } from '../ObjectItem'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'
import type { JsonValue, JsonObject } from '../../../../types'

const theme = createTheme()

function renderObjectItem(objKey: string, value: JsonValue, parentPath: Array<string | number> = []): void {
  const obj: JsonObject = { [objKey]: value }
  const { expanded, toggleExpand, expandPath } = useUiStore.getState()
  render(
    <ThemeProvider theme={theme}>
      <ObjectItem
        objKey={objKey}
        value={value}
        parentPath={parentPath}
        obj={obj}
        expanded={expanded}
        toggleExpand={toggleExpand}
        expandPath={expandPath}
        renderChildren={() => null}
        locked={false}
      />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

describe('ObjectItem', () => {
  it('renders key input with default value', () => {
    renderObjectItem('myKey', 'hello')
    expect(screen.getByDisplayValue('myKey')).toBeInTheDocument()
  })

  it('renders type selector with correct type for string', () => {
    renderObjectItem('myKey', 'hello')
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('renders type selector for number values', () => {
    renderObjectItem('count', 42)
    expect(screen.getByText('Número')).toBeInTheDocument()
  })

  it('renders type selector for boolean values', () => {
    renderObjectItem('flag', true)
    expect(screen.getByText('Boolean')).toBeInTheDocument()
  })

  it('renders delete button', () => {
    renderObjectItem('test', 'value')
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('delete button removes key from store', () => {
    useJsonStore.setState({ jsonValue: { myKey: 'hello' } })
    renderObjectItem('myKey', 'hello')
    const deleteBtn = screen.getAllByRole('button')[0]!
    deleteBtn.click()
    const json = useJsonStore.getState().jsonValue as JsonObject
    expect(json['myKey']).toBeUndefined()
  })

  it('renders expand button for complex values (2 buttons total)', () => {
    renderObjectItem('nested', { a: 1 })
    expect(screen.getAllByRole('button').length).toBe(2)
  })

  it('renders only delete button for primitive values (1 button total)', () => {
    renderObjectItem('simple', 'text')
    expect(screen.getAllByRole('button').length).toBe(1)
  })

  it('nested ContainerDropZone hidden when collapsed', () => {
    renderObjectItem('nested', { a: 1 })
    expect(screen.queryByText('Arraste itens para cá')).not.toBeInTheDocument()
  })

  it('nested ContainerDropZone visible when expanded', () => {
    useUiStore.getState().toggleExpand(JSON.stringify(['nested']))
    renderObjectItem('nested', { a: 1 })
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })
})
