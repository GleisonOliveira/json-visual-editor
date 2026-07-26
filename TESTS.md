# TESTS.md — E2E Test Scenarios

All Playwright E2E test scenarios for the JSON Visual Editor. Check off each scenario as it is implemented.

## Visual Editor Flows (`e2e/visual-editor.e2e.ts`)

### Root Type Selection
- [x] Change root from object to string
- [x] Change root from object to array

### Inline Value Editing
- [x] Edit a string value
- [x] Edit a number value
- [x] Toggle a boolean value

### Object Key Rename
- [x] Rename an object key → JSON panel updates

### Delete Node
- [x] Delete an object property
- [x] Delete an array item

### Expand/Collapse
- [x] Expand a nested object
- [x] Collapse all nodes
- [x] Expand all nodes

### Palette Drag-and-Drop
- [x] Insert string via palette drop

### Node Reorder
- [x] Reorder array items via drag-and-drop

## JSON Panel Flows (`e2e/json-panel.e2e.ts`)

### Edit Mode
- [x] Enter edit mode via "Editar JSON" button
- [x] Cancel editing discards changes
- [x] Validate with valid JSON applies changes
- [x] Validate with invalid JSON shows error

### Toolbar Actions
- [x] Copy button copies formatted JSON to clipboard
- [x] Copy minified button copies minified JSON to clipboard
- [x] Download button triggers file download

## Responsive Layouts (`e2e/responsive.e2e.ts`)

### Desktop (1280x720)
- [x] Two-column layout with both panels visible
- [x] Palette panel visible, AddFieldForm hidden
- [x] Desktop toolbar shows text buttons

### Mobile (375x812)
- [x] Single-column stacked layout
- [x] AddFieldForm visible, palette hidden
- [x] Mobile toolbar shows icon-only buttons
- [x] Add field via mobile form

## Theme & Navigation (`e2e/theme.e2e.ts`)

### Theme Toggle
- [x] Toggle from light to dark mode
- [x] Toggle from dark to light mode
- [x] Theme persists across page reload

### Navigation
- [x] GitHub link opens repository in new tab

### Toast Notifications
- [x] Toast auto-dismisses after ~4 seconds

## Accessibility (`e2e/accessibility.e2e.ts`)

### Skip-to-Content
- [x] Skip-to-content link is keyboard-reachable and moves focus to main content

### ARIA Labels
- [x] CodeMirror aria-label switches from "Visualização de JSON" to "Editor de JSON" on edit mode

### Disabled States in Edit Mode
- [x] Palette buttons, TypeSelector, ValueInput, delete buttons, and key rename inputs are disabled during JSON edit mode

### Toast Accessibility
- [x] Toast notifications render inside a container with `role="alert"`

### Heading Hierarchy
- [x] h1 ("JSON Visual Editor") and h2 card titles ("Modelo (visual)", "JSON Final") are present
