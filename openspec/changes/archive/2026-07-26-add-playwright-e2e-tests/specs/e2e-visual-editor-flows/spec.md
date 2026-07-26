## ADDED Requirements

### Requirement: Test data seeding via Edit JSON mode
E2E tests SHALL set up test data by clicking "Editar JSON", typing JSON into the CodeMirror editor, and clicking "Validar". Tests SHALL NOT manipulate the Zustand store directly (no `page.evaluate`, no `window.__jsonStore`).

#### Scenario: Seed object data
- **WHEN** the user clicks "Editar JSON", clears the editor, types `{"name":"test","age":25}`, and clicks "Validar"
- **THEN** the visual editor shows the object properties and the JSON panel displays the formatted JSON

#### Scenario: Seed array data
- **WHEN** the user clicks "Editar JSON", clears the editor, types `["a","b","c"]`, and clicks "Validar"
- **THEN** the visual editor shows three array items and the JSON panel displays the formatted array

#### Scenario: Seed nested object data
- **WHEN** the user clicks "Editar JSON", clears the editor, types `{"outer":{"inner":"value"}}`, and clicks "Validar"
- **THEN** the visual editor shows the nested structure and the JSON panel displays the formatted JSON

### Requirement: Root type selection flow
E2E tests SHALL verify that changing the root node type via the TypeSelector dropdown correctly converts the root value and updates the JSON panel.

#### Scenario: Change root from object to string
- **WHEN** the user seeds default object data `{}` via Edit JSON mode, then selects "string" in the root TypeSelector
- **THEN** the visual editor displays a string input field and the JSON panel shows a quoted string value

#### Scenario: Change root from object to array
- **WHEN** the user seeds default object data `{}` via Edit JSON mode, then selects "array" in the root TypeSelector
- **THEN** the visual editor displays an empty array container and the JSON panel shows `[]`

### Requirement: Inline value editing flow
E2E tests SHALL verify that editing a value in the visual editor (string text, number, boolean) propagates to the JSON panel in real time.

#### Scenario: Edit a string value
- **WHEN** the user seeds an empty string `""` via Edit JSON mode, then types "hello world" into the string node's value input
- **THEN** the JSON panel displays `"hello world"` for that key

#### Scenario: Edit a number value
- **WHEN** the user seeds a number `0` via Edit JSON mode, then types "42" into the number node's value input
- **THEN** the JSON panel displays `42` for that key

#### Scenario: Toggle a boolean value
- **WHEN** the user seeds a boolean `false` via Edit JSON mode, then selects "true" in the boolean node's dropdown
- **THEN** the JSON panel displays `true` for that key

### Requirement: Object key rename flow
E2E tests SHALL verify that renaming an object key in the visual editor updates the JSON structure.

#### Scenario: Rename a key
- **WHEN** the user seeds `{"name":"test"}` via Edit JSON mode, clears the key field of the object item, types "newKey", and clicks away
- **THEN** the JSON panel shows the property under "newKey" with the same value

### Requirement: Delete node flow
E2E tests SHALL verify that clicking the delete button on a node removes it from the tree and updates the JSON panel.

#### Scenario: Delete an object property
- **WHEN** the user seeds `{"name":"test","age":25}` via Edit JSON mode, then clicks the Trash2 button on the "name" object item
- **THEN** the item disappears from the visual editor and the JSON panel no longer shows that property

#### Scenario: Delete an array item
- **WHEN** the user seeds `["a","b","c"]` via Edit JSON mode, then clicks the Trash2 button on the first array item
- **THEN** the item disappears from the visual editor and the JSON panel shows a shorter array

### Requirement: Expand and collapse flow
E2E tests SHALL verify that expand/collapse buttons toggle node visibility and that "Expandir todos" / "Recolher todos" affect all nodes.

#### Scenario: Expand a nested object
- **WHEN** the user seeds `{"outer":{"inner":"value"}}` via Edit JSON mode, then clicks the chevron on the collapsed "outer" object node
- **THEN** the child property "inner" becomes visible

#### Scenario: Collapse all nodes
- **WHEN** the user seeds `{"outer":{"inner":"value"}}` via Edit JSON mode, clicks "Expandir todos", then clicks "Recolher todos"
- **THEN** all expanded nodes collapse and only root-level properties are visible

#### Scenario: Expand all nodes
- **WHEN** the user seeds `{"outer":{"inner":"value"}}` via Edit JSON mode, then clicks "Expandir todos"
- **THEN** all collapsed nodes expand and the full tree is visible

### Requirement: Palette drag-and-drop insertion (desktop)
E2E tests SHALL verify that dragging a type from the palette and dropping it onto a container adds a new node.

#### Scenario: Insert string via palette drop
- **WHEN** the user loads the app with default `{}`, drags the "string" palette button and drops it onto the root drop zone
- **THEN** a new string property appears in the visual editor and the JSON panel updates

### Requirement: Node reorder via drag-and-drop
E2E tests SHALL verify that dragging an item within the same container reorders it.

#### Scenario: Reorder array items
- **WHEN** the user seeds `["first","second"]` via Edit JSON mode, then drags the first array item and drops it onto the second item's position
- **THEN** the items swap positions in both the visual editor and JSON panel
