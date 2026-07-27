## ADDED Requirements

### Requirement: CodeMirror extensions arrays SHALL be memoized
The `extensions` arrays passed to `CodeMirror` in `JsonPanel.tsx` MUST be wrapped in `useMemo`. The `json()` language extension SHALL be instantiated once outside the component or memoized with an empty dependency array. This SHALL prevent CodeMirror from reconfiguring its extension system on every render.

#### Scenario: Edit-mode CodeMirror stable during value edits
- **WHEN** the user types a value in the visual editor
- **THEN** the CodeMirror extensions reference in edit mode SHALL remain stable unless `mode` changes

#### Scenario: Read-only CodeMirror extensions stable
- **WHEN** `jsonValue` changes and the read-only panel is visible
- **THEN** the CodeMirror extensions array reference SHALL remain stable

### Requirement: Read-only CodeMirror value SHALL be memoized
The `jsonStr` value passed to the read-only `CodeMirror` component MUST be computed via `useMemo` with `[jsonValue]` as dependency. This SHALL prevent redundant `JSON.stringify` calls.

#### Scenario: No redundant serialization during visual edits
- **WHEN** the user edits a value in the visual tree while the read-only panel is visible
- **THEN** `JSON.stringify` SHALL only be called once per `jsonValue` change

### Requirement: dropZoneProps handlers SHALL maintain referential stability
The event handlers (`onDragEnter`, `onDragLeave`, `onDragOver`, `onDrop`) returned by `useDndItem.dropZoneProps` SHALL maintain stable references across renders. The `onDrop` callback parameter SHALL be stored in a ref to avoid recreating handlers on every render.

#### Scenario: Drop zone handlers stable across renders
- **WHEN** a parent component re-renders
- **THEN** the `onDragEnter`, `onDragLeave`, `onDragOver` handlers from `dropZoneProps` SHALL maintain referential equality
