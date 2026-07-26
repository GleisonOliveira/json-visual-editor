## Context

The JSON Visual Editor is a React 19 + Vite 8 SPA with a two-panel layout: a visual tree editor (left) and a CodeMirror JSON editor (right). The app currently has 24 unit/component test files using Vitest + jsdom, but zero E2E tests. jsdom cannot simulate real browser rendering, drag-and-drop events, responsive layouts, or clipboard/file APIs reliably. This change introduces Playwright as the E2E testing layer to verify real user flows against the running app at `http://localhost:5173/`.

Playwright MCP (`@playwright/mcp`) will be used during test development to explore the live UI at `http://localhost:5173/`, inspect element states, and capture accessibility snapshots for building robust selectors.

## Goals / Non-Goals

**Goals:**
- Add Playwright test infrastructure (`@playwright/test`, `playwright.config.ts`, npm scripts)
- Create E2E test suites covering: visual editor flows, JSON panel flows, responsive layouts, theme/navigation
- Create `TESTS.md` as a living checklist of all E2E test scenarios with checkboxes
- Create/update `PLAN.md` to track the E2E initiative as a project work item
- Use Playwright MCP for interactive screen exploration during test authoring

**Non-Goals:**
- Replacing existing Vitest unit tests (they remain as-is)
- Visual regression / screenshot comparison testing
- Cross-browser testing (Chromium only for now; Firefox/WebKit can be added later)
- CI/CD pipeline changes (Playwright CI integration is a follow-up)
- Performance or load testing
- Direct Zustand store manipulation in tests (tests must navigate via UI only)

## Decisions

### 1. Playwright over Cypress
**Choice**: `@playwright/test`
**Rationale**: Playwright has native multi-browser support, faster execution, better auto-waiting, built-in tracing, and a more modern API. Cypress has a steeper learning curve for SPA testing and requires additional plugins for multi-tab scenarios. Playwright's `test.describe` + `expect` API aligns well with the project's existing Vitest patterns.
**Alternatives considered**: Cypress (rejected — slower, more opinionated, requires paid dashboard for parallelism).

### 2. Dev server lifecycle via Playwright config
**Choice**: Configure `webServer` in `playwright.config.ts` to auto-start `npm run dev` on port 5173 before tests.
**Rationale**: Eliminates manual dev server management. Playwright waits for the server to respond before running tests.
**Alternatives considered**: Manual `npm run dev` in a separate terminal (rejected — fragile, not CI-friendly).

### 3. Test file organization by feature area
**Choice**: `e2e/` directory with files named by feature: `visual-editor.e2e.ts`, `json-panel.e2e.ts`, `responsive.e2e.ts`, `theme.e2e.ts`.
**Rationale**: Mirrors the app's component hierarchy and makes it clear which user flows each file covers. Avoids the anti-pattern of one giant test file.
**Alternatives considered**: Page Object Model (rejected for now — adds abstraction overhead for a small app; can be introduced later if tests grow).

### 4. Accessibility-first selectors
**Choice**: Prefer `getByRole`, `getByLabel`, `getByText` selectors over CSS selectors.
**Rationale**: These selectors are resilient to UI changes, document intent, and are recommended by Playwright best practices. The app already uses MUI components with ARIA labels.
**Alternatives considered**: CSS selectors (rejected — brittle), `data-testid` attributes (used as fallback only).

### 5. Single-viewport desktop default with explicit mobile tests
**Choice**: Default viewport 1280x720 (desktop). Mobile tests explicitly resize to 375x812 (iPhone 13).
**Rationale**: Most tests run at desktop resolution where both panels are visible. Mobile-specific tests use `test.describe` blocks with explicit viewport configuration.

### 6. No direct store manipulation — tests navigate like a real user
**Choice**: All E2E test data SHALL be set up through the UI, never via direct Zustand store access (`window.__jsonStore`, `page.evaluate`, etc.).
**Rationale**: E2E tests must validate real user flows end-to-end. Bypassing the UI to set state defeats the purpose of E2E testing and hides bugs in the data entry path. Tests should navigate like a regular user: load the app, use the "Editar JSON" button to paste test data via CodeMirror, validate, then interact with the visual editor.
**Alternatives considered**: Direct store manipulation via `page.evaluate` (rejected — bypasses UI, hides bugs, couples tests to store internals).

### 7. TESTS.md and PLAN.md as project-level documents
**Choice**: Create `TESTS.md` and `PLAN.md` at the repo root as living documents.
**Rationale**: Provides a human-readable overview of what is tested and what remains. Checkboxes allow tracking progress. These documents will be updated as tests are added.

### 8. E2E TypeScript and ESLint integration
**Choice**: Create a `tsconfig.e2e.json` that includes `e2e/**/*.ts` with `@playwright/test` types and DOM lib, and add it to the root `tsconfig.json` references.
**Rationale**: The existing `tsconfig.app.json` only covers `src/`. Without a dedicated tsconfig, `npm run typecheck` and `npm run lint` skip e2e files, allowing type errors and lint violations to accumulate undetected.
**Alternatives considered**: Adding `e2e` to `tsconfig.app.json` (rejected — mixes app source with test infrastructure; different `lib` and `types` needs).

### 9. Accessibility verification in E2E tests
**Choice**: E2E tests SHALL explicitly verify accessibility features — ARIA labels, roles, keyboard reachability, disabled states during edit mode, heading hierarchy, and toast `role="alert"` — not merely use them as selectors.
**Rationale**: Using accessibility-first selectors (Decision 4) ensures tests *work* with accessible elements but does not guarantee the elements *are* accessible. Explicit assertions catch regressions where ARIA attributes are removed or headings are demoted. The app already has skip-to-content links, CodeMirror aria-labels, tooltip-based accessible names on icon buttons, and MUI Snackbar with implicit `role="alert"` — all of which deserve E2E coverage.
**Alternatives considered**: Relying on unit tests for a11y (rejected — unit tests run in jsdom and cannot verify real DOM rendering, focus behavior, or computed ARIA states).

### 10. All E2E tests must pass before the change is complete
**Choice**: A task SHALL NOT be marked as done unless `npx playwright test` exits with zero failures. The tasks artifact SHALL list every broken test with its root cause, and Section 10 of tasks.md tracks the fix queue.
**Rationale**: Marking tests complete while they fail gives a false sense of coverage. The initial implementation produced 13 failing tests due to incorrect selectors (root TypeSelector not rendered for objects, "Copiar" matching ambiguity), missing clipboard permissions, wrong drop payload assertions, and incorrect mobile form option matching. All must be fixed before the change is valid.
**Alternatives considered**: Accepting partial pass rate (rejected — undermines confidence in the test suite).

### 11. Shared test helpers with standard type imports
**Choice**: Extract common test utilities (e.g., `seedJson`) into `e2e/helpers.ts` and import them via standard `import type { Page }` syntax rather than inline `import('@playwright/test').Page` type annotations.
**Rationale**: Eliminates 5× duplication of the `seedJson` function. Standard imports are clearer, enforce compile-time checking, and align with the project's `verbatimModuleSyntax: true` TypeScript config. Inline `import()` types are harder to read and maintain.
**Alternatives considered**: Keep `seedJson` duplicated in each file (rejected — violates DRY; changes to the seeding flow require editing 5 files).

### 11. Shared test helpers with standard type imports
**Choice**: Extract common test utilities (e.g., `seedJson`) into `e2e/helpers.ts` and import them via standard `import type { Page }` syntax rather than inline `import('@playwright/test').Page` type annotations.
**Rationale**: Eliminates 5× duplication of the `seedJson` function. Standard imports are clearer, enforce compile-time checking, and align with the project's `verbatimModuleSyntax: true` TypeScript config. Inline `import()` types are harder to read and maintain.
**Alternatives considered**: Keep `seedJson` duplicated in each file (rejected — violates DRY; changes to the seeding flow require editing 5 files).

## Risks / Trade-offs

- **[Flaky DnD tests]** → Drag-and-drop is inherently timing-sensitive. Mitigation: Use Playwright's `dragTo()` with generous timeouts and retry logic. Isolate DnD tests in their own `describe` block.
- **[Dev server port conflicts]** → If port 5173 is occupied, tests fail. Mitigation: Configurable port via env var `PORT` in `playwright.config.ts`.
- **[CI browser installation]** → Playwright browsers need to be installed in CI. Mitigation: Add `npx playwright install --with-deps chromium` to CI setup. This is a follow-up task.
- **[Test maintenance burden]** → E2E tests break when UI changes. Mitigation: Use role-based selectors, keep tests focused on user-visible behavior, avoid testing implementation details.
