import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ValueInput } from '../ValueInput'

const theme = createTheme()

function renderValueInput(
  value: unknown,
  path: Array<string | number>,
  nodeType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null',
  locked = false
): void {
  render(
    <ThemeProvider theme={theme}>
      <ValueInput value={value} path={path} nodeType={nodeType} locked={locked} />
    </ThemeProvider>
  )
}

describe('ValueInput', () => {
  it('renders TextField for string type', () => {
    renderValueInput('hello', ['key'], 'string')
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('hello')
  })

  it('renders NumberField for number type', () => {
    renderValueInput(42, ['key'], 'number')
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('42')
  })

  it('renders Select for boolean type', () => {
    renderValueInput(true, ['key'], 'boolean')
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('renders nothing for object type', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ValueInput value={{}} path={['key']} nodeType="object" locked={false} />
      </ThemeProvider>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for array type', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ValueInput value={[]} path={['key']} nodeType="array" locked={false} />
      </ThemeProvider>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for null type', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ValueInput value={null} path={['key']} nodeType="null" locked={false} />
      </ThemeProvider>
    )
    expect(container.innerHTML).toBe('')
  })

  it('disabled when locked=true', () => {
    renderValueInput('hello', ['key'], 'string', true)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})
