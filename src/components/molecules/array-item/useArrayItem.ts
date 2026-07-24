import { useJsonStore } from '../../../store/jsonStore'

/**
 * Composable for the ArrayItem molecule.
 * Provides access to store actions needed for array item operations
 * (update, move, insert).
 */
export function useArrayItem(): {
  handleUpdate: (path: Array<string | number>, next: import('../../../types').JsonValue) => void
  handleMove: (payload: import('../../../types').DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  handleInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
} {
  const { handleUpdate, handleMove, handleInsert } = useJsonStore()

  return { handleUpdate, handleMove, handleInsert }
}
