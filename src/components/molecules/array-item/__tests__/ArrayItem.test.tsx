import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ArrayItem } from '../ArrayItem'
import { useJsonStore } from '../../../../store/jsonStore'
import { useUiStore } from '../../../../store/uiStore'
import { ContainerProvider } from '../../../../core/containerContext'
import { container } from '../../../../core/container'
import type { JsonValue, JsonArray } from '../../../../types'

const theme = createTheme()

function renderArrayItem(index: number, item: JsonValue, parentPath: Array<string | number> = []): void {
  const arr: JsonArray = [item]
  const { expanded, toggleExpand, expandPath } = useUiStore.getState()
  render(
    <ContainerProvider value={container}>
      <ThemeProvider theme={theme}>
        <ArrayItem
          index={index}
          item={item}
          parentPath={parentPath}
          arr={arr}
          expanded={expanded}
          toggleExpand={toggleExpand}
          expandPath={expandPath}
          renderChildren={() => null}
          locked={false}
        />
      </ThemeProvider>
    </ContainerProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: [] })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

describe('ArrayItem', () => {
  it('renders index label', () => {
    renderArrayItem(0, 'hello')
    expect(screen.getByText('[0]')).toBeInTheDocument()
  })

  it('renders type selector with correct type', () => {
    renderArrayItem(0, 'hello')
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('renders type selector for number values', () => {
    renderArrayItem(0, 42)
    expect(screen.getByText('Número')).toBeInTheDocument()
  })

  it('renders type selector for boolean values', () => {
    renderArrayItem(0, true)
    expect(screen.getByText('Boolean')).toBeInTheDocument()
  })

  it('renders type selector for null values', () => {
    renderArrayItem(0, null)
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })

  it('renders index label for multiple indices', () => {
    renderArrayItem(3, 'item')
    expect(screen.getByText('[3]')).toBeInTheDocument()
  })

  it('delete button removes item from store', () => {
    useJsonStore.setState({ jsonValue: ['a', 'b', 'c'] })
    const fullArr: JsonArray = ['a', 'b', 'c']
    const { expanded, toggleExpand, expandPath } = useUiStore.getState()
    render(
      <ContainerProvider value={container}>
        <ThemeProvider theme={theme}>
          <ArrayItem
            index={1}
            item={'b'}
            parentPath={[]}
            arr={fullArr}
            expanded={expanded}
            toggleExpand={toggleExpand}
            expandPath={expandPath}
            renderChildren={() => null}
            locked={false}
          />
        </ThemeProvider>
      </ContainerProvider>
    )
    const deleteBtn = screen.getAllByRole('button')[0]!
    deleteBtn.click()
    const json = useJsonStore.getState().jsonValue as JsonArray
    expect(json).toEqual(['a', 'c'])
  })

  it('renders expand button for complex values (2 buttons total)', () => {
    renderArrayItem(0, { a: 1 })
    expect(screen.getAllByRole('button').length).toBe(2)
  })

  it('renders only delete button for primitive values (1 button total)', () => {
    renderArrayItem(0, 'text')
    expect(screen.getAllByRole('button').length).toBe(1)
  })

  it('nested ContainerDropZone hidden when collapsed', () => {
    renderArrayItem(0, { a: 1 })
    expect(screen.queryByText('Arraste itens para cá')).not.toBeInTheDocument()
  })

  it('nested ContainerDropZone visible when expanded', () => {
    useUiStore.getState().toggleExpand(JSON.stringify([0]))
    renderArrayItem(0, { a: 1 })
    expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
  })

  it('drag handle has accessible name', () => {
    renderArrayItem(0, 'value')
    const dragHandle = screen.getByRole('img', { name: 'Arrastar para reordenar' })
    expect(dragHandle).toBeInTheDocument()
  })
})
