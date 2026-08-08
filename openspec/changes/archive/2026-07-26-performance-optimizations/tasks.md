## 1. Shared Utilities

- [x] 1.1 Create `src/lib/pathsEqual.ts` utility for array path comparison without JSON.stringify
- [x] 1.2 Create `src/lib/expandInserted.ts` shared helper extracted from ObjectItem/ArrayItem
- [x] 1.3 Add unit tests for `pathsEqual` and `expandInserted`

## 2. React.memo Wrapping (react-memoization)

- [x] 2.1 Wrap `ObjectItem` with React.memo using custom comparator for parentPath/itemPath segment equality
- [x] 2.2 Wrap `ArrayItem` with React.memo using custom comparator for parentPath/itemPath segment equality
- [x] 2.3 Wrap `InlineNodeEditor` with React.memo comparing value by reference and path by segments
- [x] 2.4 Wrap `TypeSelector` with React.memo comparing path by segment equality
- [x] 2.5 Wrap `ValueInput` with React.memo comparing value by reference and path by segments
- [x] 2.6 Wrap `ContainerDropZone` with React.memo comparing parentPath by segments
- [x] 2.7 Wrap `PaletteButton` with React.memo (default shallow comparison)
- [x] 2.8 Wrap `TopBar`, `VisualEditor`, `JsonPanel` with React.memo
- [x] 2.9 Wrap `App.tsx` toast handler with useCallback for referential stability
- [x] 2.10 Add performance tests verifying memo prevents unnecessary re-renders

## 3. Store Subscription Optimization (store-subscription-optimization)

- [x] 3.1 Fix `useNodeEditor` expanded Set selector to use ref-stable equality check
- [x] 3.2 Fix `useObjectItem` and `useArrayItem` to use targeted action selectors instead of full store
- [x] 3.3 Add useMemo to JSON.stringify call in `useJsonToolbar`
- [x] 3.4 Merge duplicate `useUiStore()` calls in `useAddFieldForm` into single call
- [x] 3.5 Memoize DI container service resolution with useMemo in all composables
- [x] 3.6 Add tests verifying store subscriptions don't cause cascading re-renders

## 4. Tree Mutation Performance (tree-mutation-performance)

- [x] 4.1 Replace `structuredClone(root)` in `JsonTreeService.setAtPath` with path-only structural sharing
- [x] 4.2 Refactor `moveNode` in `JsonMutationService` to perform single-pass move
- [x] 4.3 Refactor `applyInsert` to use immutable return values instead of in-place mutation
- [x] 4.4 Replace JSON.stringify path comparisons with `pathsEqual` utility in `moveNode`
- [x] 4.5 Add unit tests verifying structural sharing (unchanged subtrees retain references)
- [x] 4.6 Add unit tests verifying pathsEqual utility correctness

## 5. CodeMirror Performance (codemirror-perf)

- [x] 5.1 Memoize CodeMirror extensions arrays with useMemo in JsonPanel
- [x] 5.2 Memoize `json()` language extension instance outside component
- [x] 5.3 Memoize `jsonStr` with useMemo in useJsonPanel
- [x] 5.4 Stabilize dropZoneProps event handlers in useDndItem with useCallback
- [x] 5.5 Add tests verifying extension array stability across renders

## 6. Lazy Computation (lazy-computation)

- [x] 6.1 Defer `collectComplexKeys` computation in useNodeEditor until expand-all interaction
- [x] 6.2 Defer `enumerateTargets` computation in useAddFieldForm until form is visible
- [x] 6.3 Fix NumberField useLayoutEffect to use ref-based comparison instead of text dependency
- [x] 6.4 Add tests verifying computations are deferred until needed

## 7. Dead Dependency Cleanup

- [x] 7.1 Remove `prettier` from production dependencies (move to devDependencies or remove)
- [x] 7.2 Remove `ajv` from production dependencies if unused
- [x] 7.3 Remove `jsonc-parser` from production dependencies if unused
- [x] 7.4 Verify build and all tests pass after dependency removal

## 8. Code Deduplication

- [x] 8.1 Replace inline `expandInserted` in ObjectItem and ArrayItem with shared import from `src/lib/`
- [x] 8.2 Replace inline Zod schema in useAddFieldForm with JsonValidationService.validateAddFieldForm
- [x] 8.3 Remove duplicate Zod import from useAddFieldForm
- [x] 8.4 Verify all existing tests pass unchanged

## 9. Verification and Documentation

- [x] 9.1 Run `npm run test` — all existing tests pass
- [x] 9.2 Run `npm run typecheck` — zero type errors
- [x] 9.3 Run `npm run lint` — zero warnings
- [x] 9.4 Run `npm run build` — successful production build
- [x] 9.5 Create `optimizations.md` with checkbox progress list of all optimizations
- [x] 9.6 Use Playwright MCP against localhost:5174/ to validate and collect performance metrics
- [x] 9.7 Add performance measurement tests using React.Profiler render counters
