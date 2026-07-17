import React, { useState } from 'react'
import type { DndPayload } from '../types'

export function useDndItem(path: Array<string | number>, fromKey?: string): {
  isOver: boolean
  isDragging: boolean
  dragHandleProps: {
    draggable: true
    onDragStart: (e: React.DragEvent) => void
    onDragEnd: () => void
  }
  dropZoneProps: (onDrop: (payload: DndPayload) => void) => {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
} {
  const [isOver, setIsOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const depth = React.useRef(0)

  const dragHandleProps = {
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      const payload: DndPayload = { fromPath: path, fromKey }
      e.dataTransfer.setData('application/jsonve-dnd', JSON.stringify(payload))
      e.dataTransfer.effectAllowed = 'move'
      setTimeout(() => setIsDragging(true), 0)
    },
    onDragEnd: () => { setIsDragging(false); setIsOver(false); depth.current = 0 },
  }

  const dropZoneProps = (onDrop: (payload: DndPayload) => void): {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  } => ({
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); depth.current++; setIsOver(true) },
    onDragLeave: (e: React.DragEvent) => { e.stopPropagation(); depth.current--; if (depth.current === 0) setIsOver(false) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move' },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      depth.current = 0; setIsOver(false)
      const raw = e.dataTransfer.getData('application/jsonve-dnd')
      if (!raw) return
      onDrop(JSON.parse(raw) as DndPayload)
    },
  })

  return { isOver, isDragging, dragHandleProps, dropZoneProps }
}
