import type React from 'react'
import { memo, useMemo } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import { InlineNodeEditor } from '../inline-node-editor/InlineNodeEditor'
import { ContainerDropZone } from '../../atoms/container-drop-zone/ContainerDropZone'
import { useDndItem } from '../../../hooks/useDndItem'
import { useArrayItem } from './useArrayItem'
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonTreeService } from '../../../services/JsonTreeService'
import type { JsonValue, JsonArray } from '../../../types'
import { expandInserted } from '../../../lib/expandInserted'
import { pathsEqual } from '../../../lib/pathsEqual'
import { setsEqual } from '../../../lib/setsEqual'

interface ArrayItemProps {
  index: number
  item: JsonValue
  parentPath: Array<string | number>
  arr: JsonArray
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}

function compareArrayItemProps(prev: ArrayItemProps, next: ArrayItemProps): boolean {
  return (
    prev.index === next.index
    && prev.item === next.item
    && prev.locked === next.locked
    && prev.arr === next.arr
    && setsEqual(prev.expanded, next.expanded)
    && prev.toggleExpand === next.toggleExpand
    && prev.expandPath === next.expandPath
    && prev.renderChildren === next.renderChildren
    && pathsEqual(prev.parentPath, next.parentPath)
  )
}

/**
 * Molecule: renders a single indexed item inside an array node.
 * Features: delete, drag-and-drop reordering, expand/collapse for nested complex values,
 * and a nested ContainerDropZone when expanded.
 */
export const ArrayItem = memo(function ArrayItem(props: ArrayItemProps): React.JSX.Element {
  const { index: i, item, parentPath, arr, expanded, toggleExpand, expandPath, renderChildren, locked } = props
  const { handleUpdate, handleMove, handleInsert } = useArrayItem()
  const container = useContainer()
  const treeSvc = useMemo(() => container.get<JsonTreeService>(TYPES.JsonTreeService), [container])
  const { isComplexValue, isArray, isPalettePayload, isAncestorOrEqual } = treeSvc
  const itemPath = [...parentPath, i]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath)
  const expandKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { handleInsert(payload.paletteType, parentPath, i); expandInserted(parentPath, expandPath);

 return }

        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        handleMove(payload, parentPath, i)
      }) : {})}
      sx={{
        mb: 1.5,
        opacity: isDragging ? 0.4 : 1,
        outline: isOver && !locked ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        borderRadius: 1,
        transition: 'opacity 0.15s, outline 0.1s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
        <Box
          {...(!locked ? dragHandleProps : {})}
          role="img"
          aria-label="Arrastar para reordenar"
          sx={{ display: 'flex', alignItems: 'center', color: locked ? 'action.disabled' : 'text.secondary', cursor: locked ? 'default' : 'grab' }}
        >
          <GripVertical size={14} />
        </Box>
        <Tooltip title={`Deletar [${i}]`} arrow>
          <span>
            <IconButton size="small" color="error" disabled={locked} aria-label={`Deletar [${i}]`} onClick={(e) => { e.stopPropagation(); const a = [...arr]; a.splice(i, 1); handleUpdate(parentPath, a) }}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" sx={{ minWidth: 28, fontFamily: 'monospace' }}>[{i}]</Typography>
        <InlineNodeEditor value={item} path={itemPath} locked={locked} />
        {isComplexValue(item) && (
          <Tooltip title={expanded.has(expandKey) ? 'Recolher' : 'Expandir'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(expandKey) }} sx={{ ml: 'auto' }}>
              {expanded.has(expandKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(item) && expanded.has(expandKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(item, itemPath)}
          <ContainerDropZone parentPath={itemPath} parentKind={isArray(item) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}, compareArrayItemProps)
