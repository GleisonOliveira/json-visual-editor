import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { InlineNodeEditor } from '../InlineNodeEditor'
import { ContainerProvider } from '../../../../core/containerContext'
import { container } from '../../../../core/container'
import type { JsonValue } from '../../../../types'

const theme = createTheme()

function renderInlineNodeEditor(value: JsonValue, path: Array<string | number>, locked = false): void {
  render(
    <ContainerProvider value={container}>
      <ThemeProvider theme={theme}>
        <InlineNodeEditor value={value} path={path} locked={locked} />
      </ThemeProvider>
    </ContainerProvider>
  )
}

describe('InlineNodeEditor', () => {
  it('renders TypeSelector + ValueInput for string node', () => {
    renderInlineNodeEditor('hello', ['key'])
    expect(screen.getByText('Texto')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  it('renders TypeSelector + ValueInput for number node', () => {
    renderInlineNodeEditor(42, ['key'])
    expect(screen.getByText('Número')).toBeInTheDocument()
  })

  it('renders TypeSelector + ValueInput for boolean node', () => {
    renderInlineNodeEditor(true, ['key'])
    expect(screen.getByText('Boolean')).toBeInTheDocument()
  })

  it('renders only TypeSelector for object node', () => {
    renderInlineNodeEditor({}, ['key'])
    expect(screen.getByText('Objeto')).toBeInTheDocument()
    const inputs = screen.queryAllByRole('textbox')
    expect(inputs.length).toBe(0)
  })

  it('renders only TypeSelector for array node', () => {
    renderInlineNodeEditor([], ['key'])
    expect(screen.getByText('Array')).toBeInTheDocument()
  })

  it('renders only TypeSelector for null node', () => {
    renderInlineNodeEditor(null, ['key'])
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })
})
