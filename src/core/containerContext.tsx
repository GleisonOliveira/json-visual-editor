import type { Container } from 'inversify'
import { ContainerContext } from './diContext'

/**
 * Provider component that makes the Inversify container available
 * to all descendant components via `useContainer()`.
 *
 * @param props.value - The Inversify container instance to provide.
 * @param props.children - React children to render inside the provider.
 */
export function ContainerProvider(props: {
  value: Container
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <ContainerContext.Provider value={props.value}>
      {props.children}
    </ContainerContext.Provider>
  )
}
