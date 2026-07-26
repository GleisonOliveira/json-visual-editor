## 1. Playwright Infrastructure Setup

- [x] 1.1 Install `@playwright/test` as devDependency and run `npx playwright install chromium`
- [x] 1.2 Create `playwright.config.ts` with Chromium project, webServer block (port 5173), and outputDir `test-results/`
- [x] 1.3 Add npm scripts to `package.json`: `test:e2e` (headless) and `test:e2e:ui` (interactive)
- [x] 1.4 Create `e2e/` directory at repo root
- [x] 1.5 Verify Playwright discovers tests: `npx playwright test --list`

## 2. PLAN.md and TESTS.md Documents

- [x] 2.1 Create `PLAN.md` at repo root with the E2E testing initiative as a tracked section, including a note to use Playwright MCP at `http://localhost:5173/` for screen exploration
- [x] 2.2 Create `TESTS.md` at repo root with all planned E2E test scenarios organized by feature area, each with a checkbox

## 3. Visual Editor E2E Tests

- [x] 3.1 Write `e2e/visual-editor.e2e.ts` — root type selection tests: seed data via Edit JSON, then use TypeSelector to convert types (object→string, object→array)
- [x] 3.2 Write inline value editing tests: seed data via Edit JSON, then edit string/number/boolean values through UI inputs and verify JSON panel updates
- [x] 3.3 Write object key rename test: seed object via Edit JSON, rename key through UI, verify JSON panel updates
- [x] 3.4 Write delete node tests: seed data via Edit JSON, delete object property and array item via UI, verify JSON panel updates
- [x] 3.5 Write expand/collapse tests: seed nested object via Edit JSON, toggle expand/collapse buttons, verify visibility changes
- [x] 3.6 Use Playwright MCP to explore drag-and-drop interactions at `http://localhost:5173/`, then write palette insertion and node reorder tests (seed data via Edit JSON where needed)

## 4. JSON Panel E2E Tests

- [x] 4.1 Write `e2e/json-panel.e2e.ts` — edit mode entry/exit tests
- [x] 4.2 Write cancel editing test (modify → cancel → reverts)
- [x] 4.3 Write validate tests (valid JSON applies, invalid JSON shows error)
- [x] 4.4 Write copy button test (formatted JSON to clipboard)
- [x] 4.5 Write copy minified button test (minified JSON to clipboard)
- [x] 4.6 Write download button test (triggers `data.json` download)

## 5. Responsive Layout E2E Tests

- [x] 5.1 Write `e2e/responsive.e2e.ts` — desktop layout test (1280x720: two columns, palette visible, AddFieldForm hidden)
- [x] 5.2 Write mobile layout test (375x812: stacked panels, AddFieldForm visible, palette hidden)
- [x] 5.3 Write toolbar variant tests (desktop text buttons vs mobile icon-only buttons)
- [x] 5.4 Write mobile add field form insertion test

## 6. Theme and Navigation E2E Tests

- [x] 6.1 Write `e2e/theme.e2e.ts` — theme toggle test (light→dark, dark→light)
- [x] 6.2 Write theme persistence test (toggle → reload → persists)
- [x] 6.3 Write GitHub link test (opens new tab with correct URL)
- [x] 6.4 Write toast auto-dismiss test (toast appears then disappears after ~4s)

## 7. Update TESTS.md Checkboxes

- [x] 7.1 Mark completed test scenarios as done in `TESTS.md`

## 8. TypeScript and ESLint Integration for E2E

- [x] 8.1 Create `tsconfig.e2e.json` that includes `e2e/**/*.ts` with `@playwright/test` types and DOM lib
- [x] 8.2 Add `tsconfig.e2e.json` to root `tsconfig.json` references
- [x] 8.3 Verify `npm run typecheck` passes with zero errors on e2e files
- [x] 8.4 Verify `npm run lint` passes with zero errors on e2e files

## 9. Accessibility E2E Tests

- [x] 9.1 Write `e2e/accessibility.e2e.ts` — skip-to-content link is keyboard-reachable and moves focus to main content
- [x] 9.2 Verify CodeMirror aria-label switches from "Visualização de JSON" to "Editor de JSON" on edit mode entry
- [x] 9.3 Verify edit mode disables palette buttons, TypeSelector, ValueInput, delete buttons, and key rename inputs
- [x] 9.4 Verify toast notifications render inside a container with `role="alert"`
- [x] 9.5 Verify heading hierarchy: h1 ("JSON Visual Editor"), h2 card titles ("Modelo (visual)", "JSON Final")
- [x] 9.6 Mark accessibility test scenarios as done in `TESTS.md`

## 10. Fix Broken E2E Tests

**Completion criterion**: `npx playwright test` must exit with 0 failures. Tasks 1–9 are NOT valid until Section 10 is fully resolved.

Root causes identified by running `npx playwright test` (13 of 31 tests fail):

### Category A — Root TypeSelector not rendered for objects (7 tests)
When root is `{}` (object), `NodeEditor` does NOT render a TypeSelector — it only renders expand/collapse buttons, children, and a drop zone. Tests that seed `{}` then click the root TypeSelector timeout.

- [x] 10.1 Fix `visual-editor.e2e.ts` tests 3.1 (object→string, object→array): seed a primitive like `"hello"` or `0` instead of `{}`, or navigate into the object to find a child TypeSelector
- [x] 10.2 Fix `visual-editor.e2e.ts` tests 3.2 (edit number, toggle boolean): same root cause — seed objects with values like `{"count":0}` and target the *child* number/boolean input, not a nonexistent root input
- [x] 10.3 Fix `visual-editor.e2e.ts` tests 3.4 (delete object property, delete array item): the `getByRole('button', { name: /Deletar .../ })` selector likely does not match because MUI Tooltip wraps the IconButton and the accessible name comes from the tooltip, not from the button itself — verify the actual rendered role/name

### Category B — "Copiar" button selector ambiguity (4 tests)
`getByRole('button', { name: 'Copiar' })` matches both "Copiar" and "Copiar minificado" (Playwright non-existent substring match). Fix: use `{ exact: true }`.

- [x] 10.4 Fix `json-panel.e2e.ts` test 4.4 (copy formatted): use `getByRole('button', { name: 'Copiar', exact: true })`
- [x] 10.5 Fix `responsive.e2e.ts` test 5.3 desktop (toolbar text buttons): same fix
- [x] 10.6 Fix `responsive.e2e.ts` test 5.3 mobile (toolbar icon buttons): same fix
- [x] 10.7 Fix `theme.e2e.ts` test 6.4 (toast auto-dismiss): same fix

### Category C — Clipboard read permission denied (2 tests)
`navigator.clipboard.readText()` fails in headless Chromium with `NotAllowedError`. Fix: grant clipboard permission in `playwright.config.ts` via `contextOptions.permissions: ['clipboard-read', 'clipboard-write']` or use `page.grantPermissions()`.

- [x] 10.8 Fix `json-panel.e2e.ts` tests 4.4 and 4.5: add clipboard permissions to Playwright config or test setup
- [x] 10.9 Fix `visual-editor.e2e.ts` test 3.6 (palette drop): assert `"newField"` instead of `"item"`, or investigate the actual drop handler behavior
- [x] 10.10 Fix `responsive.e2e.ts` test 5.4 (mobile add field): inspect the actual option text and update the regex

### Verification

- [x] 10.11 Run `npx playwright test` and confirm 0 failures

## 11. E2E Test Code Quality

**Completion criterion**: `npm run typecheck`, `npm run lint`, and `npx playwright test` must all exit with zero failures after each task.

- [x] 11.1 Create `e2e/helpers.ts` exporting a shared `seedJson(page, json)` utility, using `import type { Page } from '@playwright/test'` (standard import, not inline `import('@playwright/test').Page`)
- [x] 11.2 Refactor all 5 e2e test files to import `seedJson` from `e2e/helpers.ts`, remove the duplicated local definitions, and replace all inline `import('@playwright/test').Page` type annotations with the imported `Page` type
- [x] 11.3 Run `npm run typecheck`, `npm run lint`, and `npx playwright test` — all three must pass with zero failures before marking tasks 11.1 and 11.2 as done
