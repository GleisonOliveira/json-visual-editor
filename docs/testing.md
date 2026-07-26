# Testing

Vitest setup, test conventions, writing behavioral tests, and the `ContainerProvider` pattern.

**Live site:** https://jsonvisualeditor.com/

---

## Test Framework

- **Vitest** — fast, Vite-native test runner
- **jsdom** — browser environment simulation
- **@testing-library/react** — component rendering and querying
- **@testing-library/jest-dom** — DOM assertion matchers
- **@testing-library/user-event** — simulating user interactions

### Configuration

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
```

### Running Tests

```bash
npm run test          # Run all tests once
npm run test:watch    # Run in watch mode
npm run test:coverage # Run with coverage report
```

## Test Organization

| Type | Location | What to test |
|------|----------|-------------|
| Unit tests | `src/services/__tests__/ServiceName.test.ts` | Service methods: happy path, edge cases, error paths |
| Behavioral tests | `src/components/atoms/foo/__tests__/Foo.test.tsx` | Rendering, interactions, store state changes |
| State tests | `src/store/barStore/__tests__/barStore.test.ts` | State mutations, action correctness |
| Integration tests | `src/core/__tests__/container.test.ts` | DI container bindings, resolution |

## Component Test Pattern

### The Problem

Components resolve services from the Inversify DI container via `useContainer()`. In tests, we need to provide a container with mock or real service bindings.

### The Solution: `ContainerProvider`

Every component test must wrap renders in a `ContainerProvider` with a fresh test container:

```tsx
import { render, screen } from '@testing-library/react'
import { Container } from 'inversify'
import { ContainerProvider } from '../../../core/containerContext'
import { TYPES } from '../../../core/types'
import { JsonTreeService } from '../../../services/JsonTreeService'
import { JsonMutationService } from '../../../services/JsonMutationService'

function renderWithProviders(ui: React.ReactNode) {
  const container = new Container()
  container.bind(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()
  container.bind(TYPES.JsonMutationService).toDynamicValue(
    () => new JsonMutationService(new JsonTreeService())
  ).inSingletonScope()

  return render(<ContainerProvider value={container}>{ui}</ContainerProvider>)
}

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### What to Bind

Not all tests need all services. Bind only what the component under test actually uses:

| Component | Services needed |
|-----------|----------------|
| `TypeSelector` | `JsonTreeService`, `JsonMutationService` |
| `ValueInput` | `JsonTreeService` |
| `PaletteButton` | None (reads uiStore directly) |
| `ContainerDropZone` | `JsonTreeService` |
| `ObjectItem` | `JsonTreeService`, `JsonMutationService` |
| `ArrayItem` | `JsonTreeService`, `JsonMutationService` |
| `NodeEditor` | `JsonTreeService`, `JsonMutationService` |
| `JsonToolbar` | `JsonTreeService`, `JsonValidationService`, `ClipboardService`, `FileDownloadService` |
| `AddFieldForm` | `JsonTreeService`, `JsonMutationService`, `JsonValidationService` |

### Mocking Services

For unit tests that need to verify component behavior without real service logic:

```tsx
class MockJsonTreeService extends JsonTreeService {
  override getAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
    return { mock: true }
  }
}

const container = new Container()
container.bind(TYPES.JsonTreeService).toDynamicValue(() => new MockJsonTreeService()).inSingletonScope()
```

## Test Structure

### Behavioral Test Template

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Container } from 'inversify'
import { ContainerProvider } from '../../../core/containerContext'
import { TYPES } from '../../../core/types'
import { JsonTreeService } from '../../../services/JsonTreeService'
import { JsonMutationService } from '../../../services/JsonMutationService'
import { JsonValidationService } from '../../../services/JsonValidationService'
import { ClipboardService } from '../../../services/ClipboardService'
import { FileDownloadService } from '../../../services/FileDownloadService'
import { MyComponent } from '../MyComponent'

function renderWithProviders(ui: React.ReactNode) {
  const container = new Container()
  container.bind(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()
  container.bind(TYPES.JsonMutationService).toDynamicValue(
    () => new JsonMutationService(new JsonTreeService())
  ).inSingletonScope()
  container.bind(TYPES.JsonValidationService).to(JsonValidationService).inSingletonScope()
  container.bind(TYPES.ClipboardService).to(ClipboardService).inSingletonScope()
  container.bind(TYPES.FileDownloadService).to(FileDownloadService).inSingletonScope()
  return render(<ContainerProvider value={container}>{ui}</ContainerProvider>)
}

describe('MyComponent', () => {
  it('renders all UI elements', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('interacts with user events', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)
    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

### Service Test Template

```ts
import { describe, it, expect } from 'vitest'
import { JsonTreeService } from '../JsonTreeService'

describe('JsonTreeService', () => {
  const svc = new JsonTreeService()

  describe('getAtPath', () => {
    it('returns root value for empty path', () => {
      expect(svc.getAtPath({ a: 1 }, [])).toEqual({ a: 1 })
    })

    it('returns nested value', () => {
      expect(svc.getAtPath({ a: { b: 2 } }, ['a', 'b'])).toBe(2)
    })
  })
})
```

### Store Test Template

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useJsonStore } from '../jsonStore'

describe('jsonStore', () => {
  beforeEach(() => {
    useJsonStore.setState({ jsonValue: {} })
  })

  it('setJsonValue replaces root', () => {
    useJsonStore.getState().setJsonValue(() => ({ hello: 'world' }))
    expect(useJsonStore.getState().jsonValue).toEqual({ hello: 'world' })
  })
})
```

## What to Test

### Components

- **Rendering**: correct UI elements are present
- **User interactions**: clicks, typing, blur produce expected store changes
- **Store state changes**: store updates are reflected in the UI
- **Disabled/locked states**: `editingJson=true` disables all controls
- **Responsive behavior**: mobile vs desktop layout (use `useMediaQuery` mock)

### Services

- **Happy path**: normal usage works correctly
- **Edge cases**: empty inputs, boundary values, empty arrays/objects
- **Error paths**: invalid inputs produce expected errors
- **Type guards**: `isObject`, `isArray`, `isPalettePayload` correctly narrow types

### Stores

- **State mutations**: each action produces the expected next state
- **Action splitting**: factory pattern resolves services correctly
- **Domain separation**: no cross-store dependencies

## Assertions

Use `@testing-library/jest-dom` matchers:

```ts
expect(element).toBeInTheDocument()
expect(element).toBeDisabled()
expect(element).toHaveTextContent('hello')
expect(element).toHaveValue('test')
expect(element).toHaveClass('active')
expect(element).toBeVisible()
```

Use `userEvent` for interactions:

```ts
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'hello')
await user.tab()  // trigger blur
```

## Per-File Coverage Requirement

Every source file **must** have a corresponding test file:

| Source file | Test file |
|-------------|-----------|
| `src/services/FooService.ts` | `src/services/__tests__/FooService.test.ts` |
| `src/components/atoms/foo/Foo.tsx` | `src/components/atoms/foo/__tests__/Foo.test.tsx` |
| `src/store/barStore/index.ts` | `src/store/barStore/__tests__/barStore.test.ts` |
| `src/core/container.ts` | `src/core/__tests__/container.test.ts` |

## Verification

All tests must pass before any phase is complete:

```bash
npm run test          # All tests pass, 0 failures
npm run typecheck     # Zero type errors
npm run lint          # Zero warnings (--max-warnings 0)
npm run build         # Production build succeeds
```
