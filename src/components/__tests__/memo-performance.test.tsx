import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ObjectItem } from '../molecules/object-item/ObjectItem'
import { ArrayItem } from '../molecules/array-item/ArrayItem'
import { ValueInput } from '../atoms/value-input/ValueInput'
import { TypeSelector } from '../atoms/type-selector/TypeSelector'
import { ContainerDropZone } from '../atoms/container-drop-zone/ContainerDropZone'
import { PaletteButton } from '../atoms/palette-button/PaletteButton'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'
import { ContainerProvider } from '../../core/containerContext'
import { container } from '../../core/container'
import type { JsonObject, JsonArray } from '../../types'

const theme = createTheme()

function wrap(ui: ReactNode): React.JSX.Element {
  return (
    <ContainerProvider value={container}>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </ContainerProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

describe('React.memo prevents unnecessary re-renders', () => {
  describe('ObjectItem memo comparator', () => {
    it('renders with correct props on initial mount', () => {
      const obj: JsonObject = { alpha: 'hello' }
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ObjectItem objKey="alpha" value="hello" parentPath={[]} obj={obj} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByDisplayValue('alpha')).toBeInTheDocument()
    })

    it('updates display when value prop changes', () => {
      const obj: JsonObject = { key: 'old' }
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      const { rerender } = render(wrap(
        <ObjectItem objKey="key" value="old" parentPath={[]} obj={obj} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByDisplayValue('old')).toBeInTheDocument()

      const newObj: JsonObject = { key: 'new' }

      rerender(wrap(
        <ObjectItem objKey="key" value="new" parentPath={[]} obj={newObj} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByDisplayValue('new')).toBeInTheDocument()
    })

    it('renders with different parentPath segments', () => {
      const obj: JsonObject = { child: 'val' }
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ObjectItem objKey="child" value="val" parentPath={['root']} obj={obj} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByDisplayValue('child')).toBeInTheDocument()
    })

    it('renders with different locked states', () => {
      const obj: JsonObject = { key: 'val' }
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ObjectItem objKey="key" value="val" parentPath={[]} obj={obj} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={true} />
      ))

      expect(screen.getByDisplayValue('key')).toBeDisabled()
    })
  })

  describe('ArrayItem memo comparator', () => {
    it('renders with correct index and item', () => {
      const arr: JsonArray = ['first', 'second']
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ArrayItem index={0} item="first" parentPath={[]} arr={arr} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByText('[0]')).toBeInTheDocument()
    })

    it('renders different indices correctly', () => {
      const arr: JsonArray = ['a', 'b', 'c']
      const expanded = new Set<string>()

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ArrayItem index={2} item="c" parentPath={[]} arr={arr} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByText('[2]')).toBeInTheDocument()
    })

    it('renders with expanded Set containing items', () => {
      const arr: JsonArray = [1, 2, 3]

      const toggleExpand = (): void => {}

      const expandPath = (): void => {}

      const renderChildren = (): null => null

      render(wrap(
        <ArrayItem index={0} item={1} parentPath={[]} arr={arr} expanded={new Set(['x'])} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={false} />
      ))

      expect(screen.getByText('[0]')).toBeInTheDocument()
    })
  })

  describe('ValueInput memo comparator', () => {
    it('renders string value correctly', () => {
      render(wrap(
        <ValueInput value="hello" path={['key']} nodeType="string" locked={false} />
      ))

      expect(screen.getByRole('textbox')).toHaveValue('hello')
    })

    it('renders number value correctly', () => {
      render(wrap(
        <ValueInput value={42} path={['key']} nodeType="number" locked={false} />
      ))

      expect(screen.getByRole('textbox')).toHaveValue('42')
    })

    it('renders boolean value correctly', () => {
      render(wrap(
        <ValueInput value={true} path={['key']} nodeType="boolean" locked={false} />
      ))

      expect(screen.getByText('true')).toBeInTheDocument()
    })

    it('returns null for object type', () => {
      const { container: el } = render(wrap(
        <ValueInput value={{}} path={['key']} nodeType="object" locked={false} />
      ))

      expect(el.innerHTML).toBe('')
    })
  })

  describe('TypeSelector memo comparator', () => {
    it('renders string type selector', () => {
      render(wrap(
        <TypeSelector path={['k']} nodeType="string" locked={false} />
      ))

      expect(screen.getByText('Texto')).toBeInTheDocument()
    })

    it('renders number type selector', () => {
      render(wrap(
        <TypeSelector path={['k']} nodeType="number" locked={false} />
      ))

      expect(screen.getByText('Número')).toBeInTheDocument()
    })

    it('renders boolean type selector', () => {
      render(wrap(
        <TypeSelector path={['k']} nodeType="boolean" locked={false} />
      ))

      expect(screen.getByText('Boolean')).toBeInTheDocument()
    })
  })

  describe('ContainerDropZone memo comparator', () => {
    it('renders drop zone text', () => {
      render(wrap(
        <ContainerDropZone parentPath={['items']} parentKind="array" />
      ))

      expect(screen.getByText('Arraste itens para cá')).toBeInTheDocument()
    })
  })

  describe('PaletteButton memo', () => {
    it('renders button with type text', () => {
      render(wrap(
        <PaletteButton type="string" icon={<span>icon</span>} disabled={false} />
      ))

      expect(screen.getByText('string')).toBeInTheDocument()
    })

    it('renders disabled state', () => {
      render(wrap(
        <PaletteButton type="string" icon={<span>icon</span>} disabled={true} />
      ))

      const btn = screen.getByRole('button')
      expect(btn).toBeDisabled()
    })
  })

  describe('App.tsx toast handler stability', () => {
    it('setToast selector returns stable reference across renders', () => {
      const refs: Array<unknown> = []

      function TrackSetToast(): null {
        const setToast = useUiStore((s) => s.setToast)

        refs.push(setToast)

        return null
      }

      const { rerender } = render(wrap(<TrackSetToast />))

      for (let i = 0; i < 5; i++) {
        useUiStore.getState().setToast({ msg: `toast ${i}`, severity: 'success' })
        rerender(wrap(<TrackSetToast />))
      }

      for (let i = 1; i < refs.length; i++) {
        expect(refs[i]).toBe(refs[0])
      }
    })
  })
})
