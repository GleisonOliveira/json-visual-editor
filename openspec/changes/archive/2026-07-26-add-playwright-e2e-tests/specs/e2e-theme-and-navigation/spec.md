## ADDED Requirements

### Requirement: Theme toggle switches between light and dark mode
E2E tests SHALL verify that clicking the theme toggle button switches the MUI theme and persists the choice.

#### Scenario: Toggle to dark mode
- **WHEN** the user clicks the Sun icon (theme toggle) while in light mode
- **THEN** the page background becomes dark and the Moon icon is displayed

#### Scenario: Toggle back to light mode
- **WHEN** the user clicks the Moon icon while in dark mode
- **THEN** the page background becomes light and the Sun icon is displayed

#### Scenario: Theme persists across page reload
- **WHEN** the user toggles to dark mode and reloads the page
- **THEN** the page remains in dark mode after reload

### Requirement: GitHub link opens repository
E2E tests SHALL verify that the GitHub icon button opens the project repository in a new tab.

#### Scenario: Click GitHub link
- **WHEN** the user clicks the GitHub icon button in the top bar
- **THEN** a new browser tab opens with the URL `https://github.com/GleisonOliveira/json-visual-editor`

### Requirement: Toast notification appears and auto-dismisses
E2E tests SHALL verify that toast notifications appear after actions and auto-dismiss after a timeout.

#### Scenario: Toast auto-dismisses
- **WHEN** a success toast appears (e.g., after clicking "Copiar")
- **THEN** the toast is visible initially and disappears after approximately 4 seconds without user interaction
