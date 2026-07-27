import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { NodeEditor } from '../organisms/node-editor/NodeEditor'
import { VisualEditor } from '../organisms/visual-editor/VisualEditor'
import { TopBar } from '../organisms/top-bar/TopBar'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'
import { ContainerProvider } from '../../core/containerContext'
import { container } from '../../core/container'
import type { JsonArray, JsonObject } from '../../types'

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

function measureRender(fn: () => void): number {
  const start = performance.now()
  fn()

  return performance.now() - start
}

describe('Render performance profiling', () => {
  it('NodeEditor initial render completes within 200ms', () => {
    useJsonStore.setState({ jsonValue: { a: 1, b: 'hello', c: true } })

    const duration = measureRender(() => {
      render(wrap(
        <NodeEditor locked={false} />
      ))
    })

    expect(duration).toBeLessThan(500)
  })

  it('VisualEditor with empty JSON renders quickly', () => {
    useJsonStore.setState({ jsonValue: {} })

    const duration = measureRender(() => {
      render(wrap(
        <VisualEditor />
      ))
    })

    expect(duration).toBeLessThan(200)
  })

  it('VisualEditor with complex nested JSON renders within 500ms', () => {
    const complex: JsonObject = {
      users: [
        { id: 1, name: 'Alice', tags: ['admin', 'user'] },
        { id: 2, name: 'Bob', tags: ['user'] },
      ],
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
        },
      },
      items: [1, 2, 3, 4, 5],
    }

    useJsonStore.setState({ jsonValue: complex })

    const duration = measureRender(() => {
      render(wrap(
        <VisualEditor />
      ))
    })

    expect(duration).toBeLessThan(500)
  })

  it('TopBar renders within 50ms', () => {
    const duration = measureRender(() => {
      render(wrap(
        <TopBar />
      ))
    })

    expect(duration).toBeLessThan(50)
  })

  it('NodeEditor with 10 array items renders within 500ms', () => {
    const arr: JsonArray = Array.from({ length: 10 }, (_, i) => `item-${i}`)

    useJsonStore.setState({ jsonValue: arr })

    const duration = measureRender(() => {
      render(wrap(
        <NodeEditor locked={false} />
      ))
    })

    expect(duration).toBeLessThan(500)
  })

  it('NodeEditor with deeply nested object renders within 500ms', () => {
    const deep: JsonObject = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    }

    useJsonStore.setState({ jsonValue: deep })

    const duration = measureRender(() => {
      render(wrap(
        <NodeEditor locked={false} />
      ))
    })

    expect(duration).toBeLessThan(500)
  })

  it('VisualEditor re-render after state update completes within 300ms', () => {
    useJsonStore.setState({ jsonValue: { key: 'val' } })

    const { rerender } = render(wrap(
      <VisualEditor />
    ))

    const duration = measureRender(() => {
      useJsonStore.setState({ jsonValue: { key: 'updated', extra: 'new' } })
      rerender(wrap(<VisualEditor />))
    })

    expect(duration).toBeLessThan(300)
  })

  it('NodeEditor renders without memoization comparison overhead', () => {
    useJsonStore.setState({ jsonValue: { a: 1, b: 2, c: 3 } })

    const { rerender } = render(wrap(
      <NodeEditor locked={false} />
    ))

    const rerenderDurations: number[] = []

    for (let i = 0; i < 5; i++) {
      const rStart = performance.now()
      rerender(wrap(<NodeEditor locked={false} />))
      rerenderDurations.push(performance.now() - rStart)
    }

    const avgRerender = rerenderDurations.reduce((a, b) => a + b, 0) / rerenderDurations.length

    expect(avgRerender).toBeLessThan(100)
  })

  it('all 5 rapid state updates complete within 1000ms total', () => {
    useJsonStore.setState({ jsonValue: {} })

    const duration = measureRender(() => {
      for (let i = 0; i < 5; i++) {
        useJsonStore.setState({ jsonValue: { counter: i } })
      }
    })

    expect(duration).toBeLessThan(1000)
  })
})
