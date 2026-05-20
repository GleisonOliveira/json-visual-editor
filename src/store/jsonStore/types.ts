import type { JsonValue, DndPayload, NodeTarget, InsertValueOpts } from '../../types'

export type JsonStore = {
  jsonValue: JsonValue
  setJsonValue: (updater: (prev: JsonValue) => JsonValue) => void
  handleUpdate: (path: Array<string | number>, next: JsonValue) => void
  handleMove: (payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  handleInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
  handleApplyInsert: (target: NodeTarget, name: string, type: string, insertValue: InsertValueOpts) => void
}
