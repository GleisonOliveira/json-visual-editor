import { useContext } from 'react'
import type { Container } from 'inversify'
import { ContainerContext } from './core/diContext'

/**
 * Hook that returns the Inversify container from the nearest
 * `ContainerProvider` ancestor. Must be used inside a `ContainerProvider`.
 *
 * @returns The Inversify container instance.
 * @throws If used outside a `ContainerProvider`.
 */
export function useContainer(): Container {
  const container = useContext(ContainerContext)

  if (!container) {

    throw new Error('useContainer() must be used within a <ContainerProvider>')
  }

  return container
}
