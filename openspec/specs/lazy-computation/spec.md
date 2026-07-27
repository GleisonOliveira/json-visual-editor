# lazy-computation

## Purpose

Performance optimization for expensive tree-walking computations: deferred `collectComplexKeys` and `enumerateTargets` calls, and ref-based comparison for `NumberField`.

## Requirements

### Requirement: collectComplexKeys SHALL be lazily computed
The `allComplexKeys` result from `treeSvc.collectComplexKeys(value, [])` in `useNodeEditor` SHALL be computed only when needed (on expand-all action or hover), not on every `jsonValue` change. The computation SHALL be deferred until the user interacts with the expand-all control.

#### Scenario: No tree walk on keystroke
- **WHEN** a user types a character in a value field
- **THEN** `collectComplexKeys` SHALL NOT be called

#### Scenario: Tree walk only on expand-all request
- **WHEN** the user clicks "Expand all" or interacts with the expand control
- **THEN** `collectComplexKeys` SHALL be called and its result used for expansion

### Requirement: enumerateTargets SHALL be lazily computed
The `enumerateTargets(jsonValue)` call in `useAddFieldForm` SHALL be deferred until the add-field form is visible (mobile viewport or form opened). It SHALL NOT be computed on every `jsonValue` change when the form is not visible.

#### Scenario: No tree walk when form hidden
- **WHEN** the add-field form is not visible
- **THEN** `enumerateTargets` SHALL NOT be called on `jsonValue` changes

#### Scenario: Tree walk when form opens
- **WHEN** the add-field form becomes visible
- **THEN** `enumerateTargets` SHALL be called with the current `jsonValue`

### Requirement: NumberField useLayoutEffect SHALL use ref-based comparison
The `NumberField` component's `useLayoutEffect` SHALL use a `useRef` to track the previous `value` instead of depending on the `text` state in its dependency array. This SHALL eliminate the fragile dependency loop between `text` state and the effect.

#### Scenario: No fragile effect loop
- **WHEN** `NumberField` receives a new `value` prop
- **THEN** the effect SHALL compare against the previous value via ref, not via `text` state dependency
