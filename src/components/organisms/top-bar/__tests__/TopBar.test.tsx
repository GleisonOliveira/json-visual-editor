import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { TopBar } from '../TopBar'
import { useUiStore } from '../../../../store/uiStore'

const theme = createTheme()

function renderTopBar(): void {
  render(
    <ThemeProvider theme={theme}>
      <TopBar />
    </ThemeProvider>
  )
}

beforeEach(() => {
  useUiStore.getState().cancelEditing()
})

describe('TopBar', () => {
  it('renders "JSON Visual Editor" title', () => {
    renderTopBar()
    expect(screen.getByText('JSON Visual Editor')).toBeInTheDocument()
  })

  it('theme toggle button exists and is clickable', () => {
    renderTopBar()
    const button = screen.getByRole('button', { name: /tema/i })
    expect(button).toBeInTheDocument()
  })

  it('GitHub link present with correct href', () => {
    renderTopBar()
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/GleisonOliveira/json-visual-editor')
  })
})
