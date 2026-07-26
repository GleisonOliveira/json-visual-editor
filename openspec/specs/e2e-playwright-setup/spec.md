# E2E Playwright Setup

## Purpose

Infrastructure and configuration for Playwright E2E testing in this project.

## Requirements

### Requirement: Playwright project configuration
The system SHALL have a `playwright.config.ts` at the repo root that configures `@playwright/test` with Chromium-only projects, a `webServer` block that starts `npm run dev` on port 5173, and an `outputDir` pointing to `test-results/`.

#### Scenario: Config loads successfully
- **WHEN** a developer runs `npx playwright test --list`
- **THEN** Playwright discovers all `.e2e.ts` files under `e2e/` without errors

#### Scenario: Dev server auto-starts
- **WHEN** Playwright runs tests with the `webServer` config
- **THEN** the Vite dev server starts on port 5173 and responds to HTTP requests before tests execute

### Requirement: npm scripts for E2E tests
The `package.json` SHALL include two new scripts: `test:e2e` (runs Playwright headless) and `test:e2e:ui` (runs Playwright with the interactive UI mode).

#### Scenario: Headless E2E run
- **WHEN** a developer runs `npm run test:e2e`
- **THEN** Playwright executes all `.e2e.ts` tests in headless Chromium and reports results

#### Scenario: UI mode for debugging
- **WHEN** a developer runs `npm run test:e2e:ui`
- **THEN** Playwright opens the interactive test runner UI for step-through debugging

### Requirement: Test directory structure
The system SHALL have an `e2e/` directory at the repo root containing `.e2e.ts` test files, organized by feature area. Each file SHALL use `test.describe` blocks to group related scenarios.

#### Scenario: Test discovery
- **WHEN** Playwright scans the `e2e/` directory
- **THEN** it finds test files matching `*.e2e.ts` pattern and registers all test cases

### Requirement: E2E tests pass TypeScript and ESLint checks
The `e2e/` directory SHALL be included in a tsconfig so that `npm run typecheck` and `npm run lint` cover all E2E test files. No type errors or lint warnings SHALL exist in the e2e test files.

#### Scenario: Typecheck covers e2e
- **WHEN** a developer runs `npm run typecheck`
- **THEN** all `.e2e.ts` files under `e2e/` are type-checked without errors

#### Scenario: Lint covers e2e
- **WHEN** a developer runs `npm run lint`
- **THEN** all `.e2e.ts` files under `e2e/` are linted without errors

### Requirement: E2E tests verify accessibility features
E2E tests SHALL verify that key accessibility features are present and functional. Tests SHALL use accessibility-first selectors (`getByRole`, `getByLabel`, `getByText`) and SHALL explicitly assert ARIA attributes, keyboard reachability, disabled states, heading hierarchy, and screen reader announcements where applicable.

#### Scenario: Skip-to-content link is keyboard-reachable
- **WHEN** the user presses Tab from the top of the page
- **THEN** a "Pular para o conteudo" link becomes visible and, when activated, moves focus to the main content area

#### Scenario: CodeMirror aria-label changes on mode switch
- **WHEN** the user enters edit mode via "Editar JSON"
- **THEN** the CodeMirror editor's aria-label changes from "Visualizacao de JSON" to "Editor de JSON"

#### Scenario: Edit mode disables interactive controls
- **WHEN** the user is in JSON edit mode
- **THEN** palette buttons, TypeSelector comboboxes, ValueInput fields, delete buttons, and key rename inputs are all disabled or aria-disabled

#### Scenario: Toast notifications are accessible
- **WHEN** a toast appears after an action (e.g., copy, validate)
- **THEN** the toast is rendered inside a container with `role="alert"` so screen readers announce it

#### Scenario: Heading hierarchy is correct
- **WHEN** the page loads
- **THEN** an h1 heading ("JSON Visual Editor") is present, and card titles ("Modelo (visual)", "JSON Final") render as h2 headings

### Requirement: All E2E tests must pass
`npx playwright test` SHALL exit with zero failures. A test task SHALL NOT be marked as done unless its corresponding test passes in a full run. Broken tests SHALL be tracked in the tasks artifact with their root cause until fixed.

#### Scenario: Full test suite passes
- **WHEN** a developer runs `npx playwright test`
- **THEN** all tests pass with 0 failures

### Requirement: Shared E2E test helpers
The `e2e/` directory SHALL contain a `helpers.ts` file exporting common test utilities (e.g., `seedJson`). Type imports SHALL use standard `import type` syntax (e.g., `import type { Page } from '@playwright/test'`) rather than inline type annotations (e.g., `import('@playwright/test').Page`).

#### Scenario: Helpers are shared across test files
- **WHEN** a developer reads any `.e2e.ts` file
- **THEN** `seedJson` is imported from `e2e/helpers.ts` and no local duplicated definition exists

#### Scenario: Type imports use standard syntax
- **WHEN** a developer reads any `.e2e.ts` file or `e2e/helpers.ts`
- **THEN** all `@playwright/test` types are imported via `import type` syntax

### Requirement: Playwright MCP for screen exploration
During test development, the Playwright MCP server SHALL be used to explore the live application at `http://localhost:5173/` to inspect DOM structure, capture accessibility snapshots, and identify element selectors.

#### Scenario: MCP explores live app
- **WHEN** a developer invokes Playwright MCP tools against `http://localhost:5173/`
- **THEN** the MCP returns page snapshots, accessibility trees, and element references for building test selectors
