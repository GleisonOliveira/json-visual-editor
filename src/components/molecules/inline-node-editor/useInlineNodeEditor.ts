import { useMemo } from 'react'
import { JsonTreeService } from '../../../services/JsonTreeService'
import type { JsonValue, NullableFieldType } from '../../../types'

const treeSvc = new JsonTreeService()
const { isArray, isObject } = treeSvc

/**
 * Composable for InlineNodeEditor.
 * Derives the current node type from the JSON value.
 *
 * @param value - The current JSON value of the node.
 * @returns Object with the derived `nodeType`.
 */
export function useInlineNodeEditor(value: JsonValue): { nodeType: NullableFieldType } {
  const nodeType: NullableFieldType = useMemo(() => {
    if (value === null) return 'null'
    if (isArray(value)) return 'array'
    if (isObject(value)) return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'

    return 'null'
  }, [value])

  return { nodeType }
}
