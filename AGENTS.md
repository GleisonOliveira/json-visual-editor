# AGENTS.md — Guide for AI Assistants

Context and conventions for AI agents assisting with this project.

## About the Project

Visual JSON editor with drag-and-drop interface. Users can edit JSON via a code panel (CodeMirror) or via a graphical interface (draggable nodes), with bidirectional synchronization between the two panels.

**Live site:** https://jsonvisualeditor.com/

## Stack

- **React 19** + **TypeScript 6**
- **Vite 8** as bundler
- **MUI v9** (Material UI) + **Emotion** for UI
- **Zustand** for global state management
- **CodeMirror 6** for JSON code editing
- **AJV** + **Zod** for validation
- **Inversify** for dependency injection (DI)
- **Vitest** + **@testing-library/react** for testing
- **ESLint 10** + **typescript-eslint** for linting

## Folder Structure (Atomic Design)

```
src/
├── core/                    # DI infrastructure (Inversify container, tokens, context)
│   ├── container.ts         # Inversify container with all service bindings
│   ├── containerContext.tsx  # React Context provider for the container
│   ├── diContext.ts          # ContainerContext creation
│   └── types.ts             # DI token Symbols
├── components/
│   ├── atoms/               # Smallest reusable UI units
│   │   ├── container-drop-zone/   # Drop zone for palette and node moves
│   │   ├── number-field/          # Numeric input with mid-edit preservation
│   │   ├── palette-button/        # Draggable type button (string, number, etc.)
│   │   ├── type-selector/         # Dropdown for selecting node types
│   │   └── value-input/           # Input for string/number/boolean values
│   ├── molecules/           # Composed atoms with business logic
│   │   ├── add-field-form/        # Mobile form for adding fields
│   │   ├── array-item/            # Array item node with controls
│   │   ├── inline-node-editor/    # Type selector + value input combo
│   │   ├── json-toolbar/          # Action buttons (Edit, Copy, Download, etc.)
│   │   ├── object-item/           # Object property node with controls
│   │   └── palette-panel/         # Grid of draggable palette buttons
│   └── organisms/           # Complex UI composed of molecules
│       ├── json-panel/            # Read-only JSON display + editing mode
│       ├── node-editor/           # Recursive tree renderer
│       ├── top-bar/               # Header with theme toggle + GitHub link
│       └── visual-editor/         # Left panel (palette + tree)
├── hooks/                   # Reusable generic hooks
├── lib/                     # Pure utilities (no side effects)
├── services/                # Service classes (pure logic, constructor DI)
│   ├── ClipboardService.ts
│   ├── FileDownloadService.ts
│   ├── JsonMutationService.ts
│   ├── JsonTreeService.ts
│   └── JsonValidationService.ts
├── store/                   # Zustand stores
│   ├── jsonStore/           # JSON tree state + actions
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── actions.ts       # Actions created via factory pattern
│   └── uiStore/             # UI state (panels, modals, selection)
│       ├── index.ts
│       └── types.ts
├── types/                   # Shared TypeScript types
├── assets/                  # Images and static resources
├── test/                    # Test setup
│   └── setup.ts
├── useContainer.ts          # Hook to resolve services from DI container
├── App.tsx
├── main.tsx
└── theme.ts
```

## Dependency Injection (DI)

All services are registered in `src/core/container.ts` using Inversify with explicit `to` bindings (no decorators — `erasableSyntaxOnly` forbids them). Each service is a singleton.

**Resolution pattern in components:**
```tsx
import { useContainer } from '../../useContainer'
import { TYPES } from '../../core/types'
import type { JsonTreeService } from '../../services/JsonTreeService'

const container = useContainer()
const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
```

**Resolution pattern in stores:**
```ts
import { container } from '../../core/container'
import { TYPES } from '../../core/types'

const mutationSvc = container.get<JsonMutationService>(TYPES.JsonMutationService)
```

**Resolution pattern in tests:**
```tsx
import { Container } from 'inversify'
import { ContainerProvider } from '../../core/containerContext'

const testContainer = new Container()
testContainer.bind(TYPES.JsonTreeService).to(MockJsonTreeService).inSingletonScope()

render(<ContainerProvider value={testContainer}><MyComponent /></ContainerProvider>)
```

## Component Conventions

### Template + Composable Pattern

Every component lives in its own subdirectory with a template file and a composable hook:

```
component-name/
├── ComponentName.tsx      # Template: JSX only, calls composable
├── useComponentName.ts    # Composable: state, effects, handlers
└── __tests__/
    └── ComponentName.test.tsx
```

- **Template** (`ComponentName.tsx`): Pure JSX rendering. Calls the composable for state and handlers. No business logic.
- **Composable** (`useComponentName.ts`): Contains all state (`useState`, `useEffect`), event handlers, and service resolution via DI. Exclusive to the template — not shared globally.

If logic needs to be shared, move it to `src/hooks/`.

### Props vs. Store Access

Components should **avoid** receiving props and callbacks as much as possible. Prefer consuming the Zustand store directly:

- **Prefer**: `const { value, setValue } = useJsonStore()`
- **Avoid**: `<Component value={x} onChange={fn} />`

Props are acceptable only when:
- The component is genuinely generic and reusable outside the app context
- The value comes from a local iteration (e.g., map of a list)
- The prop is visual configuration (e.g., `size`, `variant`)

Never pass store actions as props — consume the store directly in the component that needs the action.

## Service Conventions

### Service Classes

Each service class lives in `src/services/` and encapsulates a single responsibility:

| Service | Responsibility |
|---------|---------------|
| `JsonTreeService` | Pure tree traversal: get, set, remove, insert at path, type guards |
| `JsonMutationService` | Tree mutations: move, insert from palette, apply form insert |
| `JsonValidationService` | Form validation and JSON string parsing |
| `ClipboardService` | Wrapper around `navigator.clipboard.writeText()` |
| `FileDownloadService` | Browser file download via Blob + anchor click |

### Constructor Injection

Services that depend on other services receive them via constructor:

```ts
export class JsonMutationService {
  readonly tree: JsonTreeService
  constructor(tree: JsonTreeService) {
    this.tree = tree
  }
}
```

### Adding a New Service

1. Create `src/services/MyService.ts` with a class
2. Add a DI token in `src/core/types.ts`
3. Bind it in `src/core/container.ts`
4. Create `src/services/__tests__/MyService.test.ts`
5. Resolve via `useContainer().get<TYPES.MyService>(TYPES.MyService)` in components

## Store Conventions

### Stores Should Be Concise

Each store has a single responsibility and should be small. Never accumulate unrelated actions in one store.

### Action Splitting

When a store accumulates many actions, split them into separate files:

```
store/jsonStore/
├── index.ts           # State + selectors (creates the store)
├── types.ts           # TypeScript types
├── actions.ts         # Action creators (factory pattern with DI)
└── __tests__/
    └── actions.test.ts
```

The `actions.ts` file exports a `createJsonActions(container)` factory function. The `index.ts` calls it and passes the result to the Zustand store.

### Domain Separation

| Store | Responsibility |
|-------|---------------|
| `jsonStore` | JSON tree, parsing, validation |
| `uiStore` | UI state: active panel, selected node, modals, theme, form fields |

Never mix domain state with UI state in the same store.

## Testing Conventions

### Test Framework

- **Vitest** with jsdom environment
- **@testing-library/react** for component rendering
- **@testing-library/jest-dom** for DOM matchers
- **@testing-library/user-event** for simulating user interactions

### Test Organization

- Unit tests for services: `src/services/__tests__/ServiceName.test.ts`
- Behavioral tests for components: `src/components/atoms/foo/__tests__/Foo.test.tsx`
- State tests for stores: `src/store/barStore/__tests__/barStore.test.ts`

### Component Test Pattern

Every component test must wrap renders in a `ContainerProvider` with a fresh test container:

```tsx
import { Container } from 'inversify'
import { ContainerProvider } from '../../../core/containerContext'
import { TYPES } from '../../../core/types'
import { JsonTreeService } from '../../../services/JsonTreeService'
import { JsonMutationService } from '../../../services/JsonMutationService'

function renderWithProviders(ui: React.ReactNode): RenderResult {
  const container = new Container()
  container.bind(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()
  container.bind(TYPES.JsonMutationService).toDynamicValue(() => new JsonMutationService(new JsonTreeService())).inSingletonScope()

  return render(<ContainerProvider value={container}>{ui}</ContainerProvider>)
}
```

### Test Coverage

Every file created/modified must have a corresponding test file. Per-file coverage is enforced.

### Running Tests

```bash
npm run test          # Run all tests once
npm run test:watch    # Run in watch mode
npm run test:coverage # Run with coverage report
```

## Documentation Conventions

Every component, class, function, and type/interface **must** have a JSDoc comment explaining **how** it is used and **why** it exists:

- **Components** (`Foo.tsx`): JSDoc on the component describing its role in the atomic design hierarchy, what it renders, and when to use it.
- **Classes** (services): JSDoc on the class explaining its responsibility, and JSDoc on each public method explaining parameters, return value, and usage context.
- **Functions** (hooks, composables, utilities): JSDoc describing purpose, parameters, return value, and side effects (if any).
- **Types/Interfaces**: JSDoc explaining what the type represents and where it is used.
- **Constants/Symbols**: JSDoc explaining the value and its role (e.g., DI tokens).

Rules:
- Comments must be in **English**.
- Use `/** ... */` JSDoc format (not `//` line comments).
- Do NOT document trivial getters/setters or obvious one-liners — focus on **why**, not **what**.

## Documentation Files

- `docs/architecture.md` — DI container, service wiring, overall architecture
- `docs/components.md` — Atomic design, template+composable pattern, adding new components
- `docs/testing.md` — Vitest setup, test conventions, writing behavioral tests
- `docs/services.md` — Service classes, DI tokens, adding new services
- `docs/store.md` — Store conventions, action splitting, domain separation
- `doc/user-flows-mapping.md` — Complete user flows, actions, and scenarios mapping

## Running Commands

```bash
npm run test          # Run all tests
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint (zero warnings)
npm run build         # Production build
```

All four commands must pass with zero failures before any phase is considered complete.
