# Stores

Zustand store conventions, action splitting, domain separation, and adding new stores.

**Live site:** https://jsonvisualeditor.com/

---

## Overview

Two Zustand stores, separated by domain:

| Store | Responsibility |
|-------|---------------|
| `jsonStore` | JSON tree state, parsing, validation |
| `uiStore` | UI state: theme, tree expansion, editing mode, toast, form fields |

**Rule:** Never mix domain state with UI state in the same store.

## Store Structure

```
src/store/
├── jsonStore/
│   ├── index.ts           # Store creation (useJsonStore)
│   ├── types.ts           # JsonStore type definition
│   ├── actions.ts         # Action creators (factory pattern with DI)
│   └── __tests__/
│       └── actions.test.ts
└── uiStore/
    ├── index.ts           # Store creation (useUiStore)
    ├── types.ts           # UiStore type definition
    └── __tests__/
        └── uiStore.test.ts
```

## `jsonStore` — JSON Document State

### State

```ts
type JsonStore = {
  jsonValue: JsonValue          // The root JSON tree
  setJsonValue: (updater) => void
  handleUpdate: (path, next) => void
  handleMove: (payload, toParentPath, toKey) => void
  handleInsert: (paletteType, toParentPath, toKey) => void
  handleApplyInsert: (target, name, type, insertValue) => void
}
```

### Actions

| Action | Purpose |
|--------|---------|
| `setJsonValue` | Replace entire JSON root (used by JSON edit validation) |
| `handleUpdate` | Update a single node at a path |
| `handleMove` | Move a node from one position to another (drag-and-drop reorder) |
| `handleInsert` | Insert a new node from the type palette (drag-and-drop from palette) |
| `handleApplyInsert` | Insert a new field via the AddFieldForm (mobile) |

### Factory Pattern

Actions are created via a factory function that receives the Inversify container:

```ts
// src/store/jsonStore/actions.ts
export function createJsonActions(appContainer: Container): JsonActions {
  const mutationSvc = appContainer.get<JsonMutationService>(TYPES.JsonMutationService)

  return {
    setJsonValue: (prev, updater) => updater(prev),
    handleUpdate: (prev, path, next) => mutationSvc.updatePrimitive(prev, path, next),
    handleMove: (prev, payload, toParentPath, toKey) =>
      mutationSvc.moveNode(prev, payload, toParentPath, toKey),
    handleInsert: (prev, paletteType, toParentPath, toKey) =>
      mutationSvc.insertFromPalette(prev, paletteType, toParentPath, toKey),
    handleApplyInsert: (prev, target, name, type, insertValue) =>
      mutationSvc.applyInsert(prev, target, name, type, insertValue),
  }
}
```

The store calls it at initialization:

```ts
// src/store/jsonStore/index.ts
import { container } from '../../core/container'

const jsonActions = createJsonActions(container)

export const useJsonStore = create<JsonStore>((set) => ({
  jsonValue: {},
  setJsonValue: (updater) => set((s) => ({ jsonValue: jsonActions.setJsonValue(s.jsonValue, updater) })),
  // ...other actions
}))
```

**Why this pattern?**
- Services are resolved once at module load
- Action creators are pure functions (receive state, return new state)
- Tests can mock the container or call action creators directly

## `uiStore` — UI State

### State

```ts
type UiStore = {
  // Theme
  mode: 'light' | 'dark'
  toggleMode: () => void

  // Tree expansion
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  collapseAll: () => void
  expandAll: (allKeys: string[]) => void

  // JSON editing mode
  editingJson: boolean
  editingText: string
  editError: string | null
  startEditing: (json: string) => void
  cancelEditing: () => void

  // Toast
  toast: Toast | null
  setToast: (t: Toast | null) => void

  // AddFieldForm fields
  fieldName: string
  fieldType: FieldType
  targetLabel: string
  // ...plus setters for each field
}
```

### Categories

| Category | Properties |
|----------|------------|
| Theme | `mode`, `toggleMode()` — light/dark, persisted to localStorage |
| Tree expansion | `expanded`, `toggleExpand`, `expandPath`, `collapseAll`, `expandAll` |
| JSON editing mode | `editingJson`, `editingText`, `editError`, `startEditing`, `cancelEditing` |
| Toast | `toast`, `setToast` — Snackbar notifications |
| Form fields | `fieldName`, `fieldType`, `targetLabel`, `valueText`, etc. + setters |

### Key Behaviors

**Theme persistence:**
```ts
function getInitialMode(): 'light' | 'dark' {
  const saved = localStorage.getItem('color-mode')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

**Tree expansion** uses a `Set<string>` with JSON-serialized paths as keys:
```ts
expanded: new Set<string>(),
toggleExpand: (key) =>
  set((s) => {
    const next = new Set(s.expanded)
    if (next.has(key)) next.delete(key); else next.add(key)
    return { expanded: next }
  }),
```

## Action Splitting

When a store accumulates many actions, split them into separate files:

```
store/jsonStore/
├── index.ts           # State + selectors (creates the store)
├── types.ts           # TypeScript types
├── actions.ts         # Action creators (factory pattern with DI)
└── __tests__/
    └── actions.test.ts
```

Each action file exports a factory function that receives the Inversify container. The `index.ts` calls it and passes the result to the Zustand store.

## Domain Separation

| Store | Domain | Forbidden |
|-------|--------|-----------|
| `jsonStore` | JSON document tree, mutations, parsing | Theme, UI flags |
| `uiStore` | Theme, expansion, editing mode, toast, form fields | JSON tree state |

If a new concern doesn't fit either store, create a new store:

```
store/newStore/
├── index.ts
├── types.ts
└── __tests__/
    └── newStore.test.ts
```

## Consuming Stores in Components

**Prefer** direct store access over props:

```tsx
// Good
function MyComponent() {
  const { jsonValue, handleUpdate } = useJsonStore()
  return <div>{JSON.stringify(jsonValue)}</div>
}

// Avoid
function MyComponent({ value, onChange }) {
  return <div>{JSON.stringify(value)}</div>
}
```

## Consuming Stores in Composables

Composables resolve services from the container and call store actions:

```ts
export function useMyComposable() {
  const { handleUpdate } = useJsonStore()
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)

  const doSomething = () => {
    const value = treeSvc.getAtPath(useJsonStore.getState().jsonValue, ['a'])
    handleUpdate(['a'], newValue)
  }

  return { doSomething }
}
```

## Adding a New Store

### 1. Define Types

```ts
// src/store/myStore/types.ts
export type MyStoreState = {
  myField: string
  setMyField: (v: string) => void
}
```

### 2. Create the Store

```ts
// src/store/myStore/index.ts
import { create } from 'zustand'
import type { MyStoreState } from './types'

export const useMyStore = create<MyStoreState>((set) => ({
  myField: '',
  setMyField: (v) => set({ myField: v }),
}))
```

### 3. Add Tests

```ts
// src/store/myStore/__tests__/myStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useMyStore } from '../index'

describe('myStore', () => {
  beforeEach(() => {
    useMyStore.setState({ myField: '' })
  })

  it('setMyField updates value', () => {
    useMyStore.getState().setMyField('hello')
    expect(useMyStore.getState().myField).toBe('hello')
  })
})
```

### 4. Use in Components

```tsx
const { myField, setMyField } = useMyStore()
```

## Testing Stores

### State Tests

```ts
describe('jsonStore', () => {
  beforeEach(() => {
    useJsonStore.setState({ jsonValue: {} })
  })

  it('setJsonValue replaces root', () => {
    useJsonStore.getState().setJsonValue(() => ({ a: 1 }))
    expect(useJsonStore.getState().jsonValue).toEqual({ a: 1 })
  })
})
```

### Action Tests (Factory Pattern)

```ts
describe('createJsonActions', () => {
  it('handleUpdate calls mutationSvc.updatePrimitive', () => {
    const container = new Container()
    container.bind(TYPES.JsonTreeService).to(JsonTreeService).inSingletonScope()
    container.bind(TYPES.JsonMutationService).toDynamicValue(
      () => new JsonMutationService(new JsonTreeService())
    ).inSingletonScope()

    const actions = createJsonActions(container)
    const result = actions.handleUpdate({ a: 1 }, ['a'], 2)
    expect(result).toEqual({ a: 2 })
  })
})
```

## Verification

All store tests must pass:

```bash
npm run test          # All tests pass, 0 failures
npm run typecheck     # Zero type errors
npm run lint          # Zero warnings
npm run build         # Production build succeeds
```
