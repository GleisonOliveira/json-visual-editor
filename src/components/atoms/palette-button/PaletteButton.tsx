import type React from 'react'
import { memo } from 'react'
import { Button } from '@mui/material'
import type { ReactNode } from 'react'

/**
 * Atom: a single draggable palette button used for drag-and-drop JSON type insertion.
 * Renders a MUI Button with an icon and label. Draggable state and disabled state
 * are controlled by the parent (typically PalettePanel).
 */
export const PaletteButton = memo(function PaletteButton(props: {
  type: string
  icon: ReactNode
  disabled: boolean
}): React.JSX.Element {
  const { type, icon, disabled } = props

  return (
    <Button
      key={type}
      size="small"
      variant="outlined"
      startIcon={icon}
      draggable={!disabled}
      disabled={disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/jsonve-dnd',
          JSON.stringify({ fromPalette: true, paletteType: type })
        )
      }}
      sx={{ cursor: disabled ? 'default' : 'grab' }}
    >
      {type}
    </Button>
  )
})
