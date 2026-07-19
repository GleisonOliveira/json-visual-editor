import type { JsonValue, JsonObject, JsonArray, NodeKind, NodeTarget, DndPayload, PalettePayload } from '../types'

/**
 * Pure tree-traversal operations for the JSON document model.
 * Used by components and the jsonStore to read and locate values.
 */
export class JsonTreeService {
  /** Type guard: returns true when `p` is a palette drag payload (not a node-move payload). */
  isPalettePayload(p: DndPayload): p is PalettePayload {
    return 'fromPalette' in p && p.fromPalette === true
  }

  /** Type guard: returns true when `v` is a plain object (not an array, not null). */
  isObject(v: unknown): v is JsonObject {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
  }

  /** Type guard: returns true when `v` is an array. */
  isArray(v: unknown): v is JsonArray {
    return Array.isArray(v)
  }

  /** Returns the value located at `path` inside the JSON tree rooted at `root`. */
  getAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
    let cur: JsonValue = root
    for (const seg of path) cur = (cur as JsonObject)[seg as string] as JsonValue

    return cur
  }

  /** Immutably applies `updater` to the node at `path`, returning a new tree. */
  setAtPath(
    root: JsonValue,
    path: Array<string | number>,
    updater: (node: JsonValue) => JsonValue
  ): JsonValue {
    const clone = structuredClone(root)
    if (path.length === 0) return updater(clone)
    let cur = clone as JsonObject | JsonArray

    for (let i = 0; i < path.length; i++) {
      const seg = path[i]

      if (i === path.length - 1) {
        (cur as JsonObject)[seg as string] = updater((cur as JsonObject)[seg as string] as JsonValue)
      } else {
        cur = (cur as JsonObject)[seg as string] as JsonObject | JsonArray
      }
    }

    return clone
  }

  /** Immutably removes the node at `path` (object key delete or array splice). */
  removeAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
    if (path.length === 0) return root

    return this.setAtPath(root, path.slice(0, -1), (parent: JsonValue) => {
      const key = path[path.length - 1]

      if (Array.isArray(parent)) {
        const copy = [...parent]
        copy.splice(key as number, 1)

        return copy
      } else {
        const copy = { ...(parent as JsonObject) }
        delete copy[key as string]

        return copy
      }
    })
  }

  /** Immutably inserts `value` at `key` inside the container at `parentPath`. */
  insertAtPath(
    root: JsonValue,
    parentPath: Array<string | number>,
    key: string | number | null,
    value: JsonValue,
    originalKey?: string,
    insertAfter?: boolean
  ): JsonValue {
    return this.setAtPath(root, parentPath, (parent: JsonValue) => {
      if (Array.isArray(parent)) {
        const copy = [...parent]
        let idx = key === null ? copy.length : (key as number)
        if (insertAfter && key !== null) idx = (key as number) + 1
        copy.splice(idx, 0, value)

        return copy
      } else {
        const obj = parent as JsonObject
        const wantedKey: string = originalKey ?? `field${Object.keys(obj).length}`
        const finalKey = (wantedKey in obj) ? `${wantedKey}_${Object.keys(obj).length}` : wantedKey
        const entries = Object.entries(obj)

        if (key !== null) {
          const toIdx = entries.findIndex(([k]) => k === (key as string))
          if (toIdx < 0) return { ...obj, [finalKey]: value }
          entries.splice(insertAfter ? toIdx + 1 : toIdx, 0, [finalKey, value])
        } else {
          entries.push([finalKey, value])
        }

        return Object.fromEntries(entries)
      }
    })
  }

  /** Returns true when `candidateAncestor` is an ancestor of or equal to `path`. */
  isAncestorOrEqual(candidateAncestor: Array<string | number>, path: Array<string | number>): boolean {
    if (candidateAncestor.length > path.length) return false

    return candidateAncestor.every((seg, i) => seg === path[i])
  }

  /** Returns true when `v` is an object or array (not a primitive or null). */
  isComplexValue(v: JsonValue): boolean {
    return Array.isArray(v) || (typeof v === 'object' && v !== null)
  }

  /** Walks the tree and returns all object/array containers as drop targets. */
  enumerateTargets(root: JsonValue): NodeTarget[] {
    const out: NodeTarget[] = []

    const walk = (value: JsonValue, path: Array<string | number>, label: string): void => {
      const kind: NodeKind = this.isArray(value) ? 'array' : this.isObject(value) ? 'object' : 'value'
      if (kind !== 'value') out.push({ label, path: [...path], kind })

      if (this.isObject(value)) {
        for (const [k, v] of Object.entries(value)) walk(v, [...path, k], `${label}.${k}`)
      } else if (this.isArray(value)) {
        for (let i = 0; i < value.length; i++) walk(value[i] as JsonValue, [...path, i], `${label}[${i}]`)
      }
    }

    walk(root, [], 'Inicio')

    return out
  }

  /** Collects JSON-serialized paths of all complex (object/array) nodes in the tree. */
  collectComplexKeys(v: JsonValue, parentPath: Array<string | number>): Array<string> {
    const keys: string[] = []

    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (this.isComplexValue(item)) {
          keys.push(JSON.stringify([...parentPath, i]))
          keys.push(...this.collectComplexKeys(item, [...parentPath, i]))
        }
      })
    } else if (typeof v === 'object' && v !== null) {
      Object.entries(v as JsonObject).forEach(([k, child]) => {
        if (this.isComplexValue(child)) {
          keys.push(JSON.stringify([...parentPath, k]))
          keys.push(...this.collectComplexKeys(child, [...parentPath, k]))
        }
      })
    }

    return keys
  }
}
