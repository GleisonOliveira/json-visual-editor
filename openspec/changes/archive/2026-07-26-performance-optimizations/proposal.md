## Why

The visual JSON editor suffers from cascading re-renders, excessive deep-cloning, and redundant computations that severely degrade performance for users working with large JSON documents. Every keystroke triggers full-tree `structuredClone`, every expand/collapse re-renders all tree nodes, and CodeMirror extensions are recreated on every render. These bottlenecks make the editor sluggish for power users parsing large JSONs (1000+ nodes).

## What Changes

- Wrap all frequently re-rendered components (`ObjectItem`, `ArrayItem`, `InlineNodeEditor`, `TypeSelector`, `ValueInput`, `ContainerDropZone`, `PaletteButton`, `TopBar`, `VisualEditor`, `JsonPanel`) with `React.memo` and custom shallow comparators
- Optimize Zustand store subscriptions to use targeted selectors, preventing cascading re-renders from `expanded` Set and action-only store access
- Replace full `structuredClone` in `JsonTreeService.setAtPath` with targeted path-only cloning (structural sharing)
- Memoize CodeMirror extensions arrays and `json()` language instance
- Defer expensive computations (`collectComplexKeys`, `enumerateTargets`) to when they are actually needed
- Memoize DI container service resolution
- Add `useMemo` to `JSON.stringify` call in `useJsonToolbar`
- Remove unused production dependencies (`prettier`, `ajv`, `jsonc-parser`)
- Deduplicate shared code (`expandInserted`, Zod validation schema)

## Capabilities

### New Capabilities
- `react-memoization`: React.memo wrapping with custom comparators for all re-render-sensitive components
- `store-subscription-optimization`: Targeted Zustand selectors and ref-stable patterns to prevent cascading re-renders
- `tree-mutation-performance`: Structural sharing in JsonTreeService to avoid full-tree cloning per mutation
- `codemirror-perf`: Memoized CodeMirror extensions and deferred re-rendering for read-only view
- `lazy-computation`: Deferred computation of expensive tree traversals until results are needed

### Modified Capabilities

## Impact

- **Components**: `ObjectItem`, `ArrayItem`, `InlineNodeEditor`, `TypeSelector`, `ValueInput`, `ContainerDropZone`, `PaletteButton`, `TopBar`, `VisualEditor`, `JsonPanel`, `App.tsx`, `NumberField`
- **Services**: `JsonTreeService` (setAtPath structural sharing), `JsonMutationService` (single-pass moveNode)
- **Stores**: `uiStore` (expanded Set reference stability), `jsonStore` (action selectors)
- **Hooks**: `useDndItem`, `useNodeEditor`, `useObjectItem`, `useArrayItem`, `useAddFieldForm`, `useJsonToolbar`, `useContainer`
- **Dependencies**: Remove `prettier`, `ajv`, `jsonc-parser` from production deps
- **Utilities**: New shared `pathsEqual`, `expandInserted` helpers in `src/lib/`
- **Tests**: All existing tests must continue passing; new performance measurement tests added
- **No behavior changes**: Pure performance optimization; no feature changes
