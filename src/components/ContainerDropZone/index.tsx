import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { DndPayload, JsonValue } from '../../types'
import { JsonTreeService } from '../../services/JsonTreeService'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'

const treeSvc = new JsonTreeService()
const { isPalettePayload, isAncestorOrEqual } = treeSvc

export function ContainerDropZone(props: {
  parentPath: Array<string | number>
  parentKind: 'object' | 'array'
  locked?: boolean
}): React.JSX.Element {
  const { parentPath, locked } = props
  const { handleMove, handleInsert } = useJsonStore()
  const { expandPath } = useUiStore()
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
          const newJson = useJsonStore.getState().jsonValue
          let node: JsonValue = newJson
          for (const seg of parentPath) node = (node as Record<string | number, JsonValue>)[seg] as JsonValue
          let newKey: string | number
          if (Array.isArray(node)) newKey = node.length - 1
          else newKey = Object.keys(node as object).at(-1)!
          expandPath([...parentPath, newKey])

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
}
