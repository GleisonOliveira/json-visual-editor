## ADDED Requirements

### Requirement: Desktop layout shows two panels side by side
E2E tests SHALL verify that at viewport width >= 900px, both the visual editor and JSON panel are visible side by side.

#### Scenario: Desktop two-column layout
- **WHEN** the browser viewport is 1280x720
- **THEN** both the visual editor panel and JSON panel are visible simultaneously in a two-column layout

#### Scenario: Desktop shows palette panel
- **WHEN** the browser viewport is 1280x720
- **THEN** the PalettePanel with draggable type buttons is visible and the AddFieldForm is hidden

### Requirement: Mobile layout stacks panels vertically
E2E tests SHALL verify that at viewport width < 900px, panels stack vertically and the AddFieldForm replaces the palette.

#### Scenario: Mobile single-column layout
- **WHEN** the browser viewport is 375x812
- **THEN** the visual editor and JSON panel stack vertically (full width each)

#### Scenario: Mobile shows add field form
- **WHEN** the browser viewport is 375x812
- **THEN** the AddFieldForm is visible and the PalettePanel is hidden

### Requirement: Toolbar button variants by viewport
E2E tests SHALL verify that toolbar buttons show as icon-only on mobile and as text buttons on desktop.

#### Scenario: Desktop text toolbar buttons
- **WHEN** the browser viewport is 1280x720
- **THEN** the JSON toolbar buttons display text labels ("Editar JSON", "Copiar", etc.)

#### Scenario: Mobile icon toolbar buttons
- **WHEN** the browser viewport is 375x812
- **THEN** the JSON toolbar buttons display as icon-only buttons with tooltips

### Requirement: Add field form inserts on mobile
E2E tests SHALL verify that the AddFieldForm on mobile can select a target, choose a type, enter a name and value, and insert a field.

#### Scenario: Add field via mobile form
- **WHEN** the browser is at mobile viewport, the user seeds an empty object `{}` via Edit JSON mode, then uses the AddFieldForm to select a target container, choose "string" type, enter a key name and value, and click "Adicionar"
- **THEN** a new field appears in the visual editor and the JSON panel updates
