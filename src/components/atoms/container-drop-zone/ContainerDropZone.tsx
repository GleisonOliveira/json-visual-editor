import React, { useState, useMemo, memo } from 'react'
import { Box, Typography } from '@mui/material'
import type { DndPayload } from '../../../types'
import { useJsonStore } from '../../../store/jsonStore'
import { useUiStore } from '../../../store/uiStore'
import { useContainer } from '../../../useContainer'
import { TYPES } from '../../../core/types'
import type { JsonTreeService } from '../../../services/JsonTreeService'
import { pathsEqual } from '../../../lib/pathsEqual'
import { expandInserted } from '../../../lib/expandInserted'

interface ContainerDropZoneProps {
  parentPath: Array<string | number>
  parentKind: 'object' | 'array'
  locked?: boolean
}

function compareContainerDropZoneProps(prev: ContainerDropZoneProps, next: ContainerDropZoneProps): boolean {
  return (
    prev.parentKind === next.parentKind
    && prev.locked === next.locked
    && pathsEqual(prev.parentPath, next.parentPath)
  )
}

/**
 * Atom: a dashed-border drop zone for drag-and-drop operations.
 * Accepts palette drops (insert new field) and reorder drops (move existing node).
 * Visual feedback changes on drag-over. Used inside ObjectItem, ArrayItem, and NodeEditor.
 */
export const ContainerDropZone = memo(function ContainerDropZone(props: ContainerDropZoneProps): React.JSX.Element {
  const { parentPath, locked } = props
  const { handleMove, handleInsert } = useJsonStore()
  const { expandPath } = useUiStore()
  const container = useContainer()
  const treeSvc = useMemo(() => container.get<JsonTreeService>(TYPES.JsonTreeService), [container])
  const { isPalettePayload, isAncestorOrEqual } = treeSvc
  const [isOver, setIsOver] = useState(false)
  const depth = React.useRef(0)

  return (
    <Box
      onDragEnter={(e) => { if (locked) return; e.preventDefault(); e.stopPropagation(); depth.current++; setIsOver(true) }}
      onDragLeave={(e) => { e.stopPropagation(); depth.current--; if (depth.current === 0) setIsOver(false) }}
      onDragOver={(e) => { if (locked) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={(e) => {
        if (locked) return
        e.preventDefault(); e.stopPropagation()
        depth.current = 0; setIsOver(false)
        const raw = e.dataTransfer.getData('application/jsonve-dnd')
        if (!raw) return
        const payload = JSON.parse(raw) as DndPayload

        if (isPalettePayload(payload)) {
          handleInsert(payload.paletteType, parentPath, null)
          expandInserted(parentPath, expandPath)

          return
        }

        if (isAncestorOrEqual(payload.fromPath, parentPath)) return
        handleMove(payload, parentPath, null)
      }}
      sx={{
        height: 36,
        borderRadius: 1,
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'border-color 0.1s, background-color 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="caption" color={isOver ? 'primary' : 'text.disabled'}>
        Arraste itens para cá
      </Typography>
    </Box>
  )
}, compareContainerDropZoneProps)
