import type { JsonValue, JsonObject, JsonArray, NodeKind, NodeTarget, DndPayload, PalettePayload, InsertValueOpts, BuildDefaultValueOpts } from '../types'

export function isPalettePayload(p: DndPayload): p is PalettePayload {
  return 'fromPalette' in p && p.fromPalette === true
}

export const isObject = (v: unknown): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export const isArray = (v: unknown): v is JsonArray => Array.isArray(v)

export function getAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
  let cur: JsonValue = root
  for (const seg of path) cur = (cur as JsonObject)[seg as string] as JsonValue

  return cur
}

export function setAtPath(
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

export function removeAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
  if (path.length === 0) return root

  return setAtPath(root, path.slice(0, -1), (parent: JsonValue) => {
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

export function insertAtPath(
  root: JsonValue,
  parentPath: Array<string | number>,
  key: string | number | null,
  value: JsonValue,
  originalKey?: string,
  insertAfter?: boolean
): JsonValue {
  return setAtPath(root, parentPath, (parent: JsonValue) => {
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

export function isAncestorOrEqual(candidateAncestor: Array<string | number>, path: Array<string | number>): boolean {
  if (candidateAncestor.length > path.length) return false

  return candidateAncestor.every((seg, i) => seg === path[i])
}

export function buildDefaultValue(opts: BuildDefaultValueOpts): JsonValue {
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

export function moveNode(
  root: JsonValue,
  payload: DndPayload,
  toParentPath: Array<string | number>,
  toKey: string | number | null
): JsonValue {
  if (isPalettePayload(payload)) return root
  const { fromPath, fromKey } = payload
  if (isAncestorOrEqual(fromPath, toParentPath)) return root
  const fromParentPath = fromPath.slice(0, -1)
  const fromSlot = fromPath[fromPath.length - 1]
  if (
    JSON.stringify(fromParentPath) === JSON.stringify(toParentPath) &&
    toKey === fromSlot
  ) return root
  const value = getAtPath(root, fromPath)
  const sameParent = JSON.stringify(fromParentPath) === JSON.stringify(toParentPath)
  const movingDown = sameParent && toKey !== null && (
    typeof toKey === 'number'
      ? (fromSlot as number) < (toKey as number)
      : Object.keys(getAtPath(root, toParentPath) as JsonObject).indexOf(fromSlot as string) <
        Object.keys(getAtPath(root, toParentPath) as JsonObject).indexOf(toKey as string)
  )
  let adjustedKey = toKey

  if (sameParent && toKey !== null && typeof toKey === 'number' && movingDown) {
    adjustedKey = (toKey as number) - 1
  }

  const afterRemove = removeAtPath(root, fromPath)

  return insertAtPath(afterRemove, toParentPath, adjustedKey, value, fromKey, movingDown)
}

export function insertFromPalette(
  root: JsonValue,
  paletteType: string,
  toParentPath: Array<string | number>,
  toKey: string | number | null
): JsonValue {
  const value = buildDefaultValue({ type: paletteType, name: 'newField', valueText: '', valueNumber: 0, valueBoolean: false, isNull: paletteType === 'null' })

  return insertAtPath(root, toParentPath, toKey, value, toKey === null ? 'newField' : undefined)
}

export function updatePrimitive(
  root: JsonValue,
  path: Array<string | number>,
  next: JsonValue
): JsonValue {
  return setAtPath(root, path, () => next)
}

export function enumerateTargets(root: JsonValue): NodeTarget[] {
  const out: NodeTarget[] = []

  const walk = (value: JsonValue, path: Array<string | number>, label: string): void => {
    const kind: NodeKind = isArray(value) ? 'array' : isObject(value) ? 'object' : 'value'
    if (kind !== 'value') out.push({ label, path: [...path], kind })

    if (isObject(value)) {
      for (const [k, v] of Object.entries(value)) walk(v, [...path, k], `${label}.${k}`)
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) walk(value[i] as JsonValue, [...path, i], `${label}[${i}]`)
    }
  }

  walk(root, [], 'Início')

  return out
}

export function applyInsert(
  root: JsonValue,
  target: NodeTarget,
  name: string,
  type: string,
  insertValue: InsertValueOpts
): JsonValue {
  const cleanName = (name ?? '').trim()
  const valueToInsert = buildDefaultValue({
    type,
    name: cleanName,
    valueText: insertValue.valueText,
    valueNumber: insertValue.valueNumber,
    valueBoolean: insertValue.valueBoolean,
    isNull: insertValue.isNull,
  })

  if (target.kind === 'object') {
    return setAtPath(root, target.path, (obj: JsonValue) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        (obj as JsonObject)[cleanName || 'newField'] = valueToInsert
      }

      return obj
    })
  }

  if (target.kind === 'array') {
    return setAtPath(root, target.path, (arr: JsonValue) => {
      if (Array.isArray(arr)) arr.push(valueToInsert)

      return arr
    })
  }

  return root
}
