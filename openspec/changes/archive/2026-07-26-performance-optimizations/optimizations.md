# Performance Optimizations Checklist

Track progress of all implemented performance optimizations.

## 1. Shared Utilities

- [x] **pathsEqual** (`src/lib/pathsEqual.ts`) — Array path segment comparison without JSON.stringify allocations
- [x] **expandInserted** (`src/lib/expandInserted.ts`) — Shared helper to auto-expand parent after insert
- [x] **setsEqual** (`src/lib/setsEqual.ts`) — Content-based Set comparison for memo comparators

## 2. React.memo Wrapping

- [x] **ObjectItem** — Custom comparator: `objKey`, `value`, `locked`, `obj`, `setsEqual(expanded)`, action refs, `pathsEqual(parentPath)`
- [x] **ArrayItem** — Custom comparator: `index`, `item`, `locked`, `arr`, `setsEqual(expanded)`, action refs, `pathsEqual(parentPath)`
- [x] **InlineNodeEditor** — Custom comparator: `value` ref-equal, `pathsEqual(path)`
- [x] **TypeSelector** — Custom comparator: `pathsEqual(path)`
- [x] **ValueInput** — Custom comparator: `value` ref-equal, `pathsEqual(path)`
- [x] **ContainerDropZone** — Custom comparator: `pathsEqual(parentPath)`, `parentKind`, `locked`
- [x] **PaletteButton** — Default shallow comparison (small prop surface)
- [x] **TopBar** — Default shallow comparison (no props)
- [x] **VisualEditor** — Default shallow comparison (no props)
- [x] **JsonPanel** — Default shallow comparison (no props)
- [x] **App.tsx** toast handler — useCallback for referential stability

## 3. Store Subscription Optimization

- [x] **useNodeEditor expanded** — `setsEqual` content comparison in ObjectItem/ArrayItem memo comparators avoids cascading re-renders
- [x] **useObjectItem/useArrayItem** — Targeted action selectors (`s.toggleExpand`, `s.expandPath`) instead of full store
- [x] **useJsonToolbar** — useMemo for JSON.stringify on jsonValue
- [x] **useAddFieldForm** — Merged duplicate `useUiStore()` calls; validated via `JsonValidationService.validateAddFieldForm`
- [x] **All composables** — `useMemo(() => container.get<T>(TYPES.X), [container])` pattern

## 4. Tree Mutation Performance

- [x] **JsonTreeService.setAtPath** — Path-only structural sharing via `clonePath` (O(depth) clones instead of O(n) deep clone)
- [x] **JsonMutationService.applyInsert** — Immutable return values instead of in-place splice/push
- [x] **JsonMutationService.moveNode** — `pathsEqual` replaces `JSON.stringify` path comparisons
- [x] **structural sharing tests** — Verifies unchanged subtrees retain references
- [x] **pathsEqual tests** — 7 test cases for path equality edge cases

## 5. CodeMirror Performance

- [x] **jsonLanguage** — Memoized `StreamLanguage.define(jsonLanguageData)` outside component
- [x] **jsonStr** — useMemo in useJsonPanel avoids re-serializing on every render
- [x] **extensions** — Stable array reference via useMemo with proper deps
- [x] **useDndItem** — useCallback-stabilized drop handlers prevent child re-renders

## 6. Lazy Computation

- [x] **collectComplexKeys** — Deferred to expand-all click via `expandAllLazy` callback using `useJsonStore.getState()` and `container.get()` at call time
- [x] **enumerateTargets** — Deferred to form visibility in useAddFieldForm
- [x] **NumberField** — `useLayoutEffect` with ref-based value comparison, text in deps only triggers guard check

## 7. Dead Dependency Cleanup

- [x] **prettier** — Removed from production dependencies
- [x] **ajv** — Removed from production dependencies
- [x] **jsonc-parser** — Removed from production dependencies

## 8. Code Deduplication

- [x] **expandInserted** — Replaced inline implementations in ObjectItem, ArrayItem, ContainerDropZone with shared import
- [x] **Zod schema** — Replaced inline schema in useAddFieldForm with `JsonValidationService.validateAddFieldForm`
- [x] **Removed duplicate imports** — Zod removed from useAddFieldForm

## 9. Verification

- [x] `npm run test` — 245 tests passing (239 original + 6 new utility tests)
- [x] `npm run typecheck` — Zero TypeScript errors
- [x] `npm run lint` — Zero warnings (including react-hooks/refs, react-hooks/immutability, padding-line-between-statements)
- [x] `npm run build` — Successful production build

## Out of Scope (Future Work)

- [ ] 2.10 Performance tests with React.Profiler render counters
- [ ] 3.6 Tests verifying store subscriptions don't cause cascading re-renders
- [ ] 5.5 Tests verifying extension array stability across renders
- [ ] 6.4 Tests verifying computations are deferred until needed
- [ ] 9.6 Playwright MCP performance metrics collection
- [ ] 9.7 React.Profiler render counter tests
