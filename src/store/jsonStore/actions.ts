import type { JsonValue, DndPayload, NodeTarget, InsertValueOpts } from '../../types'
import { JsonTreeService } from '../../services/JsonTreeService'
import { JsonMutationService } from '../../services/JsonMutationService'

const treeSvc = new JsonTreeService()
const mutationSvc = new JsonMutationService(treeSvc)

/**
 * Pure action creators for the JSON store.
 * Each action receives the current `jsonValue` and returns the new value.
 * Extracted for testability and separation of concerns.
 */
export const jsonActions = {
  /** Replaces the entire JSON root. */
  setJsonValue: (prev: JsonValue, updater: (prev: JsonValue) => JsonValue): JsonValue =>
    updater(prev),

  /** Updates a primitive value at the given path. */
  handleUpdate: (prev: JsonValue, path: Array<string | number>, next: JsonValue): JsonValue =>
    mutationSvc.updatePrimitive(prev, path, next),

  /** Moves a node from one position to another. */
  handleMove: (prev: JsonValue, payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null): JsonValue =>
    mutationSvc.moveNode(prev, payload, toParentPath, toKey),

  /** Inserts a new default node at the given position. */
  handleInsert: (prev: JsonValue, paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null): JsonValue =>
    mutationSvc.insertFromPalette(prev, paletteType, toParentPath, toKey),

  /** Inserts a field via the AddFieldForm. */
  handleApplyInsert: (prev: JsonValue, target: NodeTarget, name: string, type: string, insertValue: InsertValueOpts): JsonValue =>
    mutationSvc.applyInsert(prev, target, name, type, insertValue),
}
