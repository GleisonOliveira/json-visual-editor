## Why

The project has 24 unit/component test files but zero E2E or integration tests. All existing tests run in jsdom, which cannot verify real browser behavior, drag-and-drop interactions, responsive layouts, or end-to-end user flows. Adding Playwright E2E tests will cover the gaps that unit tests cannot: actual DOM rendering, responsive breakpoints, DnD across panels, toolbar actions against the live app, and cross-viewport behavior.

## What Changes

- Add Playwright as a dev dependency with a `playwright.config.ts` configuration targeting `http://localhost:5173/`
- Create an `e2e/` directory with test files organized by feature area
- Create `TESTS.md` as a living document cataloging all planned E2E test scenarios with checkboxes
- Create/update `PLAN.md` to include the E2E testing initiative as a tracked work item
- Use Playwright MCP at `http://localhost:5173/` for screen exploration during test development
- Add npm scripts: `test:e2e` (headless) and `test:e2e:ui` (headed/debug mode)

## Capabilities

### New Capabilities
- `e2e-playwright-setup`: Playwright configuration, CI integration, dev server lifecycle, and project scaffolding
- `e2e-visual-editor-flows`: E2E tests for the visual editor panel — type selection, value editing, key renaming, expand/collapse, drag-and-drop reorder, palette insertion
- `e2e-json-panel-flows`: E2E tests for the JSON panel — toolbar buttons (copy, download, edit mode, validate, cancel), CodeMirror interaction, toast notifications
- `e2e-responsive-layouts`: E2E tests for responsive behavior — mobile vs desktop layouts, AddFieldForm visibility, toolbar button variants, panel stacking
- `e2e-theme-and-navigation`: E2E tests for theme toggle persistence, GitHub link, and top bar behavior

### Modified Capabilities

(none — no existing specs to modify)

## Impact

- **New files**: `playwright.config.ts`, `tsconfig.e2e.json`, `e2e/` directory with test suites (including `accessibility.e2e.ts` and `helpers.ts`), `TESTS.md`, `PLAN.md`
- **Modified files**: `package.json` (new scripts + devDependency), `tsconfig.json` (new reference to `tsconfig.e2e.json`)
- **Dependencies**: `@playwright/test` added as devDependency
- **Dev server**: Tests require the Vite dev server running on port 5173
- **CI**: Playwright tests need a separate CI step with browser binary installation
- **Existing tests**: No changes to existing Vitest unit tests
