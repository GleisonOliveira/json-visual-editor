import { useCallback, useMemo } from 'react'
import type React from 'react'
import { useJsonStore } from '../../../store/jsonStore'
import { useUiStore } from '../../../store/uiStore'
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonTreeService } from '../../../services/JsonTreeService'
import { ObjectItem } from '../../molecules/object-item/ObjectItem'
import { ArrayItem } from '../../molecules/array-item/ArrayItem'
import type { JsonValue, JsonObject, NullableFieldType } from '../../../types'

/**
 * Composable for the NodeEditor organism.
 * Manages the root node type, expand/collapse state, and recursive child rendering.
 */
export function useNodeEditor(locked: boolean): {
  value: JsonValue
  nodeType: NullableFieldType
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  collapseAll: () => void
  expandAll: (allKeys: string[]) => void
  allComplexKeys: string[]
  hasComplex: boolean
  renderChildren: (v: JsonValue, parentPath: Array<string | number>) => React.ReactNode | null
} {
  const { jsonValue } = useJsonStore()
  const { expanded, toggleExpand, expandPath, collapseAll, expandAll } = useUiStore()
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
  const { isArray, isObject } = treeSvc
  const value = jsonValue

  const nodeType: NullableFieldType = useMemo(() => {
    if (value === null) return 'null'
    if (isArray(value)) return 'array'
    if (isObject(value)) return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'

    return 'null'
  }, [value, isArray, isObject])

  const allComplexKeys = useMemo(() => treeSvc.collectComplexKeys(value, []), [value, treeSvc])
  const hasComplex = allComplexKeys.length > 0

  const renderChildren = useCallback(
    (v: JsonValue, parentPath: Array<string | number>): React.ReactNode | null => {
      if (Array.isArray(v)) {
        if (v.length === 0) return null

        return <>
          {v.map((item, i) => (
            <ArrayItem key={i} index={i} item={item} parentPath={parentPath} arr={v} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={locked} />
          ))}
        </>
      }

      if (typeof v === 'object' && v !== null) {
        const entries = Object.entries(v as JsonObject)
        if (entries.length === 0) return null

        return <>
          {entries.map(([k, child]) => (
            <ObjectItem key={k} objKey={k} value={child} parentPath={parentPath} obj={v as JsonObject} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={locked} />
          ))}
        </>
      }

      return null
    },
    [expanded, toggleExpand, expandPath, locked]
  )

  return {
    value, nodeType,
    expanded, toggleExpand, expandPath, collapseAll, expandAll,
    allComplexKeys, hasComplex,
    renderChildren,
  }
}
