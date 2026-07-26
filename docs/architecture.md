# Architecture

Overall architecture of the JSON Visual Editor: dependency injection, service wiring, state management, and data flow.

**Live site:** https://jsonvisualeditor.com/

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│  main.tsx                                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ContainerProvider (Inversify DI container)          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  App.tsx (MUI ThemeProvider + CssBaseline)      │  │  │
│  │  │  ┌──────────────┬──────────────────────────┐    │  │  │
│  │  │  │ VisualEditor │     JsonPanel             │    │  │  │
│  │  │  │ (left 50%)   │     (right 50%)           │    │  │  │
│  │  │  │  PalettePanel│     CodeMirror             │    │  │  │
│  │  │  │  NodeEditor  │     JsonToolbar             │    │  │  │
│  │  │  └──────────────┴──────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Snackbar + Alert (toast)                       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Injection (Inversify)

### Container Setup

The Inversify container is created in `src/core/container.ts` and provides all application services as singletons:

```ts
// src/core/container.ts
import { Container } from 'inversify'
import { TYPES } from './types'

const container = new Container()

container.bind<JsonTreeService>(TYPES.JsonTreeService)
  .to(JsonTreeService).inSingletonScope()

container.bind<JsonMutationService>(TYPES.JsonMutationService)
  .toDynamicValue(() => new JsonMutationService(new JsonTreeService()))
  .inSingletonScope()

container.bind<JsonValidationService>(TYPES.JsonValidationService)
  .to(JsonValidationService).inSingletonScope()

container.bind<ClipboardService>(TYPES.ClipboardService)
  .to(ClipboardService).inSingletonScope()

container.bind<FileDownloadService>(TYPES.FileDownloadService)
  .to(FileDownloadService).inSingletonScope()

export { container }
```

> **Why no decorators?** The project enables `erasableSyntaxOnly` in TypeScript, which forbids decorator syntax. All bindings use explicit `.to()` and `.toDynamicValue()` instead.

### DI Tokens

All service tokens are defined as Symbols in `src/core/types.ts`:

```ts
export const TYPES = {
  JsonTreeService: Symbol.for('JsonTreeService'),
  JsonMutationService: Symbol.for('JsonMutationService'),
  JsonValidationService: Symbol.for('JsonValidationService'),
  ClipboardService: Symbol.for('ClipboardService'),
  FileDownloadService: Symbol.for('FileDownloadService'),
} as const
```

### React Integration

The container is provided to the React tree via context:

1. **`src/core/diContext.ts`** creates a React context:
   ```ts
   export const ContainerContext = createContext<Container | null>(null)
   ```

2. **`src/core/containerContext.tsx`** provides the `ContainerProvider` wrapper and `useContainer()` hook.

3. **`src/main.tsx`** wraps the app:
   ```tsx
   <ContainerProvider value={container}>
     <App />
   </ContainerProvider>
   ```

4. **Components** resolve services via:
   ```tsx
   const container = useContainer()
   const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
   ```

5. **Stores** resolve services directly from the imported container:
   ```ts
   import { container } from '../../core/container'
   const mutationSvc = container.get<JsonMutationService>(TYPES.JsonMutationService)
   ```

### Why This Pattern?

- **Testability**: Tests create a fresh `Container` with mock bindings
- **No global singletons**: Each test gets its own container instance
- **Explicit wiring**: All dependencies are visible in `container.ts`
- **No decorator magic**: Compatible with `erasableSyntaxOnly`

## Service Layer

Services encapsulate pure business logic. They have no React dependency, no store dependency, and can be tested in isolation.

```
src/services/
├── JsonTreeService.ts        # Tree traversal (get, set, remove, insert)
├── JsonMutationService.ts    # Tree mutations (move, insert, update)
├── JsonValidationService.ts  # Form validation + JSON parsing
├── ClipboardService.ts       # Clipboard API wrapper
└── FileDownloadService.ts    # Browser file download
```

**Dependency graph:**
```
JsonMutationService ──depends──▶ JsonTreeService
JsonValidationService  (standalone)
ClipboardService       (standalone)
FileDownloadService    (standalone)
```

All services use constructor injection. See [services.md](./services.md) for details.

## State Management (Zustand)

Two stores, separated by domain:

```
src/store/
├── jsonStore/        # JSON document state
│   ├── index.ts      # Store creation (useJsonStore)
│   ├── types.ts      # JsonStore type definition
│   └── actions.ts    # Action creators via factory pattern
└── uiStore/          # UI state
    ├── index.ts      # Store creation (useUiStore)
    └── types.ts      # UiStore type definition
```

**Key design decisions:**
- **`jsonStore`** holds the JSON tree (`jsonValue`) and all mutation actions
- **`uiStore`** holds theme, tree expansion, editing mode, toast, and form fields
- **`jsonStore/actions.ts`** uses a factory pattern: `createJsonActions(container)` receives the Inversify container and resolves services internally

See [store.md](./store.md) for details.

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Component (Template + Composable)                       │
│  ├── Composable resolves services via useContainer()     │
│  ├── Composable reads/writes Zustand store              │
│  └── Template renders JSX (no business logic)            │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │  jsonStore  │ │  uiStore   │ │  Services  │
   │  (state +   │ │  (UI state)│ │  (pure     │
   │  actions)   │ │            │ │   logic)   │
   └─────┬──────┘ └────────────┘ └────────────┘
         │                         ▲
         └─────────────────────────┘
           actions.ts calls services
```

### Example: Adding a Field (Desktop)

1. User drags a palette button onto a `ContainerDropZone`
2. `ContainerDropZone` composable reads `dataTransfer` payload
3. Composable calls `jsonStore.handleInsert(paletteType, parentPath, key)`
4. `handleInsert` action calls `mutationSvc.insertFromPalette(root, paletteType, parentPath, key)`
5. `JsonMutationService.insertFromPalette` calls `treeSvc.insertAtPath(...)` to immutably insert the new node
6. `jsonStore` updates `jsonValue` → all subscribed components re-render
7. `JsonPanel` re-renders with the updated formatted JSON

## Responsive Layout

```
Desktop (≥900px):                Mobile (<900px):
┌──────────┬──────────┐         ┌──────────────────┐
│ Visual   │ Json     │         │ Visual           │
│ Editor   │ Panel    │         │ (AddFieldForm)   │
│ (50%)    │ (50%)    │         │ (tree below)     │
└──────────┴──────────┘         ├──────────────────┤
                                │ Json Panel       │
                                │ (icon toolbar)   │
                                └──────────────────┘
```

- **Desktop**: `PalettePanel` visible, `AddFieldForm` hidden, full text toolbar buttons
- **Mobile**: `AddFieldForm` visible, `PalettePanel` hidden, icon-only toolbar buttons

## Entry Point

```tsx
// src/main.tsx
import { container } from './core/container'
import { ContainerProvider } from './core/containerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContainerProvider value={container}>
      <App />
    </ContainerProvider>
  </StrictMode>,
)
```

The container import as a side-effect ensures all bindings are registered before the app renders.
