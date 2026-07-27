import React, { useState, useCallback, useRef } from 'react'
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
  const onDropRef = useRef<((payload: DndPayload) => void) | null>(null)

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

  const onDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); depth.current++; setIsOver(true) }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => { e.stopPropagation(); depth.current--; if (depth.current === 0) setIsOver(false) }, [])
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move' }, [])

  const stableDropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    depth.current = 0; setIsOver(false)
    const raw = e.dataTransfer.getData('application/jsonve-dnd')
    if (!raw) return

    if (onDropRef.current) onDropRef.current(JSON.parse(raw) as DndPayload)
  }, [])

  const dropZoneProps = useCallback((onDrop: (payload: DndPayload) => void): {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  } => {
    onDropRef.current = onDrop

    return { onDragEnter, onDragLeave, onDragOver, onDrop: stableDropHandler }
  }, [onDragEnter, onDragLeave, onDragOver, stableDropHandler])

  return { isOver, isDragging, dragHandleProps, dropZoneProps }
}
