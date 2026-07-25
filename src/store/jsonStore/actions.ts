import type { Container } from 'inversify'
import type { JsonValue, DndPayload, NodeTarget, InsertValueOpts } from '../../types'
import { TYPES } from '../../core/types'
import type { JsonMutationService } from '../../services/JsonMutationService'

/**
 * Pure action creators for the JSON store, created via factory pattern.
 * Each action receives the current `jsonValue` and returns the new value.
 * Services are resolved from the provided Inversify container.
 *
 * @param appContainer - The Inversify container to resolve services from.
 * @returns An object with all JSON store action creators.
 */
export function createJsonActions(appContainer: Container): {
  setJsonValue: (prev: JsonValue, updater: (prev: JsonValue) => JsonValue) => JsonValue
  handleUpdate: (prev: JsonValue, path: Array<string | number>, next: JsonValue) => JsonValue
  handleMove: (prev: JsonValue, payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => JsonValue
  handleInsert: (prev: JsonValue, paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => JsonValue
  handleApplyInsert: (prev: JsonValue, target: NodeTarget, name: string, type: string, insertValue: InsertValueOpts) => JsonValue
} {
  const mutationSvc = appContainer.get<JsonMutationService>(TYPES.JsonMutationService)

  return {
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
}
