import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'
import { ContainerProvider } from '../../core/containerContext'
import { container } from '../../core/container'

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

describe('Targeted action selectors prevent re-renders', () => {
  it('function-only selector (handleUpdate) does not re-render on jsonValue changes', () => {
    let renderCount = 0

    function TrackHandleUpdate(): null {
      const handleUpdate = useJsonStore((s) => s.handleUpdate)

      renderCount++
      void handleUpdate

      return null
    }

    render(wrap(<TrackHandleUpdate />))
    const countAfterMount = renderCount

    useJsonStore.setState({ jsonValue: { a: 1 } })
    useJsonStore.setState({ jsonValue: { b: 2 } })

    expect(renderCount).toBe(countAfterMount)
  })

  it('function-only selector (handleInsert) does not re-render on unrelated state', () => {
    let renderCount = 0

    function TrackHandleInsert(): null {
      const handleInsert = useJsonStore((s) => s.handleInsert)

      renderCount++
      void handleInsert

      return null
    }

    render(wrap(<TrackHandleInsert />))
    const countAfterMount = renderCount

    useJsonStore.setState({ jsonValue: { x: 1 } })

    expect(renderCount).toBe(countAfterMount)
  })

  it('expanded Set remains referentially stable across toggle', () => {
    const refs: Array<Set<string>> = []

    function TrackExpanded(): null {
      const expanded = useUiStore((s) => s.expanded)

      refs.push(expanded)

      return null
    }

    render(wrap(<TrackExpanded />))

    useUiStore.getState().toggleExpand('a')
    useUiStore.getState().toggleExpand('b')
    useUiStore.getState().toggleExpand('a')

    for (let i = 1; i < refs.length; i++) {
      expect(refs[i]).toBe(refs[0])
    }
  })

  it('toggleExpand is stable across re-renders', () => {
    const refs: Array<unknown> = []

    function TrackToggleExpand(): null {
      const toggleExpand = useUiStore((s) => s.toggleExpand)

      refs.push(toggleExpand)

      return null
    }

    const { rerender } = render(wrap(<TrackToggleExpand />))

    for (let i = 0; i < 5; i++) {
      rerender(wrap(<TrackToggleExpand />))
    }

    for (let i = 1; i < refs.length; i++) {
      expect(refs[i]).toBe(refs[0])
    }
  })

  it('action-only selector (cancelEditing) does not re-render on toast changes', () => {
    let renderCount = 0

    function TrackCancelEditing(): null {
      const cancelEditing = useUiStore((s) => s.cancelEditing)

      renderCount++
      void cancelEditing

      return null
    }

    render(wrap(<TrackCancelEditing />))
    const countAfterMount = renderCount

    useUiStore.getState().setToast({ msg: 'test', severity: 'success' })

    expect(renderCount).toBe(countAfterMount)
  })

  it('repeated setJsonValue with same shape returns consistent results', () => {
    useJsonStore.setState({ jsonValue: { x: 1 } })

    const val1 = useJsonStore.getState().jsonValue

    useJsonStore.setState({ jsonValue: { x: 1 } })

    const val2 = useJsonStore.getState().jsonValue

    expect(val2).toEqual(val1)
  })

  it('collapseAll produces a new Set instance', () => {
    useUiStore.getState().toggleExpand('a')

    const before = useUiStore.getState().expanded

    useUiStore.getState().collapseAll()

    const after = useUiStore.getState().expanded

    expect(after.size).toBe(0)
    expect(after).not.toBe(before)
  })
})
