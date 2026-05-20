import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { DndPayload } from '../../types'
import { isPalettePayload, isAncestorOrEqual } from '../../lib/jsonUtils'
import { useJsonStore } from '../../store/jsonStore'

export function ContainerDropZone(props: {
  parentPath: Array<string | number>
  parentKind: 'object' | 'array'
  locked?: boolean
}) {
  const { parentPath, locked } = props
  const { handleMove, handleInsert } = useJsonStore()
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
        if (isPalettePayload(payload)) { handleInsert(payload.paletteType, parentPath, null); return }
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
}
