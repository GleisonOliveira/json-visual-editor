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
  hasComplex: boolean
  renderChildren: (v: JsonValue, parentPath: Array<string | number>) => React.ReactNode | null
} {
  const { jsonValue } = useJsonStore()
  const toggleExpand = useUiStore((s) => s.toggleExpand)
  const expandPath = useUiStore((s) => s.expandPath)
  const collapseAll = useUiStore((s) => s.collapseAll)
  const expandAll = useUiStore((s) => s.expandAll)
  const expanded = useUiStore((s) => s.expanded)
  const container = useContainer()
  const treeSvc = useMemo(() => container.get<JsonTreeService>(TYPES.JsonTreeService), [container])
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

  const hasComplex = useMemo(() => treeSvc.isComplexValue(value), [value, treeSvc])

  const expandAllLazy = useCallback((allKeys: string[]) => {
    if (allKeys.length > 0) {
      expandAll(allKeys)

      return
    }

    const currentTreeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
    const currentValue = useJsonStore.getState().jsonValue
    const keys = currentTreeSvc.collectComplexKeys(currentValue, [])
    expandAll(keys)
  }, [expandAll, container])

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
    expanded, toggleExpand, expandPath, collapseAll, expandAll: expandAllLazy,
    hasComplex,
    renderChildren,
  }
}
