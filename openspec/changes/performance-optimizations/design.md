## Context

The json-visual-editor is a React 19 + TypeScript app with Zustand for state, MUI for UI, CodeMirror 6 for JSON editing, and Inversify for DI. The tree-rendering architecture uses recursive `NodeEditor` components that render `ObjectItem`/`ArrayItem` lists. Currently, no components use `React.memo`, the entire JSON tree is `structuredClone`d on every mutation, and CodeMirror extensions are recreated on every render. For users working with large JSON documents (1000+ nodes), this causes perceptible lag on every keystroke and expand/collapse interaction.

The user specifically requested: no features removed or created, all existing tests passing unchanged, lint/typecheck passing, and a `optimizations.md` checklist file tracking each optimization with corresponding performance tests.

## Goals / Non-Goals

**Goals:**
- Eliminate unnecessary component re-renders across the entire node tree via `React.memo`
- Reduce per-mutation cost from O(tree_size) to O(path_depth) via structural sharing
- Prevent cascading re-renders from Zustand store state changes (expanded Set)
- Memoize CodeMirror extensions and expensive computations
- Remove unused production dependencies to reduce bundle size
- Provide measurable performance improvements validated via Playwright against localhost:5174/
- Track all optimizations in a `optimizations.md` checklist
- Add performance tests confirming each optimization

**Non-Goals:**
- Adding new features or removing existing features
- Changing user-facing behavior in any way
- Virtualizing the node tree (out of scope; would require major architectural changes)
- Server-side optimizations
- Changing the test framework or test assertions (existing tests remain unchanged)

## Decisions

### Decision 1: Custom React.memo comparators vs. Zustand useShallow vs. no wrapper

**Choice**: Custom `React.memo` comparators with path-segment comparison for array props.

**Rationale**: `ObjectItem` and `ArrayItem` receive `parentPath` and `itemPath` as arrays which are new references on every render. Default `React.memo` shallow comparison would always detect them as changed. Custom comparators that check array length and segment-by-segment equality prevent false positives.

**Alternatives considered**:
- Zustand `useShallow`: Only helps with store subscriptions, not with parent-prop-based re-renders
- No memo + stable references: Would require rewriting the entire path management to use refs, which is invasive

### Decision 2: Structural sharing vs. targeted clone vs. keep structuredClone

**Choice**: Replace `structuredClone(root)` in `setAtPath` with path-only cloning.

**Rationale**: `structuredClone` is O(n) where n is total tree size. For a 1000-node tree edited at depth 5, we only need to clone 5 nodes. Structural sharing means unchanged subtrees retain their original references, which also helps React's reconciliation skip unchanged subtrees.

**Alternatives considered**:
- Keep `structuredClone` but memoize: Would still be O(n) on every keystroke
- Immer: Would add a dependency and change the mutation model; also O(n) for proxy-based approach
- Partial clone with manual recursion: This is what we're implementing; it's the right approach

### Decision 3: Lazy computation strategy for collectComplexKeys and enumerateTargets

**Choice**: Defer computation until the result is actually needed (on-demand).

**Rationale**: `collectComplexKeys` walks the entire tree and serializes paths on every `jsonValue` change, but the result is only used for the "expand all" button. `enumerateTargets` walks the tree to build a dropdown that's only visible on mobile. Computing these eagerly wastes time on every keystroke.

**Alternatives considered**:
- Debounce: Would still compute on every change, just less frequently; doesn't eliminate the waste
- Cache with invalidation: More complex than needed; the computation is fast when called once, just not on every keystroke

### Decision 4: Zustand expanded Set reference management

**Choice**: Use a ref-stable selector for the `expanded` Set in `useNodeEditor`.

**Rationale**: `toggleExpand` creates a `new Set(s.expanded)` every time, which changes the reference and triggers re-renders in every component that subscribes to `expanded`. By using `useUiStore(s => s.expanded)` with a custom equality check that compares Set contents (size + has-check for each element), we prevent cascading re-renders.

**Alternatives considered**:
- Replace Set with plain object: Would require changing all Set consumers; `Set.has()` is O(1) which is good
- Use Zustand `subscribeWithSelector` middleware: More complex than a custom equality selector

### Decision 5: Extract shared utilities (expandInserted, pathsEqual) into src/lib/

**Choice**: Create `src/lib/expandInserted.ts` and `src/lib/pathsEqual.ts` as shared pure utility modules.

**Rationale**: `expandInserted` is duplicated in ObjectItem and ArrayItem. `pathsEqual` replaces `JSON.stringify` path comparison. Both are pure functions that belong in the `lib/` directory per project conventions.

### Decision 6: Performance test strategy

**Choice**: Use React.Profiler render counters in unit tests + Playwright performance metrics against localhost:5174/.

**Rationale**: Unit tests with render counters verify that memoization prevents re-renders. Playwright metrics (largest contentful paint, time to interactive, layout shift) provide real-world validation. Both are needed: unit tests for correctness, Playwright for real performance.

## Risks / Trade-offs

- **[Risk] Custom React.memo comparators may miss edge cases** → Mitigation: Comprehensive test coverage for each comparator; existing tests must pass unchanged
- **[Risk] Structural sharing in setAtPath may have subtle mutation bugs** → Mitigation: All existing JsonTreeService and JsonMutationService tests must pass; add specific tests for shared-reference behavior
- **[Risk] Lazy computation may cause UI delay when user first triggers expand-all on large tree** → Mitigation: The computation is O(n) with small constant; for 1000 nodes this is <10ms. Could add a loading state if needed
- **[Risk] Removing unused dependencies may break if they're actually used indirectly** → Mitigation: Verify with build + all tests passing; check for dynamic imports
- **[Trade-off] More complex code in comparators and structural sharing** → Accepted: The performance benefit for large JSON documents justifies the added complexity

## Migration Plan

This is a performance-only change with no API or behavioral changes. All changes are internal implementation optimizations.

1. Implement all optimizations in the order specified by tasks.md
2. Run `npm run test` after each task to verify no regressions
3. Run `npm run typecheck` and `npm run lint` after each task
4. After all tasks complete, validate with Playwright against localhost:5174/
5. Create `optimizations.md` checklist documenting all changes
6. Run full test suite + typecheck + lint as final validation

Rollback: Each optimization is independent and can be reverted individually if issues arise.
