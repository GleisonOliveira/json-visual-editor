# E2E JSON Panel Flows

## Purpose

E2E test coverage for the JSON panel (right side): edit mode entry/exit, cancel, validate, copy, copy minified, and download flows.

## Requirements

### Requirement: Edit JSON button enters edit mode
E2E tests SHALL verify that clicking "Editar JSON" switches the CodeMirror editor to editable mode and disables the visual editor.

#### Scenario: Enter edit mode
- **WHEN** the user clicks the "Editar JSON" button
- **THEN** the CodeMirror editor becomes editable, the "Editar JSON" button is replaced by "Cancelar" and "Validar" buttons, and the visual editor panel is visually disabled

### Requirement: Cancel editing discards changes
E2E tests SHALL verify that clicking "Cancelar" in edit mode discards changes and restores read-only mode.

#### Scenario: Cancel after typing
- **WHEN** the user enters edit mode, modifies the JSON text, and clicks "Cancelar"
- **THEN** the editor reverts to the original JSON content and the visual editor is re-enabled

### Requirement: Validate applies valid JSON
E2E tests SHALL verify that clicking "Validar" with valid JSON applies the changes to the visual editor.

#### Scenario: Validate with valid JSON
- **WHEN** the user enters edit mode, types valid JSON, and clicks "Validar"
- **THEN** a success toast appears, the editor exits edit mode, and the visual editor reflects the new JSON

### Requirement: Validate shows error on invalid JSON
E2E tests SHALL verify that clicking "Validar" with invalid JSON displays an error message.

#### Scenario: Validate with invalid JSON
- **WHEN** the user enters edit mode, types `{ invalid }`, and clicks "Validar"
- **THEN** an error message appears inline and an error toast is displayed

### Requirement: Copy button copies formatted JSON
E2E tests SHALL verify that the "Copiar" button copies the formatted JSON to the clipboard.

#### Scenario: Copy to clipboard
- **WHEN** the user clicks "Copiar"
- **THEN** a success toast appears and the clipboard contains the formatted JSON string

### Requirement: Copy minified button copies minified JSON
E2E tests SHALL verify that the "Copiar minificado" button copies minified JSON to the clipboard.

#### Scenario: Copy minified to clipboard
- **WHEN** the user clicks "Copiar minificado"
- **THEN** a success toast appears and the clipboard contains a single-line minified JSON string

### Requirement: Download button downloads JSON file
E2E tests SHALL verify that the "Baixar" button triggers a file download.

#### Scenario: Download JSON file
- **WHEN** the user clicks "Baixar"
- **THEN** a file download is initiated with the filename `data.json` containing the formatted JSON
