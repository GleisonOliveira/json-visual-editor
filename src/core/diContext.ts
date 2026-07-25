import { createContext } from 'react'
import type { Container } from 'inversify'

/**
 * React context holding the application's Inversify DI container.
 * Used internally by `useContainer` and `ContainerProvider`.
 */
export const ContainerContext = createContext<Container | null>(null)
