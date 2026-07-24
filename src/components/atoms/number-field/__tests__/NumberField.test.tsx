import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { NumberField } from '../NumberField'

const theme = createTheme()

function renderNumberField(value: number, onChange: (n: number) => void): void {
  render(
    <ThemeProvider theme={theme}>
      <NumberField value={value} onChange={onChange} />
    </ThemeProvider>
  )
}

describe('NumberField', () => {
  it('renders with initial value', () => {
    renderNumberField(42, () => {})
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('42')
  })

  it('typing updates local text state', async () => {
    const user = userEvent.setup()
    renderNumberField(0, () => {})
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '1')
    expect(input).toHaveValue('1')
  })

  it('blur commits numeric value via onChange', async () => {
    const user = userEvent.setup()
    let committed: number | null = null
    renderNumberField(0, (n) => { committed = n })
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '99')
    await user.tab()
    expect(committed).toBe(99)
  })

  it('blur with invalid input resets to 0', async () => {
    const user = userEvent.setup()
    let committed: number | null = null
    renderNumberField(0, (n) => { committed = n })
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'abc')
    await user.tab()
    expect(committed).toBe(0)
    expect(input).toHaveValue('0')
  })

  it('typing "1." preserves mid-edit state', async () => {
    const user = userEvent.setup()
    renderNumberField(0, () => {})
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '1.')
    expect(input).toHaveValue('1.')
  })
})
