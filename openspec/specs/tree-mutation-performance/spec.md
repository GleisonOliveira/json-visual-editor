# tree-mutation-performance

## Purpose

Performance optimization for JSON tree mutations: structural sharing instead of full cloning, single-pass moves, immutable insert operations, and efficient path comparison utilities.

## Requirements

### Requirement: JsonTreeService.setAtPath SHALL use structural sharing instead of full structuredClone
The `setAtPath` method in `JsonTreeService` MUST NOT call `structuredClone` on the entire root tree. Instead, it SHALL walk the mutation path and clone only the nodes along that path, creating new references only for ancestors of the target. Unchanged subtrees SHALL be shared by reference.

#### Scenario: Mutation of a leaf node clones only the path
- **WHEN** a user updates a single primitive value in a deep JSON tree
- **THEN** only the nodes along the path from root to the mutated leaf SHALL be newly allocated; all other subtrees SHALL retain their original references

#### Scenario: Performance scales with path depth, not tree size
- **WHEN** a user edits a value in a 1000-node JSON tree at path depth 5
- **THEN** the mutation SHALL complete in time proportional to path depth (5 nodes cloned), not tree size (1000 nodes)

### Requirement: moveNode SHALL perform a single-pass move with minimal cloning
The `moveNode` method in `JsonMutationService` MUST combine the remove and insert operations into a single traversal of the source path and a single traversal of the destination path. It SHALL NOT perform two independent `structuredClone` calls of the entire tree.

#### Scenario: Single-pass move for node reordering
- **WHEN** a user drags an array item from index 2 to index 5
- **THEN** the tree SHALL be cloned only along the source and destination paths, not the entire tree twice

### Requirement: applyInsert SHALL use immutable return values instead of in-place mutation
The `applyInsert` method in `JsonMutationService` MUST return new objects/arrays instead of mutating the cloned nodes in-place. Object inserts SHALL use spread (`{ ...obj, [key]: value }`) and array inserts SHALL use spread (`[...arr, value]`).

#### Scenario: Immutable insert into object
- **WHEN** a new field is inserted into an object node
- **THEN** the updater function SHALL return a new object with the added field, without mutating the original

#### Scenario: Immutable insert into array
- **WHEN** a new item is appended to an array node
- **THEN** the updater function SHALL return a new array with the added item, without mutating the original

### Requirement: pathsEqual utility SHALL replace JSON.stringify path comparisons
A new `pathsEqual(a, b)` utility function SHALL be created in `src/lib/` to compare path arrays by segment equality without string serialization. It SHALL be used in `moveNode` and anywhere else paths are compared.

#### Scenario: Path comparison without string allocation
- **WHEN** `moveNode` compares `fromParentPath` and `toParentPath`
- **THEN** it SHALL use `pathsEqual()` instead of `JSON.stringify()` comparison
