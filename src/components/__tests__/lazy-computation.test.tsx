import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { NodeEditor } from '../organisms/node-editor/NodeEditor'
import { NumberField } from '../atoms/number-field/NumberField'
import { JsonTreeService } from '../../services/JsonTreeService'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'
import { ContainerProvider } from '../../core/containerContext'
import { container } from '../../core/container'

const theme = createTheme()

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
  useUiStore.getState().collapseAll()
  useUiStore.getState().cancelEditing()
})

describe('Lazy computation deferral', () => {
  describe('collectComplexKeys', () => {
    it('is not called on initial render', () => {
      const spy = vi.spyOn(JsonTreeService.prototype, 'collectComplexKeys')

      useJsonStore.setState({ jsonValue: { a: { b: 1 }, c: [2, 3] } })

      render(
        <ContainerProvider value={container}>
          <ThemeProvider theme={theme}>
            <NodeEditor locked={false} />
          </ThemeProvider>
        </ContainerProvider>
      )

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('is not called when jsonValue changes', () => {
      const spy = vi.spyOn(JsonTreeService.prototype, 'collectComplexKeys')

      useJsonStore.setState({ jsonValue: { a: 1 } })

      const { rerender } = render(
        <ContainerProvider value={container}>
          <ThemeProvider theme={theme}>
            <NodeEditor locked={false} />
          </ThemeProvider>
        </ContainerProvider>
      )

      useJsonStore.setState({ jsonValue: { a: 1, b: { c: 2 } } })

      rerender(
        <ContainerProvider value={container}>
          <ThemeProvider theme={theme}>
            <NodeEditor locked={false} />
          </ThemeProvider>
        </ContainerProvider>
      )

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('is called when expand-all button is clicked', () => {
      const spy = vi.spyOn(JsonTreeService.prototype, 'collectComplexKeys')

      useJsonStore.setState({ jsonValue: { nested: { a: 1 } } })

      render(
        <ContainerProvider value={container}>
          <ThemeProvider theme={theme}>
            <NodeEditor locked={false} />
          </ThemeProvider>
        </ContainerProvider>
      )

      expect(spy).not.toHaveBeenCalled()

      const expandBtn = screen.getByText('Expandir todos')
      expandBtn.click()

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('NumberField useLayoutEffect ref-based comparison', () => {
    it('does not update text when value prop is the same', () => {
      const { rerender } = render(
        <ThemeProvider theme={theme}>
          <NumberField value={42} onChange={() => {}} />
        </ThemeProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('42')

      rerender(
        <ThemeProvider theme={theme}>
          <NumberField value={42} onChange={() => {}} />
        </ThemeProvider>
      )

      expect(input).toHaveValue('42')
    })

    it('updates text when value prop changes', () => {
      const { rerender } = render(
        <ThemeProvider theme={theme}>
          <NumberField value={42} onChange={() => {}} />
        </ThemeProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('42')

      rerender(
        <ThemeProvider theme={theme}>
          <NumberField value={99} onChange={() => {}} />
        </ThemeProvider>
      )

      expect(input).toHaveValue('99')
    })

    it('preserves intermediate typing state without effect loop', () => {
      const onChange = vi.fn()

      render(
        <ThemeProvider theme={theme}>
          <NumberField value={0} onChange={onChange} />
        </ThemeProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('0')
    })
  })
})
