import { useJsonStore } from '../../../store/jsonStore'

/**
 * Composable for the ArrayItem molecule.
 * Provides access to store actions needed for array item operations
 * (update, move, insert). Uses targeted selectors to avoid subscribing
 * to the full store state.
 */
export function useArrayItem(): {
  handleUpdate: (path: Array<string | number>, next: import('../../../types').JsonValue) => void
  handleMove: (payload: import('../../../types').DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  handleInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
} {
  const handleUpdate = useJsonStore((s) => s.handleUpdate)
  const handleMove = useJsonStore((s) => s.handleMove)
  const handleInsert = useJsonStore((s) => s.handleInsert)

  return { handleUpdate, handleMove, handleInsert }
}
