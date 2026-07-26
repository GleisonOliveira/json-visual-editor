import type React from 'react'
import { Box } from '@mui/material'
import { Type, Hash, ToggleLeft, Braces, List, Ban } from 'lucide-react'
import { PaletteButton } from '../../atoms/palette-button/PaletteButton'
import { usePalettePanel } from './usePalettePanel'

const PALETTE_ITEMS = [
  { type: 'string', icon: <Type size={14} /> },
  { type: 'number', icon: <Hash size={14} /> },
  { type: 'boolean', icon: <ToggleLeft size={14} /> },
  { type: 'object', icon: <Braces size={14} /> },
  { type: 'array', icon: <List size={14} /> },
  { type: 'null', icon: <Ban size={14} /> },
]

/**
 * Molecule: renders the palette of 6 draggable type buttons for drag-and-drop JSON insertion.
 * Visible on desktop. All buttons are disabled when in edit mode.
 */
export function PalettePanel(): React.JSX.Element {
  const { isLocked } = usePalettePanel()

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1.5 }}>
      {PALETTE_ITEMS.map(({ type, icon }) => (
        <PaletteButton key={type} type={type} icon={icon} disabled={isLocked} />
      ))}
    </Box>
  )
}
