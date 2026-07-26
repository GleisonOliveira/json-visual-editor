import type React from 'react'
import { Box, IconButton, TextField, Tooltip } from '@mui/material'
import { Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import { InlineNodeEditor } from '../inline-node-editor/InlineNodeEditor'
import { ContainerDropZone } from '../../atoms/container-drop-zone/ContainerDropZone'
import { useDndItem } from '../../../hooks/useDndItem'
import { useObjectItem } from './useObjectItem'
import { useJsonStore } from '../../../store/jsonStore'
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonTreeService } from '../../../services/JsonTreeService'
import type { JsonValue, JsonObject } from '../../../types'

function expandInserted(parentPath: Array<string | number>, expandPathFn: (p: Array<string | number>) => void): void {
  const newJson = useJsonStore.getState().jsonValue
  let node: JsonValue = newJson
  for (const seg of parentPath) node = (node as Record<string | number, JsonValue>)[seg] as JsonValue
  let newKey: string | number
  if (Array.isArray(node)) newKey = node.length - 1
  else newKey = Object.keys(node as object).at(-1)!
  expandPathFn([...parentPath, newKey])
}

/**
 * Molecule: renders a single key-value pair inside an object node.
 * Features: key renaming, delete, drag-and-drop reordering, expand/collapse for nested complex values,
 * and a nested ContainerDropZone when expanded.
 */
export function ObjectItem(props: {
  objKey: string
  value: JsonValue
  parentPath: Array<string | number>
  obj: JsonObject
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}): React.JSX.Element {
  const { objKey: k, value: v, parentPath, obj, expanded, toggleExpand, expandPath, renderChildren, locked } = props
  const { handleUpdate, handleMove, handleInsert } = useObjectItem()
  const container = useContainer()
  const treeSvc = container.get<JsonTreeService>(TYPES.JsonTreeService)
  const { isComplexValue, isArray, isPalettePayload, isAncestorOrEqual } = treeSvc
  const itemPath = [...parentPath, k]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath, k)
  const expandKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { handleInsert(payload.paletteType, parentPath, k); expandInserted(parentPath, expandPath);

 return }

        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        handleMove(payload, parentPath, k)
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
        <Tooltip title={`Deletar ${k}`} arrow>
          <span>
            <IconButton size="small" color="error" disabled={locked} aria-label={`Deletar ${k}`} onClick={(e) => { e.stopPropagation(); const o = { ...obj }; delete o[k]; handleUpdate(parentPath, o) }}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          size="small"
          defaultValue={k}
          variant="outlined"
          disabled={locked}
          slotProps={{ input: { 'aria-label': `Renomear chave ${k}` } }}
          sx={{ width: 120 }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) => {
            if (locked) return
            const nextKey = e.target.value.trim()
            if (!nextKey || nextKey === k) return
            const o = { ...obj }
            o[nextKey] = o[k] as JsonValue
            delete o[k]
            handleUpdate(parentPath, o)
          }}
        />
        <InlineNodeEditor value={v} path={itemPath} locked={locked} />
        {isComplexValue(v) && (
          <Tooltip title={expanded.has(expandKey) ? 'Recolher' : 'Expandir'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(expandKey) }} sx={{ ml: 'auto' }}>
              {expanded.has(expandKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(v) && expanded.has(expandKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(v, itemPath)}
          <ContainerDropZone parentPath={itemPath} parentKind={isArray(v) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}
