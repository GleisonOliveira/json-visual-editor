import { useCallback } from 'react'
import { useJsonStore } from '../../../store/jsonStore'

/**
 * Composable for the ValueInput atom.
 * Provides typed change handlers for each value type (string, number, boolean).
 *
 * @param path - The path to the node in the JSON tree.
 * @returns Object with change handler callbacks.
 */
export function useValueInput(
  path: Array<string | number>
): {
  handleStringChange: (value: string) => void
  handleNumberChange: (value: number) => void
  handleBooleanChange: (value: boolean) => void
} {
  const { handleUpdate } = useJsonStore()

  const handleStringChange = useCallback(
    (value: string): void => { handleUpdate(path, value) },
    [path, handleUpdate]
  )

  const handleNumberChange = useCallback(
    (value: number): void => { handleUpdate(path, value) },
    [path, handleUpdate]
  )

  const handleBooleanChange = useCallback(
    (value: boolean): void => { handleUpdate(path, value) },
    [path, handleUpdate]
  )

  return { handleStringChange, handleNumberChange, handleBooleanChange }
}
