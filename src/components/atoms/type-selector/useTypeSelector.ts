import { useCallback } from 'react'
import { useJsonStore } from '../../../store/jsonStore'
import { JsonMutationService } from '../../../services/JsonMutationService'
import { JsonTreeService } from '../../../services/JsonTreeService'
import type { NullableFieldType } from '../../../types'

const treeSvc = new JsonTreeService()
const mutationSvc = new JsonMutationService(treeSvc)

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
    [path, currentNodeType, handleUpdate]
  )

  return { setNodeType }
}
