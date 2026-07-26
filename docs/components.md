# Components

Atomic design, template+composable pattern, and guide for adding new components.

**Live site:** https://jsonvisualeditor.com/

---

## Atomic Design Hierarchy

Components follow atomic design with three levels:

```
atoms/         Smallest, stateless or minimal-state UI units
molecules/     Composed atoms with business logic
organisms/     Complex UI composed of molecules
```

### Atoms (5)

| Component | Location | Purpose |
|-----------|----------|---------|
| `ContainerDropZone` | `atoms/container-drop-zone/` | Drop target for palette drags and node reorder drops |
| `NumberField` | `atoms/number-field/` | Numeric input that preserves mid-edit state (e.g., "1.") |
| `PaletteButton` | `atoms/palette-button/` | Draggable button for each JSON type (string, number, etc.) |
| `TypeSelector` | `atoms/type-selector/` | MUI Select dropdown for choosing a node's JSON type |
| `ValueInput` | `atoms/value-input/` | Input that renders as TextField/NumberField/Select based on type |

### Molecules (6)

| Component | Location | Purpose |
|-----------|----------|---------|
| `AddFieldForm` | `molecules/add-field-form/` | Mobile form for adding fields (target, type, name, value) |
| `ArrayItem` | `molecules/array-item/` | Array item node with drag handle, delete, type/value editors |
| `InlineNodeEditor` | `molecules/inline-node-editor/` | TypeSelector + ValueInput combo for leaf nodes |
| `JsonToolbar` | `molecules/json-toolbar/` | Action buttons: Edit, Copy, Copy Minified, Download, Validate, Cancel |
| `ObjectItem` | `molecules/object-item/` | Object property node with key rename, delete, type/value editors |
| `PalettePanel` | `molecules/palette-panel/` | Grid of 6 draggable PaletteButtons |

### Organisms (4)

| Component | Location | Purpose |
|-----------|----------|---------|
| `JsonPanel` | `organisms/json-panel/` | Right panel: CodeMirror JSON display + editing mode |
| `NodeEditor` | `organisms/node-editor/` | Recursive tree renderer (root node + children) |
| `TopBar` | `organisms/top-bar/` | Header with title, theme toggle, GitHub link |
| `VisualEditor` | `organisms/visual-editor/` | Left panel: palette + tree (desktop) or form + tree (mobile) |

## Template + Composable Pattern

Every component is split into two files:

```
component-name/
├── ComponentName.tsx      # Template: pure JSX
├── useComponentName.ts    # Composable: state, effects, handlers
└── __tests__/
    └── ComponentName.test.tsx
```

### Template (`ComponentName.tsx`)

The template is a pure JSX rendering function. It:
- Calls the composable hook for state and handlers
- Renders MUI components and HTML
- Contains **no** `useState`, `useEffect`, or business logic

```tsx
// Example: TypeSelector.tsx
export function TypeSelector(props: Props): React.JSX.Element {
  const { setNodeType } = useTypeSelector(props.path, props.nodeType)

  return (
    <FormControl size="small">
      <Select value={props.nodeType} onChange={(e) => setNodeType(e.target.value)}>
        <MenuItem value="string">Texto</MenuItem>
        ...
      </Select>
    </FormControl>
  )
}
```

### Composable (`useComponentName.ts`)

The composable is a custom hook that encapsulates all logic for the template. It:
- Resolves services from the DI container via `useContainer()`
- Reads/writes Zustand stores
- Contains event handlers, effects, and local state
- Is **not shared** with other components

```tsx
// Example: useTypeSelector.ts
export function useTypeSelector(path, nodeType) {
  const { handleUpdate } = useJsonStore()
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)

  const setNodeType = (newType) => {
    const defaultValue = buildDefaultValue(newType)
    handleUpdate(path, defaultValue)
  }

  return { setNodeType }
}
```

### When to Break the Pattern

- If logic needs to be shared across components → move to `src/hooks/`
- If a component is truly leaf-level and has no state → composable can be omitted (rare)

## Component Tree

```
App
├── TopBar                              [uiStore]
├── Grid (2 columns / stacked)
│   ├── VisualEditor                    [uiStore]
│   │   ├── PalettePanel                [uiStore]     ← desktop only
│   │   │   └── PaletteButton (×6)      [uiStore]
│   │   ├── AddFieldForm                [uiStore, jsonStore]  ← mobile only
│   │   └── NodeEditor                  [jsonStore, uiStore]
│   │       ├── TypeSelector (root)     [jsonStore]
│   │       ├── ObjectItem (recursive)  [jsonStore, uiStore]
│   │       │   ├── InlineNodeEditor    [jsonStore]
│   │       │   │   ├── TypeSelector    [jsonStore]
│   │       │   │   └── ValueInput      [jsonStore]
│   │       │   ├── ObjectItem (nested) [recursive]
│   │       │   ├── ArrayItem (nested)  [recursive]
│   │       │   └── ContainerDropZone   [jsonStore, uiStore]
│   │       ├── ArrayItem (recursive)   [jsonStore, uiStore]
│   │       │   ├── InlineNodeEditor    [jsonStore]
│   │       │   ├── ObjectItem (nested) [recursive]
│   │       │   ├── ArrayItem (nested)  [recursive]
│   │       │   └── ContainerDropZone   [jsonStore, uiStore]
│   │       └── ContainerDropZone       [jsonStore, uiStore]  ← root level
│   └── JsonPanel                       [uiStore, jsonStore]
│       ├── JsonToolbar                 [uiStore, jsonStore]
│       └── CodeMirror editor
└── Snackbar + Alert (toast)            [uiStore]
```

## Props vs. Store Access

**Prefer** consuming the Zustand store directly:

```tsx
// Good
const { jsonValue, handleUpdate } = useJsonStore()

// Avoid
<MyComponent value={jsonValue} onChange={handleUpdate} />
```

**Props are acceptable** only when:
- The value comes from a local iteration (e.g., `key` in a `.map()`)
- The prop is visual configuration (e.g., `size`, `variant`)
- The component is genuinely generic/reusable

## Adding a New Component

### 1. Determine the Level

| Level | Use when |
|-------|----------|
| **Atom** | Small, reusable, minimal state |
| **Molecule** | Composed from atoms, has business logic |
| **Organism** | Complex, page-level UI section |

### 2. Create the Directory

```
src/components/atoms/my-atom/
├── MyAtom.tsx
├── useMyAtom.ts        # only if composable is needed
└── __tests__/
    └── MyAtom.test.tsx
```

### 3. Write the Composable (if needed)

```ts
// src/components/atoms/my-atom/useMyAtom.ts
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'

export function useMyAtom() {
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
  // ... state, handlers
  return { /* ... */ }
}
```

### 4. Write the Template

```tsx
// src/components/atoms/my-atom/MyAtom.tsx
import { useMyAtom } from './useMyAtom'

/** Atom: [describe its role in the atomic hierarchy]. */
export function MyAtom(props: Props): React.JSX.Element {
  const { /* ... */ } = useMyAtom()
  return ( /* JSX */ )
}
```

### 5. Write the Test

```tsx
// src/components/atoms/my-atom/__tests__/MyAtom.test.tsx
import { Container } from 'inversify'
import { ContainerProvider } from '../../../../core/containerContext'

function renderWithProviders(ui: React.ReactNode) {
  const container = new Container()
  // bind mock services...
  return render(<ContainerProvider value={container}>{ui}</ContainerProvider>)
}
```

### 6. Add JSDoc

Every component must have a JSDoc comment explaining:
- Its role in the atomic hierarchy
- What it renders
- When to use it

## Locking During JSON Edit

When `editingJson === true` in `uiStore`, all visual editor controls are locked:

| Component | Locked Behavior |
|-----------|----------------|
| Palette buttons | `draggable={false}` + `disabled` |
| AddFieldForm "Adicionar" | `disabled` |
| Type selectors | `disabled` |
| Drag handles | `draggable={false}` |
| Delete buttons | `disabled` |
| Key rename fields | `disabled` |
| Visual editor container | `opacity: 0.5`, `pointerEvents: 'none'` |
