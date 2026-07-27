# react-memoization

## Purpose

Performance optimization via `React.memo` wrappers on components that receive stable or rarely-changing props, preventing unnecessary re-renders throughout the component tree.

## Requirements

### Requirement: ObjectItem and ArrayItem SHALL be wrapped with React.memo
The `ObjectItem` and `ArrayItem` components MUST use `React.memo` with custom comparators. The comparator SHALL perform shallow equality on all props, with special handling for `parentPath` and `itemPath` arrays (compared by segment index).

#### Scenario: ObjectItem skips re-render on sibling update
- **WHEN** a user edits a sibling field's value in the same parent object
- **THEN** `ObjectItem` instances whose props have not changed SHALL NOT re-render

#### Scenario: ArrayItem skips re-render on unrelated tree mutation
- **WHEN** a node outside this array item's subtree is modified
- **THEN** `ArrayItem` SHALL NOT re-render

### Requirement: InlineNodeEditor SHALL be wrapped with React.memo
The `InlineNodeEditor` component MUST use `React.memo` with a comparator that checks `value` by reference and `path` by shallow segment comparison.

#### Scenario: InlineNodeEditor stable during tree mutation
- **WHEN** a user modifies a different node in the same parent
- **THEN** `InlineNodeEditor` for the unaffected node SHALL NOT re-render

### Requirement: TypeSelector and ValueInput SHALL be wrapped with React.memo
`TypeSelector` and `ValueInput` MUST use `React.memo` with custom comparators. `TypeSelector` SHALL compare `path` by segment equality. `ValueInput` SHALL compare `value` by reference and `path` by segment equality.

#### Scenario: ValueInput stable during parent re-render
- **WHEN** a parent component re-renders but the value and path at this node are unchanged
- **THEN** `ValueInput` SHALL NOT re-render

### Requirement: ContainerDropZone SHALL be wrapped with React.memo
`ContainerDropZone` MUST use `React.memo` with a comparator that compares `parentPath` by segment equality.

#### Scenario: Drop zone stable during sibling edits
- **WHEN** a sibling node is being edited
- **THEN** the `ContainerDropZone` instance SHALL NOT re-render

### Requirement: PaletteButton SHALL be wrapped with React.memo
`PaletteButton` MUST use `React.memo`. Default shallow comparison is sufficient since all props are primitive (`type`, `disabled`) or stable JSX references (`icon`).

#### Scenario: Palette buttons stable during mode toggle
- **WHEN** the user toggles between visual and code editing mode
- **THEN** palette buttons whose props have not changed SHALL NOT re-render

### Requirement: Top-level organisms SHALL be wrapped with React.memo
`TopBar`, `VisualEditor`, and `JsonPanel` MUST use `React.memo`. Since they receive no props or minimal props, this decouples them from parent re-renders triggered by toast or theme changes.

#### Scenario: JsonPanel stable during toast display
- **WHEN** a toast notification appears or disappears
- **THEN** `JsonPanel` SHALL NOT re-render

### Requirement: App.tsx toast handlers SHALL use useCallback
The `onClose` callback for `Snackbar`/`Alert` in `App.tsx` MUST be wrapped in `useCallback` with `[setToast]` dependency to maintain referential stability.

#### Scenario: Stable callback reference across renders
- **WHEN** `App` re-renders due to toast or theme changes
- **THEN** the `onClose` handler reference SHALL remain stable
