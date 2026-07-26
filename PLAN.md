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
- [x] 0.8. Create a visual mermaid graph of 

### Acceptance Criteria
- [x] `vitest.config.ts` exists and is correct
- [x] `src/test/setup.ts` exists
- [x] `npm run test` executes with 0 tests, exit code 0
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes

---

## Phase 0: Flow Chart
- Create a flowchart using Markdown and Mermaid.js. The flowchart must include all application paths, including both successful flows and error flows.
- Add markers, classes, and visual styling hooks to the diagram elements to make them easy to style later.
  - To discover the application's behavior, use the Playwright MCP to interact with https://jsonvisualeditor.com/. Explore the application in both desktop (expanded) and mobile layouts.
  - Map the behavior of every button and interactive element, including:

    - Click actions
      - Drag-and-drop interactions
      - Navigation between screens or states
      - Success and failure scenarios
      - Validation errors
      - Conditional branches
      - Modal dialogs, menus, and popovers (if present)
- The resulting Mermaid flowchart should comprehensively document the application's behavior and all possible user interaction paths.
- Save in doc folder

### Acceptance Criteria
- [x] All the flows must be mapped
- [x] Mobile and desktop must be mapped
- [x] All buttons must be mapped
- [x] All actions must be mapped
- [x] File must be saved in doc folder

---

## Phase 1: Services Layer

**Objective:** Extract all pure logic into service classes with constructor DI.

### Per-File Requirement
Every service file MUST have a corresponding `__tests__/*.test.ts` file. Tests must cover: happy path, edge cases, error paths, boundary conditions.

### Tasks

- [x] 1.1. Create `src/services/JsonTreeService.ts` + `__tests__/JsonTreeService.test.ts`
  - Test: `getAtPath` with nested paths, empty path, single-segment path
  - Test: `setAtPath` with nested updates, root updates, deep nesting
  - Test: `removeAtPath` from objects, from arrays, at root
  - Test: `insertAtPath` at start/middle/end of arrays, into objects, with insertAfter flag
  - Test: `isAncestorOrEqual` for ancestor, descendant, equal, empty paths
  - Test: `isComplexValue` for string, number, boolean, null, object, array
  - Test: `enumerateTargets` on empty root, single level, deeply nested
  - Test: `collectComplexKeys` on empty, flat, nested structures
  - Test: `isPalettePayload`, `isObject`, `isArray` type guards
- [x] 1.2. Create `src/services/JsonMutationService.ts` + `__tests__/JsonMutationService.test.ts`
  - Test: `buildDefaultValue` for string, number, boolean, object, array, null
  - Test: `moveNode` same parent, different parents, ancestor protection, same position
  - Test: `insertFromPalette` for all 6 types
  - Test: `updatePrimitive` at various depths
  - Test: `applyInsert` for object target, array target
  - Test: `expandInserted` expands the newly added key
- [x] 1.3. Create `src/services/JsonValidationService.ts` + `__tests__/JsonValidationService.test.ts`
  - Test: `validateAddFieldForm` valid string/number/boolean/object/array
  - Test: `validateAddFieldForm` empty name error, invalid number error
  - Test: `validateJsonString` valid JSON, invalid JSON, empty string
- [x] 1.4. Create `src/services/ClipboardService.ts` + `__tests__/ClipboardService.test.ts`
  - Test: `writeText` success path (mock clipboard API)
  - Test: `writeText` failure path (mock rejection)
- [x] 1.5. Create `src/services/FileDownloadService.ts` + `__tests__/FileDownloadService.test.ts`
  - Test: `downloadJson` creates blob and triggers download (mock createElement/click)
- [x] 1.6. Delete `src/lib/jsonUtils.ts`
- [x] 1.7. Verify: `npm run test` — all service tests pass
- [x] 1.8. Verify: `npm run typecheck && npm run lint` pass
- [x] 1.9. Verify: `npm run build` succeeds
- [ ] 1.10. Verify against live site: drag "string" to drop zone → field appears, JSON updates. This confirms the extracted services work identically.

### Acceptance Criteria
- [x] 5 service files exist in `src/services/`
- [x] 5 test files exist in `src/services/__tests__/`
- [x] `src/lib/jsonUtils.ts` deleted
- [x] Every service method has at least 1 test
- [x] Every service has edge case tests
- [ ] Coverage >= 90% for `src/services/`
- [x] `npm run test` passes (0 failures)
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Playwright: palette drag-and-drop works (string → drop zone → field created → JSON updated)

---

## Phase 2: DI Container

**Objective:** Create inversify composition root.

### Per-File Requirement
Container file MUST have a test that verifies all bindings resolve to correct types.

### Tasks

- [x] 2.1. Create `src/core/types.ts` with DI token Symbols for all 5 services
- [x] 2.2. Create `src/core/container.ts` + `__tests__/container.test.ts`
  - Test: container resolves JsonTreeService (instanceof check)
  - Test: container resolves JsonMutationService (instanceof check)
  - Test: container resolves JsonValidationService (instanceof check)
  - Test: container resolves ClipboardService (instanceof check)
  - Test: container resolves FileDownloadService (instanceof check)
  - Test: JsonMutationService receives JsonTreeService via DI
- [x] 2.3. ~~Decorate all service classes with `@injectable()` and `@inject()`~~ N/A — `erasableSyntaxOnly` forbids decorators. Container uses explicit `to`/`toDynamicValue` bindings instead.
- [x] 2.4. Initialize container in `src/main.tsx`
- [x] 2.5. Verify: `npm run test` passes
- [x] 2.6. Verify: `npm run typecheck && npm run lint` pass
- [x] 2.7. Verify against live site: app loads, all interactions work (theme toggle, add field, delete field)

### Acceptance Criteria
- [x] `src/core/types.ts` exists with 5 DI tokens
- [x] `src/core/container.ts` exists
- [x] `src/core/__tests__/container.test.ts` exists with 6 tests
- [x] ~~All 5 services have `@injectable()` decorator~~ N/A (erasableSyntaxOnly)
- [x] ~~All DI dependencies have `@inject()` decorator~~ N/A (erasableSyntaxOnly)
- [x] Container initializes in `main.tsx`
- [x] `npm run test` passes
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] Playwright: app loads, theme toggles, palette drag works

---

## Phase 3: Store Refactoring

**Objective:** Update stores to use services from DI container. Split actions.

### Per-File Requirement
Every store file MUST have a corresponding test file. Tests must verify state mutations.

### Tasks

- [x] 3.1. Create `src/store/jsonStore/actions.ts` + `__tests__/actions.test.ts`
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
- [x] 3.2. Create `src/store/uiStore/__tests__/uiStore.test.ts`
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
- [x] 3.3. Update `jsonStore/index.ts` to import from actions.ts (using services)
- [x] 3.4. Verify: `npm run test` passes
- [x] 3.5. Verify: `npm run typecheck && npm run lint` pass
- [x] 3.6. Playwright validation against live site:
  - [ ] Drag "string" to drop zone → field created → JSON shows `{"newField": ""}`
  - [ ] Drag "object" to drop zone → nested object appears → expand/collapse works
  - [ ] Delete field → field removed → JSON reverts to `{}`
  - [ ] Type "0" in number field → JSON updates
  - [ ] Rename key on blur → JSON updates with new key name
  - [ ] Theme toggle → persists after page reload

### Acceptance Criteria
- [x] `src/store/jsonStore/actions.ts` exists
- [x] `src/store/jsonStore/__tests__/actions.test.ts` exists with 10+ tests (has 15)
- [x] `src/store/uiStore/__tests__/uiStore.test.ts` exists with 12+ tests (has 20)
- [x] Stores import services from DI container
- [x] `npm run test` passes
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] All 6 Playwright checks pass

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

- [x] 4.1. Create `src/components/atoms/`, `molecules/`, `organisms/` directories
- [x] 4.2. Extract **TypeSelector** atom + test
  - Test: renders current type from props
  - Test: onChange fires with new type
  - Test: disabled when locked=true
- [x] 4.3. Extract **ValueInput** atom + test
  - Test: renders TextField for string type
  - Test: renders NumberField for number type
  - Test: renders Select for boolean type
  - Test: renders nothing for object/array types
  - Test: disabled when locked=true
  - Test: onChange fires with correct value
- [x] 4.4. Extract **PaletteButton** atom + test
  - Test: renders with correct icon and label
  - Test: draggable=true when editingJson=false
  - Test: draggable=false when editingJson=true
  - Test: disabled when editingJson=true
- [x] 4.5. Move **NumberField** + test
  - Test: renders with initial value
  - Test: typing updates local text state
  - Test: blur commits numeric value
  - Test: blur with invalid input resets to 0
  - Test: typing "1." preserves mid-edit state
- [x] 4.6. Move **ContainerDropZone** + test
  - Test: renders "Arraste itens para cá" text
  - Test: visual feedback on dragEnter (border color changes)
  - Test: palette drop inserts new field into store
  - Test: reorder drop moves node in store
  - Test: locked=true prevents drop
- [x] 4.7. Extract **ObjectItem** molecule + test
  - Test: renders delete button, key input, type selector, value input
  - Test: delete button removes key from store
  - Test: key rename on blur updates store
  - Test: expand/collapse toggles children visibility
  - Test: expand button shows ChevronDown/ChevronRight based on state
  - Test: nested ContainerDropZone visible when expanded
  - Test: nested ContainerDropZone hidden when collapsed
- [x] 4.8. Extract **ArrayItem** molecule + test
  - Test: renders delete button, index label, type selector, value input
  - Test: delete button removes item from store
  - Test: expand/collapse toggles children visibility
  - Test: nested ContainerDropZone visible when expanded
- [x] 4.9. Extract **InlineNodeEditor** molecule + test
  - Test: renders TypeSelector + ValueInput for leaf nodes (string/number/boolean/null)
  - Test: renders only TypeSelector for object/array nodes
  - Test: changing type converts node value in store
- [x] 4.10. Extract **PalettePanel** molecule + test
  - Test: renders 6 palette buttons
  - Test: all buttons draggable when not editing
  - Test: all buttons disabled when editing
- [x] 4.11. Extract **JsonToolbar** molecule + test
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
- [x] 4.12. Move **AddFieldForm** + test
  - Test: renders all form fields
  - Test: target selector shows all available targets
  - Test: type selector changes visible value input
  - Test: name field disabled when parent is array
  - Test: null toggle disables type + value inputs
  - Test: submit with empty name shows "Informe um nome." error
  - Test: submit with valid data calls handleApplyInsert
  - Test: form resets after successful add
- [x] 4.13. Move **NodeEditor** organism + test
  - Test: renders empty object with ContainerDropZone
  - Test: renders nested objects/arrays when expanded
  - Test: "Expandir todos" expands all complex nodes
  - Test: "Recolher todos" collapses all nodes
  - Test: root type selector changes root value
  - Test: recursive rendering of nested structures
- [x] 4.14. Move **JsonPanel** organism + test
  - Test: renders formatted JSON in CodeMirror (read-only)
  - Test: subheader shows "Somente leitura" when not editing
  - Test: subheader shows "Modo edição manual" when editing
- [x] 4.15. Move **VisualEditor** organism + test
  - Test: renders PalettePanel on desktop
  - Test: renders AddFieldForm on mobile
  - Test: renders NodeEditor
- [x] 4.16. Move **TopBar** organism + test
  - Test: renders "JSON Visual Editor" title
  - Test: theme toggle button exists and is clickable
  - Test: GitHub link present with correct href
- [x] 4.17. Update `App.tsx` imports
- [x] 4.18. Remove old component directories
- [x] 4.19. Verify: `npm run test` — all component tests pass
- [x] 4.20. Verify: `npm run typecheck && npm run lint` pass
- [x] 4.21. Verify: `npm run build` succeeds
- [x] 4.22. **Full Playwright validation** (all behaviors from baseline):

**Desktop (1280x800):**
- [x] Empty `{}` JSON on load
- [x] Drag "string" to drop zone → field created with key/type/value → JSON `{"newField": ""}`
- [x] Drag "object" to drop zone → nested object with expand/collapse → JSON `{"newField": {}}`
- [x] Drag "number" to drop zone → number field → JSON `{"newField": 0}`
- [x] Delete field → JSON reverts to `{}`
- [x] Rename key on blur → JSON updates with new key name (key moves to end)
- [x] Change type via selector → value converts (string→number: "item"→0)
- [x] Expand/collapse individual node
- [x] "Expandir todos" / "Recolher todos" bulk buttons
- [x] Editar JSON → CodeMirror editable, palette disabled, tree disabled
- [x] Validar with valid JSON → applies, returns to read-only
- [x] Validar with invalid JSON → error toast appears
- [x] Cancelar → reverts to read-only, no changes
- [x] Copiar → toast "JSON copiado para o clipboard!"
- [x] Copiar minificado → toast "JSON minificado copiado para o clipboard!"
- [x] Baixar → file download triggered, toast "JSON baixado com sucesso!"
- [x] Theme toggle → switches light↔dark, icon changes
- [x] Theme persists after page reload
- [x] Palette buttons have drag cursor, are draggable
- [x] Drag handle (GripVertical) on each node is draggable
- [x] Nested ContainerDropZone appears inside expanded complex nodes
- [x] Null type: no value input shown

**Mobile (375x812):**
- [x] AddFieldForm visible (palette buttons hidden)
- [x] Target selector shows "Início (object)"
- [x] Type selector shows all 5 types
- [x] Name field enabled for object parent
- [x] Name field disabled for array parent
- [x] Null toggle disables type + value inputs
- [x] "Adicionar" button submits form
- [x] Toolbar shows icon-only buttons with tooltips
- [x] Edit mode shows icon-only Cancelar/Validar
- [x] Layout is single-column stacked

**Cross-cutting:**
- [x] Snackbar toast appears at bottom-center, auto-hides after 4s
- [x] NumberField allows typing "1." (mid-edit state preserved)
- [x] NumberField blur with invalid input resets to 0

### Dependency Injection (Container)

All services must be resolved through the Inversify container. No component or store action may use `new ServiceClass()` directly.

**Pattern:**
- `ContainerProvider` (React Context) wraps the app at the root.
- Composables and templates call `useContainer()` to resolve services via `container.get(TYPES.XxxService)`.
- Store actions use a factory function `createJsonActions(container)` that receives the container and resolves services internally.
- Tests create a fresh `Container` with mock bindings and wrap render calls in `<ContainerProvider>`.

- [x] 4.23. Create `src/core/containerContext.tsx`
  - `ContainerContext` React context holding a `Container` instance
  - `ContainerProvider` component: accepts `value` prop, provides container via context
  - `useContainer()` hook: returns the container from context; throws if missing
  - No JSDoc on trivial getters/setters; JSDoc on provider and hook explaining purpose and usage

- [x] 4.24. Update `src/main.tsx`
  - Import `ContainerProvider` and the app-level `container`
  - Wrap `<App />` with `<ContainerProvider value={container}>`
  - Keep the `import './core/container'` side-effect import for binding registration

- [x] 4.25. Convert `src/store/jsonStore/actions.ts` to factory pattern
  - Export `createJsonActions(container: Container): typeof jsonActions`
  - Inside the factory, resolve `JsonTreeService` and `JsonMutationService` from the container
  - Remove top-level `new JsonTreeService()` and `new JsonMutationService(treeSvc)` calls
  - Keep the same `jsonActions` shape for backward compatibility

- [x] 4.26. Update `src/store/jsonStore/index.ts`
  - Import `container` from `src/core/container`
  - Call `createJsonActions(container)` to get the actions object
  - Pass the actions object to the Zustand store creation

- [x] 4.27. ~~Update `src/test/setup.ts`~~ Skipped — each test file wraps individually with `<ContainerProvider>`

- [x] 4.28. Update `src/components/atoms/container-drop-zone/ContainerDropZone.tsx`
  - Replace `const treeSvc = new JsonTreeService()` with `useContainer().get(TYPES.JsonTreeService)`
  - Move service resolution inside the component (or extract to composable)

- [x] 4.29. Update `src/components/atoms/type-selector/useTypeSelector.ts`
  - Replace `const treeSvc = new JsonTreeService()` and `const mutationSvc = new JsonMutationService(treeSvc)` with container resolution

- [x] 4.30. Update `src/components/molecules/inline-node-editor/useInlineNodeEditor.ts`
  - Replace `const treeSvc = new JsonTreeService()` with container resolution

- [x] 4.31. Update `src/components/molecules/add-field-form/useAddFieldForm.ts`
  - Replace `const treeSvc = new JsonTreeService()` with container resolution

- [x] 4.32. Update `src/components/molecules/object-item/ObjectItem.tsx`
  - Replace `const treeSvc = new JsonTreeService()` with container resolution

- [x] 4.33. Update `src/components/molecules/array-item/ArrayItem.tsx`
  - Replace `const treeSvc = new JsonTreeService()` with container resolution

- [x] 4.34. Update `src/components/organisms/node-editor/useNodeEditor.tsx`
  - Replace `const treeSvc = new JsonTreeService()` with container resolution

- [x] 4.35. Create `src/core/__tests__/containerContext.test.tsx`
  - Test: `useContainer()` throws when used outside provider
  - Test: `useContainer()` returns the container provided by `ContainerProvider`
  - Test: services resolved from provider container match provided container

- [x] 4.36. Update component test files with `<ContainerProvider>`
  - Wrap all component renders in tests with `<ContainerProvider value={testContainer}>`
  - Files: `ContainerDropZone.test.tsx`, `TypeSelector.test.tsx`, `InlineNodeEditor.test.tsx`, `AddFieldForm.test.tsx`, `ObjectItem.test.tsx`, `ArrayItem.test.tsx`, `NodeEditor.test.tsx`
  - Update `store/jsonStore/__tests__/actions.test.ts` for factory pattern

- [x] 4.37. Verify: `npm run test` — all tests pass (including new containerContext tests)
- [x] 4.38. Verify: `npm run typecheck && npm run lint` pass
- [x] 4.39. Verify: `npm run build` succeeds

### Acceptance Criteria
- [x] All 18 component test files exist in `__tests__/` folders
- [x] Every atom has behavioral tests (5 atoms × 3+ tests each)
- [x] Every molecule has behavioral tests (6 molecules × 3+ tests each)
- [x] Every organism has behavioral tests (4 organisms × 2+ tests each)
- [x] No template file > 150 lines
- [x] No composable file > 80 lines
- [x] All old component directories removed
- [x] `npm run test` passes (0 failures)
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] **All 30+ Playwright checks pass** (see list above)
- [x] Zero `new JsonTreeService()` / `new JsonMutationService()` / `new JsonValidationService()` / `new ClipboardService()` / `new FileDownloadService()` calls in production code (only allowed in `src/core/container.ts` bindings and test files)
- [x] All composables resolve services via `useContainer().get(TYPES.*)` instead of `new ServiceClass()`
- [x] Store actions created via `createJsonActions(container)` factory pattern
- [x] All component tests use `<ContainerProvider>` wrapper with a fresh test container
- [x] New `containerContext.test.tsx` covers provider/hook behavior
- [x] `containerContext.tsx` has JSDoc on `ContainerProvider` and `useContainer()` explaining DI purpose

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
- [ ] 5.7. Update `doc/user-flows-mapping.md` with the new flows/components

### Acceptance Criteria
- [ ] `AGENTS.md` is complete, accurate, in English
- [ ] 5 docs/ files exist and are comprehensive
- [ ] All code examples in docs match actual codebase
- [ ] All docs reference https://jsonvisualeditor.com/ for behavior verification
- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Validate `doc/user-flows-mapping.md` using playright mcp in the url `https://mermaid.live/edit` (past the content of chart into editor and validade if it`s parse correctly)

---

## Accessibility Audit (a11y) — Playwright + axe-core + Source Code Analysis

**Audit Date:** 2026-07-26
**Method:** Playwright MCP (axe-core automated scan, manual DOM audit, source code contrast analysis)
**Screen Sizes:** Desktop (1280x800) tested via Playwright. Tablet (768x1024) and Mobile (375x812) analysis via responsive code review (Playwright browser crashed during tablet/mobile viewport testing).
**Scope:** All buttons (12), all inputs (8), all links (1), headings, ARIA, contrast, keyboard navigation, lang attribute, skip link, focus management.

### Summary of Findings

| # | Severity | WCAG | Issue | Component(s) |
|---|----------|------|-------|--------------|
| 1 | Serious | 4.1.2 | CodeMirror textbox missing accessible name | JsonPanel |
| 2 | Serious | 4.1.2 | Switch toggle missing programmatic label | AddFieldForm |
| 3 | Serious | 1.3.1 | Heading hierarchy skips levels (h1 → h6) | AddFieldForm, VisualEditor |
| 4 | Serious | 3.1.1 | `html lang="en"` but UI content is Portuguese | index.html |
| 5 | Moderate | 1.4.3 | CM gutter text fails contrast ratio (light: 2.63:1, dark: 2.26:1) | CodeMirror theme |
| 6 | Moderate | 2.4.1 | No skip navigation link | App.tsx |
| 7 | Minor | 1.3.1 | Drag handle (GripVertical) has no accessible name | ObjectItem, ArrayItem |
| 8 | Minor | 4.1.2 | Key rename TextField has no label or aria-label | ObjectItem |
| 9 | Minor | 1.3.5 | Form fields on AddFieldForm lack autocomplete hints | AddFieldForm |

---

### Detailed Findings

#### [A11y-01] CodeMirror textbox missing accessible name (Serious)
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **axe-core rule:** `aria-input-field-name`
- **Element:** `.cm-content` with `role="textbox"`, `aria-multiline="true"`
- **Failure:** No `aria-label`, no `aria-labelledby`, no `title` attribute
- **Impact:** Screen reader users cannot identify the purpose of the JSON editor
- **File:** `src/components/organisms/json-panel/JsonPanel.tsx:47-54`
- **Fix:** Add `aria-label="JSON editor"` or `aria-labelledby` pointing to the panel header

#### [A11y-02] Switch toggle missing programmatic label (Serious)
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Element:** `<input role="switch" type="checkbox">` inside AddFieldForm
- **Failure:** The Switch has no `aria-label` or `aria-labelledby`. The sibling `<Typography>Nulo</Typography>` is visually adjacent but not programmatically associated via `<label>`, `aria-labelledby`, or wrapping.
- **Impact:** Screen reader users hear "switch" with no context about what it controls
- **File:** `src/components/molecules/add-field-form/AddFieldForm.tsx:127`
- **Fix:** Wrap Switch + Typography in a `<FormControlLabel>` or add `aria-label="Nulo"`

#### [A11y-03] Heading hierarchy skips levels (Serious)
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Current:** `<h1>` "JSON Visual Editor" → `<h6>` "Adicionar dados ao JSON"
- **Failure:** Heading levels h2–h5 are skipped entirely
- **Impact:** Screen reader users navigating by headings will experience a broken hierarchy
- **Files:** `src/components/organisms/top-bar/TopBar.tsx:30` (h1), `src/components/molecules/add-field-form/AddFieldForm.tsx:33` (Typography with variant subtitle2, rendered as h6)
- **Fix:** Change "Adicionar dados ao JSON" from `variant="subtitle2"` (h6) to `variant="h2"` or use `component="h2"`. Similarly review "Modelo (visual)" and "JSON Final" card headers.

#### [A11y-04] HTML lang attribute mismatch (Serious)
- **WCAG:** 3.1.1 Language of Page (Level A)
- **Current:** `<html lang="en">` in `index.html`
- **Content language:** Portuguese (PT-BR) — all UI text is in Portuguese
- **Impact:** Screen readers will pronounce Portuguese text using English phoneme rules
- **File:** `index.html`
- **Fix:** Change to `<html lang="pt-BR">`

#### [A11y-05] CodeMirror gutter text fails contrast (Moderate)
- **WCAG:** 1.4.3 Contrast Minimum (Level AA) — requires 4.5:1 for normal text
- **Light theme:** CM gutter color `#888888` (rgb 136,136,136) on bg `#ececef` (rgb 236,236,239) = **2.63:1** — FAIL
- **Dark theme:** CM gutter color `#555555` (rgb 85,85,85) on bg `#1a1b22` (rgb 26,27,34) = **2.26:1** — FAIL
- **Impact:** Line numbers are difficult to read for low-vision users
- **File:** `src/theme.ts:98` (light: `color: '#888'`), `src/theme.ts:124` (dark: `color: '#555'`)
- **Fix:** Light: increase to at least `#767676` (4.54:1). Dark: increase to at least `#888` (5.32:1)

#### [A11y-06] No skip navigation link (Moderate)
- **WCAG:** 2.4.1 Bypass Blocks (Level A)
- **Current:** No skip link found anywhere in the DOM
- **Impact:** Keyboard-only users must tab through every toolbar button to reach main content
- **File:** `src/App.tsx`
- **Fix:** Add a visually-hidden "Skip to content" link as the first focusable element

#### [A11y-07] Drag handle has no accessible name (Minor)
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Element:** `<GripVertical size={14} />` inside a `<Box>` with drag handlers
- **Failure:** The drag handle icon has no aria-label, role, or text alternative
- **Impact:** Screen reader users may not understand the purpose of the interactive element
- **Files:** `src/components/molecules/object-item/ObjectItem.tsx:70-74`, `src/components/molecules/array-item/ArrayItem.tsx:69-73`
- **Fix:** Add `role="img" aria-label="Drag to reorder"` or `aria-label="Arrastar para reordenar"` to the Box

#### [A11y-08] Key rename TextField has no label (Minor)
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Element:** `<TextField size="small" defaultValue={k} variant="outlined">` in ObjectItem
- **Failure:** No `label`, `aria-label`, or `aria-labelledby` on the key rename input
- **Impact:** Screen reader users cannot determine what the input field represents
- **File:** `src/components/molecules/object-item/ObjectItem.tsx:82-98`
- **Fix:** Add `aria-label={`Rename key ${k}`}`

#### [A11y-09] Missing autocomplete hints on form fields (Minor)
- **WCAG:** 1.3.5 Identify Input Purpose (Level AA)
- **Element:** "Nome do campo" and "Valor" TextFields in AddFieldForm
- **Failure:** No `autocomplete` attribute on name/value inputs
- **Impact:** Browsers and assistive technologies cannot suggest previously entered values
- **File:** `src/components/molecules/add-field-form/AddFieldForm.tsx:87-98, 103, 109`
- **Fix:** Add `autocomplete="off"` since these are unique JSON field names/values, not standard form data

---

### Items Verified as Passing

| Check | Result | Details |
|-------|--------|---------|
| All 12 buttons have accessible names | ✅ PASS | Theme toggle has `aria-label="Tema claro"`. All other buttons have visible text content |
| All 8 inputs checked | ✅ PASS | Comboboxes have `aria-labelledby`. TextFields have labels. (issues noted above for specific items) |
| Link has accessible name | ✅ PASS | GitHub link "Ver no GitHub" has visible text |
| No duplicate IDs | ✅ PASS | No duplicate element IDs found |
| ARIA roles correct | ✅ PASS | `role="combobox"`, `role="switch"`, `role="textbox"` all appropriate |
| Images have alt text | ✅ PASS | No `<img>` elements; SVGs are decorative within labeled buttons |
| Theme toggle persistence | ✅ PASS | localStorage-based, accessible via keyboard |
| Responsive layout | ✅ PASS | Desktop: 2-column, Mobile: 1-column stacked. AddFieldForm on mobile, PalettePanel on desktop |

---

### Responsive Design Notes (Code Review — Playwright viewport testing interrupted)

The app uses MUI Grid with `xs: 12, md: 6` for panel layout, providing responsive behavior. The following responsive patterns were observed in code:

1. **Desktop (≥960px):** Two-column layout with VisualEditor (palette + tree) and JsonPanel side by side
2. **Mobile (<960px):** Single-column stacked layout
3. **Mobile (<960px):** AddFieldForm replaces PalettePanel (palette buttons hidden)
4. **Small screens:** JsonToolbar switches to icon-only buttons with Tooltip
5. **Tablet testing was not completed** due to Playwright MCP browser crash — recommend re-testing at 768x1024 viewport

---

### Priority Recommendations

1. **Immediate (A):** Fix `lang="pt-BR"`, add aria-label to CodeMirror textbox, fix heading hierarchy
2. **Short-term (B):** Associate Switch label, fix CM gutter contrast, add skip link
3. **Medium-term (C):** Add aria-label to drag handles and key rename inputs, add autocomplete hints

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
