import { useCallback, useMemo } from 'react'
import { useJsonStore } from '../../../store/jsonStore'
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonMutationService } from '../../../services/JsonMutationService'
import type { NullableFieldType } from '../../../types'

/**
 * Composable for the TypeSelector atom.
 * Provides the `setNodeType` handler that converts a node's value
 * when the user changes its type via the dropdown.
 *
 * @param path - The path to the node in the JSON tree.
 * @param currentNodeType - The current type of the node.
 * @returns Object with `setNodeType` callback.
 */
export function useTypeSelector(
  path: Array<string | number>,
  currentNodeType: NullableFieldType
): { setNodeType: (nextType: NullableFieldType) => void } {
  const { handleUpdate } = useJsonStore()
  const container = useContainer()
  const mutationSvc = useMemo(() => container.get<JsonMutationService>(TYPES.JsonMutationService), [container])

  const setNodeType = useCallback(
    (nextType: NullableFieldType): void => {
      if (nextType === currentNodeType) return
      const next = mutationSvc.buildDefaultValue({
        type: nextType === 'null' ? 'string' : nextType,
        name: 'item',
        valueText: 'item',
        valueNumber: 0,
        valueBoolean: false,
        isNull: nextType === 'null',
      })
      handleUpdate(path, next)
    },
    [path, currentNodeType, handleUpdate, mutationSvc]
  )

  return { setNodeType }
}
