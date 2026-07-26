# Services

Service classes, DI tokens, constructor injection, and adding new services.

**Live site:** https://jsonvisualeditor.com/

---

## Overview

Services encapsulate pure business logic with no React or store dependency. Each service lives in `src/services/` and is a class with constructor injection.

```
src/services/
├── JsonTreeService.ts        # Tree traversal
├── JsonMutationService.ts    # Tree mutations
├── JsonValidationService.ts  # Form + JSON validation
├── ClipboardService.ts       # Clipboard API
├── FileDownloadService.ts    # File download
└── __tests__/
    ├── JsonTreeService.test.ts
    ├── JsonMutationService.test.ts
    ├── JsonValidationService.test.ts
    ├── ClipboardService.test.ts
    └── FileDownloadService.test.ts
```

## Service Classes

### `JsonTreeService`

Pure tree-traversal operations for the JSON document model. Used by components and the jsonStore to read, locate, and manipulate values.

**Methods:**

| Method | Purpose |
|--------|---------|
| `getAtPath(root, path)` | Returns the value at `path` in the JSON tree |
| `setAtPath(root, path, updater)` | Immutably applies `updater` to the node at `path` |
| `removeAtPath(root, path)` | Immutably removes the node at `path` |
| `insertAtPath(root, parentPath, key, value)` | Immutably inserts `value` at `key` in the container |
| `isAncestorOrEqual(candidate, path)` | Returns true when `candidate` is an ancestor of or equal to `path` |
| `isComplexValue(v)` | Returns true when `v` is an object or array |
| `enumerateTargets(root)` | Walks tree, returns all object/array containers as drop targets |
| `collectComplexKeys(v, parentPath)` | Collects JSON-serialized paths of all complex nodes |
| `isPalettePayload(p)` | Type guard: palette drag payload vs node-move payload |
| `isObject(v)` | Type guard: plain object (not array, not null) |
| `isArray(v)` | Type guard: array |

### `JsonMutationService`

Tree mutations: creating, moving, and updating nodes. Depends on `JsonTreeService`.

**Constructor:**
```ts
constructor(tree: JsonTreeService)
```

**Methods:**

| Method | Purpose |
|--------|---------|
| `buildDefaultValue(opts)` | Builds a default value for a given field type |
| `moveNode(root, payload, toParentPath, toKey)` | Moves a node from one position to another |
| `insertFromPalette(root, paletteType, toParentPath, toKey)` | Inserts a default node of the given type |
| `updatePrimitive(root, path, next)` | Replaces the value at `path` with `next` |
| `applyInsert(root, target, name, type, insertValue)` | Inserts a field via the form |

### `JsonValidationService`

Validation logic: form validation and JSON string parsing.

**Methods:**

| Method | Purpose |
|--------|---------|
| `validateAddFieldForm(opts)` | Validates AddFieldForm data (Zod schema) |
| `validateJsonString(text)` | Parses JSON string, returns result or error |

### `ClipboardService`

Thin wrapper around `navigator.clipboard.writeText()`.

**Methods:**

| Method | Purpose |
|--------|---------|
| `writeText(text)` | Writes text to system clipboard |

### `FileDownloadService`

Triggers a browser file download for JSON data.

**Methods:**

| Method | Purpose |
|--------|---------|
| `downloadJson(jsonString, filename?)` | Downloads `jsonString` as `filename` (default: "data.json") |

## Dependency Graph

```
JsonMutationService ──depends──▶ JsonTreeService
JsonValidationService  (standalone)
ClipboardService       (standalone)
FileDownloadService    (standalone)
```

## DI Tokens

All tokens are defined in `src/core/types.ts`:

```ts
export const TYPES = {
  JsonTreeService: Symbol.for('JsonTreeService'),
  JsonMutationService: Symbol.for('JsonMutationService'),
  JsonValidationService: Symbol.for('JsonValidationService'),
  ClipboardService: Symbol.for('ClipboardService'),
  FileDownloadService: Symbol.for('FileDownloadService'),
} as const
```

## Container Registration

All bindings are in `src/core/container.ts`:

```ts
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
```

> `JsonMutationService` uses `toDynamicValue` because it has a constructor dependency on `JsonTreeService`.

## Constructor Injection Pattern

Services that depend on other services receive them via constructor:

```ts
export class JsonMutationService {
  readonly tree: JsonTreeService
  constructor(tree: JsonTreeService) {
    this.tree = tree
  }
}
```

The container resolves this automatically when using `.toDynamicValue()`.

## Resolution in Components

```tsx
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonTreeService } from '../../../services/JsonTreeService'

export function useMyComponent() {
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
  // Use treeSvc.getAtPath(...), etc.
}
```

## Resolution in Stores

```ts
import { container } from '../../core/container'
import { TYPES } from '../../core/types'
import type { JsonMutationService } from '../../services/JsonMutationService'

const mutationSvc = container.get<JsonMutationService>(TYPES.JsonMutationService)
```

## Adding a New Service

### 1. Create the Service Class

```ts
// src/services/MyService.ts

/** [JSDoc explaining responsibility]. */
export class MyService {
  /** [JSDoc explaining what the method does]. */
  myMethod(param: string): ReturnType {
    // implementation
  }
}
```

### 2. Add a DI Token

```ts
// src/core/types.ts
export const TYPES = {
  // ...existing tokens
  MyService: Symbol.for('MyService'),
} as const
```

### 3. Bind in Container

```ts
// src/core/container.ts
import { MyService } from '../services/MyService'

container.bind<MyService>(TYPES.MyService)
  .to(MyService).inSingletonScope()
```

If it depends on another service:
```ts
container.bind<MyService>(TYPES.MyService)
  .toDynamicValue(() => new MyService(container.get<JsonTreeService>(TYPES.JsonTreeService)))
  .inSingletonScope()
```

### 4. Create Tests

```ts
// src/services/__tests__/MyService.test.ts
import { describe, it, expect } from 'vitest'
import { MyService } from '../MyService'

describe('MyService', () => {
  const svc = new MyService()

  it('does something', () => {
    expect(svc.myMethod('input')).toBe('expected')
  })
})
```

### 5. Resolve in Components

```tsx
const container = useContainer()
const mySvc = container.get<MyService>(TYPES.MyService)
```

## Testing Services

Service tests are pure unit tests — no React, no container, no mocking needed:

```ts
import { describe, it, expect } from 'vitest'
import { JsonTreeService } from '../JsonTreeService'

describe('JsonTreeService', () => {
  const svc = new JsonTreeService()

  describe('getAtPath', () => {
    it('returns root for empty path', () => {
      expect(svc.getAtPath({ a: 1 }, [])).toEqual({ a: 1 })
    })

    it('returns nested value', () => {
      expect(svc.getAtPath({ a: { b: 2 } }, ['a', 'b'])).toBe(2)
    })

    it('handles array indices', () => {
      expect(svc.getAtPath([10, 20, 30], [1])).toBe(20)
    })
  })
})
```

Each service method should have tests covering:
- **Happy path**: normal usage
- **Edge cases**: empty inputs, boundary values
- **Error paths**: invalid inputs (where applicable)
