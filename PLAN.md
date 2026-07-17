# Refactoring Plan — JSON Visual Editor

Comprehensive refactoring plan to restructure the project with clean architecture, atomic design, services layer with DI, template/composable separation, and full test coverage.

**Live site for behavior verification:** https://jsonvisualeditor.com/

---

## Global Acceptance Criteria (applies to ALL phases)

Every phase MUST pass these gates before proceeding:

1. `npm run test` — all tests pass, 0 failures
2. `npm run typecheck` — zero type errors
3. `npm run lint` — zero warnings (`--max-warnings 0`)
4. `npm run build` — production build succeeds
5. **Per-file test coverage:** Every file created/modified must have a corresponding test file. No exceptions:
   - `src/services/FooService.ts` → `src/services/__tests__/FooService.test.ts` (unit tests)
   - `src/components/atoms/foo/Foo.tsx` → `src/components/atoms/foo/__tests__/Foo.test.tsx` (behavioral tests)
   - `src/store/barStore/index.ts` → `src/store/barStore/__tests__/barStore.test.ts` (state/data tests)
6. **Playwright validation:** Every rewritten component/phase must be validated against https://jsonvisualeditor.com/ using the Playwright MCP. All current behaviors must be present and identical in the edited component — no behavior removed, no behavior added, no behavior altered. This includes:
   - All visual states (enabled, disabled, hidden, expanded, collapsed)
   - All interactions (click, drag, type, blur, keyboard)
   - All effects (toast notifications, theme changes, localStorage persistence)
   - All responsive behaviors (mobile layout, desktop layout, icon-only toolbar, full toolbar)
   - All edge cases (empty JSON, invalid JSON validation, null toggle, type conversion)
   - All visual feedback (drag-over outlines, opacity changes, dashed borders)
7. **Typing rules (enforced by ESLint + TypeScript):**
   - `any` is **forbidden** — zero tolerance, enforced by `@typescript-eslint/no-explicit-any: error`
   - `unknown` may **only** be used when the type genuinely cannot be inferred at compile time (e.g., `JSON.parse()` return, external API responses before validation). When the type CAN be inferred or narrowed, use the exact type.
   - **Every function must have an explicit return type** — enforced by `@typescript-eslint/explicit-function-return-type: error`. This includes: exported functions, class methods, arrow functions assigned to variables, callback parameters with complex signatures.
   - All `unsafe-*` ESLint rules enabled (`no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`) — no implicit `any` propagation.
   - **Type file organization:** Types must be in separate `.ts` files co-located next to the component/class they belong to (e.g., `Foo.types.ts` next to `Foo.tsx`). Only truly shared types go in `src/types/`.
   - `tsconfig.app.json` strict mode enabled: `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `noImplicitOverride: true`.
8. **Documentation comments:** Every component, class, function, and type/interface must have a JSDoc comment explaining **how** it is used and **why** it exists. Rules:
   - **Components** (`Foo.tsx`): JSDoc on the component describing its role in the atomic design hierarchy, what it renders, and when to use it.
   - **Classes** (services): JSDoc on the class explaining its responsibility, and JSDoc on each public method explaining parameters, return value, and usage context.
   - **Functions** (hooks, composables, utilities): JSDoc describing purpose, parameters, return value, and side effects (if any).
   - **Types/Interfaces**: JSDoc explaining what the type represents and where it is used.
   - **Constants/Symbols**: JSDoc explaining the value and its role (e.g., DI tokens).
   - Comments must be in **English**.
   - Use `/** ... */` JSDoc format (not `//` line comments).
   - Do NOT over-document trivial getters/setters or obvious one-liners — focus on **why**, not **what**.

---

## Current Behavior Baseline (Verified via Playwright)

### Desktop (1280x800)

**TopBar:**
- Title "JSON Visual Editor" with Braces icon
- Theme toggle: "Tema escuro"/"Tema claro" with localStorage persistence
- GitHub link ("Ver no GitHub")

**Left Panel — "Modelo (visual)":**
- 6 palette buttons: string, number, boolean, object, array, null (outlined, draggable)
- ContainerDropZone: "Arraste itens para cá"
- When node created via palette drag: auto-expanded (complex types), shows delete/key/type/value
- Type selector options: Texto, Número, Boolean, Objeto, Array, Nulo
- Changing type converts value (e.g. string→number: "item"→0)
- Object/array nodes: only show type selector (no value input), expand/collapse chevron
- Expand/Collapse: individual per node + "Expandir todos"/"Recolher todos" bulk buttons
- Key rename: text input committed on blur, renamed key moves to end of object
- Delete: trash icon per node
- Drag handle: GripVertical icon for reordering

**Right Panel — "JSON Final":**
- CodeMirror with JSON syntax highlighting, formatted 2-space indent
- Toolbar: Editar JSON, Copiar, Copiar minificado, Baixar
- Edit mode: Cancelar/Validar, CodeMirror editable, all palette+tree fields disabled
- Validate: parses JSON, applies if valid, error toast if invalid
- Copy: formatted JSON to clipboard
- Copy minified: minified JSON to clipboard
- Download: saves as "data.json"
- All actions show success/error toast (Snackbar, autoHide 4s)

### Mobile (375x812)

**Left Panel:**
- AddFieldForm visible (palette buttons hidden): target selector, type selector, name input, value input, null toggle, "Adicionar" button
- Target selector shows all available targets with kind (e.g. "Início (object)")
- Name field disabled when parent is array
- Null toggle disables type+value inputs

**Right Panel:**
- Toolbar: icon-only buttons with tooltips
- Edit mode: icon-only Cancelar/Validar

**Layout:** Single column, stacked vertically

### Cross-cutting
- Theme: light/dark toggle, localStorage persistence, prefers-color-scheme fallback
- Responsive: desktop 2-column, mobile 1-column stacked
- Toast: Snackbar at bottom-center, 4s auto-hide
- Palette buttons disabled in edit mode
- Tree fields disabled in edit mode
- AddFieldForm disabled in edit mode

---

## Phase 0: Infrastructure Setup

**Objective:** Testing + DI infrastructure.

### Tasks

- [x] 0.1. Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `inversify`, `reflect-metadata`
- [x] 0.2. Create `vitest.config.ts` (jsdom env, setup file, v8 coverage, path aliases matching tsconfig.app.json)
- [x] 0.3. Create `src/test/setup.ts` (import `@testing-library/jest-dom/vitest`)
- [x] 0.4. Add scripts to package.json: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`
- [x] 0.5. Verify: `npm run test` runs (0 tests, clean baseline)
- [x] 0.6. Verify: `npm run typecheck && npm run lint` still pass
- [x] 0.7. Verify: `npm run build` still succeeds

### Acceptance Criteria
- [x] `vitest.config.ts` exists and is correct
- [x] `src/test/setup.ts` exists
- [x] `npm run test` executes with 0 tests, exit code 0
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes

---

## Phase 1: Services Layer

**Objective:** Extract all pure logic into service classes with constructor DI.

### Per-File Requirement
Every service file MUST have a corresponding `__tests__/*.test.ts` file. Tests must cover: happy path, edge cases, error paths, boundary conditions.

### Tasks

- [ ] 1.1. Create `src/services/JsonTreeService.ts` + `__tests__/JsonTreeService.test.ts`
  - Test: `getAtPath` with nested paths, empty path, single-segment path
  - Test: `setAtPath` with nested updates, root updates, deep nesting
  - Test: `removeAtPath` from objects, from arrays, at root
  - Test: `insertAtPath` at start/middle/end of arrays, into objects, with insertAfter flag
  - Test: `isAncestorOrEqual` for ancestor, descendant, equal, empty paths
  - Test: `isComplexValue` for string, number, boolean, null, object, array
  - Test: `enumerateTargets` on empty root, single level, deeply nested
  - Test: `collectComplexKeys` on empty, flat, nested structures
  - Test: `isPalettePayload`, `isObject`, `isArray` type guards
- [ ] 1.2. Create `src/services/JsonMutationService.ts` + `__tests__/JsonMutationService.test.ts`
  - Test: `buildDefaultValue` for string, number, boolean, object, array, null
  - Test: `moveNode` same parent, different parents, ancestor protection, same position
  - Test: `insertFromPalette` for all 6 types
  - Test: `updatePrimitive` at various depths
  - Test: `applyInsert` for object target, array target
  - Test: `expandInserted` expands the newly added key
- [ ] 1.3. Create `src/services/JsonValidationService.ts` + `__tests__/JsonValidationService.test.ts`
  - Test: `validateAddFieldForm` valid string/number/boolean/object/array
  - Test: `validateAddFieldForm` empty name error, invalid number error
  - Test: `validateJsonString` valid JSON, invalid JSON, empty string
- [ ] 1.4. Create `src/services/ClipboardService.ts` + `__tests__/ClipboardService.test.ts`
  - Test: `writeText` success path (mock clipboard API)
  - Test: `writeText` failure path (mock rejection)
- [ ] 1.5. Create `src/services/FileDownloadService.ts` + `__tests__/FileDownloadService.test.ts`
  - Test: `downloadJson` creates blob and triggers download (mock createElement/click)
- [ ] 1.6. Delete `src/lib/jsonUtils.ts`
- [ ] 1.7. Verify: `npm run test` — all service tests pass
- [ ] 1.8. Verify: `npm run typecheck && npm run lint` pass
- [ ] 1.9. Verify: `npm run build` succeeds
- [ ] 1.10. Verify against live site: drag "string" to drop zone → field appears, JSON updates. This confirms the extracted services work identically.

### Acceptance Criteria
- [ ] 5 service files exist in `src/services/`
- [ ] 5 test files exist in `src/services/__tests__/`
- [ ] `src/lib/jsonUtils.ts` deleted
- [ ] Every service method has at least 1 test
- [ ] Every service has edge case tests
- [ ] Coverage >= 90% for `src/services/`
- [ ] `npm run test` passes (0 failures)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Playwright: palette drag-and-drop works (string → drop zone → field created → JSON updated)

---

## Phase 2: DI Container

**Objective:** Create inversify composition root.

### Per-File Requirement
Container file MUST have a test that verifies all bindings resolve to correct types.

### Tasks

- [ ] 2.1. Create `src/core/types.ts` with DI token Symbols for all 5 services
- [ ] 2.2. Create `src/core/container.ts` + `__tests__/container.test.ts`
  - Test: container resolves JsonTreeService (instanceof check)
  - Test: container resolves JsonMutationService (instanceof check)
  - Test: container resolves JsonValidationService (instanceof check)
  - Test: container resolves ClipboardService (instanceof check)
  - Test: container resolves FileDownloadService (instanceof check)
  - Test: JsonMutationService receives JsonTreeService via DI
- [ ] 2.3. Decorate all service classes with `@injectable()` and `@inject()`
- [ ] 2.4. Initialize container in `src/main.tsx`
- [ ] 2.5. Verify: `npm run test` passes
- [ ] 2.6. Verify: `npm run typecheck && npm run lint` pass
- [ ] 2.7. Verify against live site: app loads, all interactions work (theme toggle, add field, delete field)

### Acceptance Criteria
- [ ] `src/core/types.ts` exists with 5 DI tokens
- [ ] `src/core/container.ts` exists
- [ ] `src/core/__tests__/container.test.ts` exists with 6 tests
- [ ] All 5 services have `@injectable()` decorator
- [ ] All DI dependencies have `@inject()` decorator
- [ ] Container initializes in `main.tsx`
- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Playwright: app loads, theme toggles, palette drag works

---

## Phase 3: Store Refactoring

**Objective:** Update stores to use services from DI container. Split actions.

### Per-File Requirement
Every store file MUST have a corresponding test file. Tests must verify state mutations.

### Tasks

- [ ] 3.1. Create `src/store/jsonStore/actions.ts` + `__tests__/actions.test.ts`
  - Test: `setJsonValue` replaces root
  - Test: `handleUpdate` updates primitive at path
  - Test: `handleMove` reorders within same parent
  - Test: `handleMove` reorders across parents
  - Test: `handleMove` prevents ancestor-to-descendant move
  - Test: `handleInsert` inserts string type
  - Test: `handleInsert` inserts object type
  - Test: `handleInsert` inserts array type
  - Test: `handleApplyInsert` inserts into object target
  - Test: `handleApplyInsert` inserts into array target
- [ ] 3.2. Create `src/store/uiStore/__tests__/uiStore.test.ts`
  - Test: `toggleMode` switches light↔dark
  - Test: `toggleMode` persists to localStorage
  - Test: `toggleExpand` adds/removes key
  - Test: `expandPath` adds path key
  - Test: `collapseAll` clears expanded set
  - Test: `expandAll` populates expanded set
  - Test: `startEditing` sets editingJson, editingText, clears error
  - Test: `cancelEditing` clears editingJson, editingText, editError
  - Test: `setToast` sets toast, `setToast(null)` clears
  - Test: all form field setters update correctly
- [ ] 3.3. Update `jsonStore/index.ts` to import from actions.ts (using services)
- [ ] 3.4. Verify: `npm run test` passes
- [ ] 3.5. Verify: `npm run typecheck && npm run lint` pass
- [ ] 3.6. Playwright validation against live site:
  - [ ] Drag "string" to drop zone → field created → JSON shows `{"newField": ""}`
  - [ ] Drag "object" to drop zone → nested object appears → expand/collapse works
  - [ ] Delete field → field removed → JSON reverts to `{}`
  - [ ] Type "0" in number field → JSON updates
  - [ ] Rename key on blur → JSON updates with new key name
  - [ ] Theme toggle → persists after page reload

### Acceptance Criteria
- [ ] `src/store/jsonStore/actions.ts` exists
- [ ] `src/store/jsonStore/__tests__/actions.test.ts` exists with 10+ tests
- [ ] `src/store/uiStore/__tests__/uiStore.test.ts` exists with 12+ tests
- [ ] Stores import services from DI container
- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All 6 Playwright checks pass

---

## Phase 4: Component Restructuring (Atomic Design + Template/Composable)

**Objective:** Reorganize into atoms/molecules/organisms. Split each into template+composable.

### Per-File Requirement
Every component file (`Foo.tsx` + `useFoo.ts`) MUST have a corresponding `__tests__/Foo.test.tsx`. Tests must verify:
- Correct rendering of UI elements
- User interactions produce expected behavior
- Store state changes are reflected
- Disabled/locked states work correctly
- Responsive behavior (mobile/desktop)

### Atomic Design Mapping

**Atoms:**
| Component | Location | Extracted From |
|-----------|----------|---------------|
| NumberField | `atoms/number-field/` | existing |
| ContainerDropZone | `atoms/container-drop-zone/` | existing |
| TypeSelector | `atoms/type-selector/` | InlineNodeEditor |
| ValueInput | `atoms/value-input/` | InlineNodeEditor |
| PaletteButton | `atoms/palette-button/` | VisualEditor |

**Molecules:**
| Component | Location | Extracted From |
|-----------|----------|---------------|
| ObjectItem | `molecules/object-item/` | NodeEditor |
| ArrayItem | `molecules/array-item/` | NodeEditor |
| InlineNodeEditor | `molecules/inline-node-editor/` | NodeEditor |
| AddFieldForm | `molecules/add-field-form/` | existing |
| PalettePanel | `molecules/palette-panel/` | VisualEditor |
| JsonToolbar | `molecules/json-toolbar/` | JsonPanel |

**Organisms:**
| Component | Location | Extracted From |
|-----------|----------|---------------|
| NodeEditor | `organisms/node-editor/` | existing |
| JsonPanel | `organisms/json-panel/` | existing |
| VisualEditor | `organisms/visual-editor/` | existing |
| TopBar | `organisms/top-bar/` | existing |

### Template + Composable Pattern
```
component-name/
├── ComponentName.tsx      # Template: JSX only, calls composable
├── useComponentName.ts    # Composable: state, effects, handlers
└── __tests__/
    └── ComponentName.test.tsx
```

### Tasks

- [ ] 4.1. Create `src/components/atoms/`, `molecules/`, `organisms/` directories
- [ ] 4.2. Extract **TypeSelector** atom + test
  - Test: renders current type from props
  - Test: onChange fires with new type
  - Test: disabled when locked=true
- [ ] 4.3. Extract **ValueInput** atom + test
  - Test: renders TextField for string type
  - Test: renders NumberField for number type
  - Test: renders Select for boolean type
  - Test: renders nothing for object/array types
  - Test: disabled when locked=true
  - Test: onChange fires with correct value
- [ ] 4.4. Extract **PaletteButton** atom + test
  - Test: renders with correct icon and label
  - Test: draggable=true when editingJson=false
  - Test: draggable=false when editingJson=true
  - Test: disabled when editingJson=true
- [ ] 4.5. Move **NumberField** + test
  - Test: renders with initial value
  - Test: typing updates local text state
  - Test: blur commits numeric value
  - Test: blur with invalid input resets to 0
  - Test: typing "1." preserves mid-edit state
- [ ] 4.6. Move **ContainerDropZone** + test
  - Test: renders "Arraste itens para cá" text
  - Test: visual feedback on dragEnter (border color changes)
  - Test: palette drop inserts new field into store
  - Test: reorder drop moves node in store
  - Test: locked=true prevents drop
- [ ] 4.7. Extract **ObjectItem** molecule + test
  - Test: renders delete button, key input, type selector, value input
  - Test: delete button removes key from store
  - Test: key rename on blur updates store
  - Test: expand/collapse toggles children visibility
  - Test: expand button shows ChevronDown/ChevronRight based on state
  - Test: nested ContainerDropZone visible when expanded
  - Test: nested ContainerDropZone hidden when collapsed
- [ ] 4.8. Extract **ArrayItem** molecule + test
  - Test: renders delete button, index label, type selector, value input
  - Test: delete button removes item from store
  - Test: expand/collapse toggles children visibility
  - Test: nested ContainerDropZone visible when expanded
- [ ] 4.9. Extract **InlineNodeEditor** molecule + test
  - Test: renders TypeSelector + ValueInput for leaf nodes (string/number/boolean/null)
  - Test: renders only TypeSelector for object/array nodes
  - Test: changing type converts node value in store
- [ ] 4.10. Extract **PalettePanel** molecule + test
  - Test: renders 6 palette buttons
  - Test: all buttons draggable when not editing
  - Test: all buttons disabled when editing
- [ ] 4.11. Extract **JsonToolbar** molecule + test
  - Test: desktop shows full text buttons (Editar JSON, Copiar, Copiar minificado, Baixar)
  - Test: mobile shows icon-only buttons with tooltips
  - Test: editingJson=true shows Cancelar + Validar
  - Test: editingJson=false shows Editar JSON + Copiar + Copiar minificado + Baixar
  - Test: Editar JSON calls startEditing
  - Test: Cancelar calls cancelEditing
  - Test: Validar with valid JSON applies and calls cancelEditing
  - Test: Validar with invalid JSON shows error toast
  - Test: Copiar writes formatted JSON to clipboard
  - Test: Copiar minificado writes minified JSON to clipboard
  - Test: Baixar triggers file download
- [ ] 4.12. Move **AddFieldForm** + test
  - Test: renders all form fields
  - Test: target selector shows all available targets
  - Test: type selector changes visible value input
  - Test: name field disabled when parent is array
  - Test: null toggle disables type + value inputs
  - Test: submit with empty name shows "Informe um nome." error
  - Test: submit with valid data calls handleApplyInsert
  - Test: form resets after successful add
- [ ] 4.13. Move **NodeEditor** organism + test
  - Test: renders empty object with ContainerDropZone
  - Test: renders nested objects/arrays when expanded
  - Test: "Expandir todos" expands all complex nodes
  - Test: "Recolher todos" collapses all nodes
  - Test: root type selector changes root value
  - Test: recursive rendering of nested structures
- [ ] 4.14. Move **JsonPanel** organism + test
  - Test: renders formatted JSON in CodeMirror (read-only)
  - Test: subheader shows "Somente leitura" when not editing
  - Test: subheader shows "Modo edição manual" when editing
- [ ] 4.15. Move **VisualEditor** organism + test
  - Test: renders PalettePanel on desktop
  - Test: renders AddFieldForm on mobile
  - Test: renders NodeEditor
- [ ] 4.16. Move **TopBar** organism + test
  - Test: renders "JSON Visual Editor" title
  - Test: theme toggle button exists and is clickable
  - Test: GitHub link present with correct href
- [ ] 4.17. Update `App.tsx` imports
- [ ] 4.18. Remove old component directories
- [ ] 4.19. Verify: `npm run test` — all component tests pass
- [ ] 4.20. Verify: `npm run typecheck && npm run lint` pass
- [ ] 4.21. Verify: `npm run build` succeeds
- [ ] 4.22. **Full Playwright validation** (all behaviors from baseline):

**Desktop (1280x800):**
- [ ] Empty `{}` JSON on load
- [ ] Drag "string" to drop zone → field created with key/type/value → JSON `{"newField": ""}`
- [ ] Drag "object" to drop zone → nested object with expand/collapse → JSON `{"newField": {}}`
- [ ] Drag "number" to drop zone → number field → JSON `{"newField": 0}`
- [ ] Delete field → JSON reverts to `{}`
- [ ] Rename key on blur → JSON updates with new key name (key moves to end)
- [ ] Change type via selector → value converts (string→number: "item"→0)
- [ ] Expand/collapse individual node
- [ ] "Expandir todos" / "Recolher todos" bulk buttons
- [ ] Editar JSON → CodeMirror editable, palette disabled, tree disabled
- [ ] Validar with valid JSON → applies, returns to read-only
- [ ] Validar with invalid JSON → error toast appears
- [ ] Cancelar → reverts to read-only, no changes
- [ ] Copiar → toast "JSON copiado para o clipboard!"
- [ ] Copiar minificado → toast "JSON minificado copiado para o clipboard!"
- [ ] Baixar → file download triggered, toast "JSON baixado com sucesso!"
- [ ] Theme toggle → switches light↔dark, icon changes
- [ ] Theme persists after page reload
- [ ] Palette buttons have drag cursor, are draggable
- [ ] Drag handle (GripVertical) on each node is draggable
- [ ] Nested ContainerDropZone appears inside expanded complex nodes
- [ ] Null type: no value input shown

**Mobile (375x812):**
- [ ] AddFieldForm visible (palette buttons hidden)
- [ ] Target selector shows "Início (object)"
- [ ] Type selector shows all 5 types
- [ ] Name field enabled for object parent
- [ ] Name field disabled for array parent
- [ ] Null toggle disables type + value inputs
- [ ] "Adicionar" button submits form
- [ ] Toolbar shows icon-only buttons with tooltips
- [ ] Edit mode shows icon-only Cancelar/Validar
- [ ] Layout is single-column stacked

**Cross-cutting:**
- [ ] Snackbar toast appears at bottom-center, auto-hides after 4s
- [ ] NumberField allows typing "1." (mid-edit state preserved)
- [ ] NumberField blur with invalid input resets to 0

### Acceptance Criteria
- [ ] All 18 component test files exist in `__tests__/` folders
- [ ] Every atom has behavioral tests (5 atoms × 3+ tests each)
- [ ] Every molecule has behavioral tests (6 molecules × 3+ tests each)
- [ ] Every organism has behavioral tests (4 organisms × 2+ tests each)
- [ ] No template file > 150 lines
- [ ] No composable file > 80 lines
- [ ] All old component directories removed
- [ ] `npm run test` passes (0 failures)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] **All 30+ Playwright checks pass** (see list above)

---

## Phase 5: Documentation

**Objective:** Update AGENTS.md (English) + create area-specific docs.

### Tasks

- [ ] 5.1. Rewrite `AGENTS.md` in English: project overview, stack, folder structure (atomic design), DI conventions, service conventions, template/composable conventions, testing conventions, links to docs/
- [ ] 5.2. Create `docs/architecture.md`: DI container, service wiring, overall architecture
- [ ] 5.3. Create `docs/components.md`: atomic design, template+composable pattern, how to add new components
- [ ] 5.4. Create `docs/testing.md`: vitest setup, test conventions, how to write behavioral tests, renderWithProviders pattern
- [ ] 5.5. Create `docs/services.md`: service classes, DI tokens, how to add new services, constructor injection pattern
- [ ] 5.6. Create `docs/store.md`: store conventions, action splitting, domain separation, how to add new stores

### Acceptance Criteria
- [ ] `AGENTS.md` is complete, accurate, in English
- [ ] 5 docs/ files exist and are comprehensive
- [ ] All code examples in docs match actual codebase
- [ ] All docs reference https://jsonvisualeditor.com/ for behavior verification
- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

---

## Execution Summary

| Phase | Files Created | Test Files Created | Playwright Checks |
|-------|--------------|-------------------|-------------------|
| 0: Infrastructure | 2 | 0 | 0 |
| 1: Services | 5 services | 5 unit tests | 1 |
| 2: DI Container | 2 | 1 container test | 1 |
| 3: Stores | 1 actions file | 2 store tests | 6 |
| 4: Components | 17 components (34 files) | 17 behavioral tests | 30+ |
| 5: Documentation | 6 | 0 | 0 |
| **Total** | **33 source files** | **25 test files** | **38+ Playwright checks** |
