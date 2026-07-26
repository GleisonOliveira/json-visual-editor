import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Container } from 'inversify'
import { ContainerProvider } from '../containerContext'
import { useContainer } from '../../useContainer'
import { TYPES } from '../types'
import { JsonTreeService } from '../../services/JsonTreeService'

function TestComponent(): React.JSX.Element {
  const container = useContainer()
  const svc = container.get<JsonTreeService>(TYPES.JsonTreeService)

  return <div data-testid="svc-type">{svc.constructor.name}</div>
}

describe('ContainerContext', () => {
  it('throws when useContainer is used outside provider', () => {
    expect(() => render(<TestComponent />)).toThrow(
      'useContainer() must be used within a <ContainerProvider>'
    )
  })

  it('provides container to children', () => {
    const container = new Container()
    container.bind<JsonTreeService>(TYPES.JsonTreeService).to(JsonTreeService)

    const { getByTestId } = render(
      <ContainerProvider value={container}>
        <TestComponent />
      </ContainerProvider>
    )

    expect(getByTestId('svc-type')).toHaveTextContent('JsonTreeService')
  })

  it('resolves the same instance from the provided container', () => {
    const container = new Container()
    container.bind<JsonTreeService>(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()

    const directResolve = container.get<JsonTreeService>(TYPES.JsonTreeService)

    function CaptureComponent(): React.JSX.Element {
      const c = useContainer()
      const svc = c.get<JsonTreeService>(TYPES.JsonTreeService)
      const isSame = svc === directResolve

      return <div data-testid="is-same">{String(isSame)}</div>
    }

    const { getByTestId } = render(
      <ContainerProvider value={container}>
        <CaptureComponent />
      </ContainerProvider>
    )

    expect(getByTestId('is-same')).toHaveTextContent('true')
  })
})
