import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { TypeSelector } from '../TypeSelector'
import { useJsonStore } from '../../../../store/jsonStore'
import { ContainerProvider } from '../../../../core/containerContext'
import { container } from '../../../../core/container'

const theme = createTheme()

function renderTypeSelector(
  path: Array<string | number>,
  nodeType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null',
  locked = false
): void {
  render(
    <ContainerProvider value={container}>
      <ThemeProvider theme={theme}>
        <TypeSelector path={path} nodeType={nodeType} locked={locked} />
      </ThemeProvider>
    </ContainerProvider>
  )
}

beforeEach(() => {
  useJsonStore.setState({ jsonValue: {} })
})

describe('TypeSelector', () => {
  it('renders current type from nodeType prop', () => {
    renderTypeSelector(['key'], 'string')
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('renders with number type', () => {
    renderTypeSelector(['key'], 'number')
    expect(screen.getByText('Número')).toBeInTheDocument()
  })

  it('renders with boolean type', () => {
    renderTypeSelector(['key'], 'boolean')
    expect(screen.getByText('Boolean')).toBeInTheDocument()
  })

  it('renders with object type', () => {
    renderTypeSelector(['key'], 'object')
    expect(screen.getByText('Objeto')).toBeInTheDocument()
  })

  it('renders with array type', () => {
    renderTypeSelector(['key'], 'array')
    expect(screen.getByText('Array')).toBeInTheDocument()
  })

  it('renders with null type', () => {
    renderTypeSelector(['key'], 'null')
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })

  it('is disabled when locked=true', () => {
    renderTypeSelector(['key'], 'string', true)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-disabled', 'true')
  })

  it('is not disabled when locked=false', () => {
    renderTypeSelector(['key'], 'string', false)
    const select = screen.getByRole('combobox')
    expect(select).not.toHaveAttribute('aria-disabled', 'true')
  })
})
