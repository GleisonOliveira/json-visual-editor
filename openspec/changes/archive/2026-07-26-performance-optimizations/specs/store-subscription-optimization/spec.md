## ADDED Requirements

### Requirement: useNodeEditor SHALL use ref-stable selector for expanded state
The `useNodeEditor` composable MUST subscribe to `expanded` from `useUiStore` via a selector that returns the Set reference only when its contents change. This SHALL prevent the cascading re-render where toggling any node's expand state causes all nodes to re-render.

#### Scenario: Expand one node does not re-render unrelated nodes
- **WHEN** user expands or collapses a single node
- **THEN** only the affected `NodeEditor` and its direct children SHALL re-render

### Requirement: ObjectItem and ArrayItem composables SHALL use targeted action selectors
The `useObjectItem` and `useArrayItem` composables MUST destructure actions (`handleUpdate`, `handleMove`, `handleInsert`) via individual Zustand selectors (e.g., `useJsonStore(s => s.handleUpdate)`) instead of destructuring the entire store. This SHALL prevent accidental state subscriptions.

#### Scenario: Action-only subscription produces no state-triggered re-renders
- **WHEN** `jsonValue` changes but the node's own data is unchanged
- **THEN** the composable SHALL NOT trigger a re-render from its store subscription

### Requirement: useJsonToolbar SHALL memoize JSON.stringify
The `useJsonToolbar` composable MUST wrap the `JSON.stringify(jsonValue, null, 2)` call in `useMemo` with `[jsonValue]` as dependency. This SHALL prevent re-serializing the entire JSON tree on every toolbar render.

#### Scenario: Toolbar renders without redundant serialization
- **WHEN** the toolbar re-renders for a non-data reason (e.g., theme change)
- **THEN** `JSON.stringify` SHALL NOT be called again if `jsonValue` has not changed

### Requirement: useAddFieldForm SHALL use a single useUiStore call
The `useAddFieldForm` composable MUST merge its two `useUiStore()` calls into a single call that destructures all needed fields at once. This SHALL reduce subscription overhead.

#### Scenario: Single subscription for form state
- **WHEN** `useAddFieldForm` mounts
- **THEN** exactly one `useUiStore` subscription SHALL be created

### Requirement: useContainer service resolution SHALL be memoized
All components and composables that call `useContainer().get()` to resolve services MUST memoize the resolution with `useMemo` keyed on the container. This SHALL prevent redundant DI lookups on every render.

#### Scenario: Service resolved once per mount
- **WHEN** a component using `useContainer` re-renders
- **THEN** `container.get()` SHALL NOT be called again if the container reference is stable
