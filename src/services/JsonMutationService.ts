import type { JsonValue, JsonObject, DndPayload, NodeTarget, InsertValueOpts, BuildDefaultValueOpts } from '../types'
import { JsonTreeService } from './JsonTreeService'
import { pathsEqual } from '../lib/pathsEqual'

/**
 * Mutation operations on the JSON tree — creating, moving, and updating nodes.
 * Depends on {@link JsonTreeService} for tree traversal.
 */
export class JsonMutationService {
  readonly tree: JsonTreeService
  constructor(tree: JsonTreeService) {
    this.tree = tree
  }

  /** Builds a default value for a given field type and options. */
  buildDefaultValue(opts: BuildDefaultValueOpts): JsonValue {
    if (opts.isNull) return null

    switch (opts.type) {
      case 'string': return opts.valueText ?? opts.name ?? 'item'
      case 'number': return Number.isFinite(opts.valueNumber) ? opts.valueNumber : 0
      case 'boolean': return opts.valueBoolean
      case 'object': return {}
      case 'array': return []
      default: return null
    }
  }

  /** Moves a node from one position to another within the tree. */
  moveNode(
    root: JsonValue,
    payload: DndPayload,
    toParentPath: Array<string | number>,
    toKey: string | number | null
  ): JsonValue {
    if (this.tree.isPalettePayload(payload)) return root
    const { fromPath, fromKey } = payload
    if (this.tree.isAncestorOrEqual(fromPath, toParentPath)) return root
    const fromParentPath = fromPath.slice(0, -1)
    const fromSlot = fromPath[fromPath.length - 1]
    if (
      pathsEqual(fromParentPath, toParentPath) &&
      toKey === fromSlot
    ) return root
    const value = this.tree.getAtPath(root, fromPath)
    const sameParent = pathsEqual(fromParentPath, toParentPath)
    const movingDown = sameParent && toKey !== null && (
      typeof toKey === 'number'
        ? (fromSlot as number) < (toKey as number)
        : Object.keys(this.tree.getAtPath(root, toParentPath) as JsonObject).indexOf(fromSlot as string) <
          Object.keys(this.tree.getAtPath(root, toParentPath) as JsonObject).indexOf(toKey as string)
    )
    let adjustedKey = toKey

    if (sameParent && toKey !== null && typeof toKey === 'number' && movingDown) {
      adjustedKey = (toKey as number) - 1
    }

    const afterRemove = this.tree.removeAtPath(root, fromPath)

    return this.tree.insertAtPath(afterRemove, toParentPath, adjustedKey, value, fromKey, movingDown)
  }

  /** Inserts a new default node of `paletteType` at the given position. */
  insertFromPalette(
    root: JsonValue,
    paletteType: string,
    toParentPath: Array<string | number>,
    toKey: string | number | null
  ): JsonValue {
    const value = this.buildDefaultValue({ type: paletteType, name: 'newField', valueText: '', valueNumber: 0, valueBoolean: false, isNull: paletteType === 'null' })

    return this.tree.insertAtPath(root, toParentPath, toKey, value, toKey === null ? 'newField' : undefined)
  }

  /** Replaces the value at `path` with `next`. */
  updatePrimitive(
    root: JsonValue,
    path: Array<string | number>,
    next: JsonValue
  ): JsonValue {
    return this.tree.setAtPath(root, path, () => next)
  }

  /** Inserts a field via the form (object key or array push).
   *  Uses immutable return values instead of in-place mutation. */
  applyInsert(
    root: JsonValue,
    target: NodeTarget,
    name: string,
    type: string,
    insertValue: InsertValueOpts
  ): JsonValue {
    const cleanName = (name ?? '').trim()
    const valueToInsert = this.buildDefaultValue({
      type,
      name: cleanName,
      valueText: insertValue.valueText,
      valueNumber: insertValue.valueNumber,
      valueBoolean: insertValue.valueBoolean,
      isNull: insertValue.isNull,
    })

    if (target.kind === 'object') {
      return this.tree.setAtPath(root, target.path, (obj: JsonValue) => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          return { ...(obj as JsonObject), [cleanName || 'newField']: valueToInsert }
        }

        return obj
      })
    }

    if (target.kind === 'array') {
      return this.tree.setAtPath(root, target.path, (arr: JsonValue) => {
        if (Array.isArray(arr)) return [...arr, valueToInsert]

        return arr
      })
    }

    return root
  }
}
