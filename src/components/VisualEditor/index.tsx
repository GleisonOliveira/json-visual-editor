import { Box, Button, Card, CardContent, CardHeader, Grid } from '@mui/material'
import { Type, Hash, ToggleLeft, Braces, List, Ban } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { AddFieldForm } from '../AddFieldForm'
import { NodeEditor } from '../NodeEditor'

const PALETTE_ITEMS = [
  { type: 'string', icon: <Type size={14} /> },
  { type: 'number', icon: <Hash size={14} /> },
  { type: 'boolean', icon: <ToggleLeft size={14} /> },
  { type: 'object', icon: <Braces size={14} /> },
  { type: 'array', icon: <List size={14} /> },
  { type: 'null', icon: <Ban size={14} /> },
]

export function VisualEditor() {
  const { editingJson } = useUiStore()

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Modelo (visual)" subheader="Edição total + formulário" />
      <CardContent>
        <Grid container sx={{ flexDirection: 'column' }}>
          <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
            <AddFieldForm />
          </Grid>

          <Grid size={12} sx={{ display: { xs: 'none', md: 'block' }, pt: { md: '0 !important' } }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1.5 }}>
              {PALETTE_ITEMS.map(({ type, icon }) => (
                <Button
                  key={type}
                  size="small"
                  variant="outlined"
                  startIcon={icon}
                  draggable={!editingJson}
                  disabled={editingJson}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/jsonve-dnd', JSON.stringify({ fromPalette: true, paletteType: type }))
                  }}
                  sx={{ cursor: editingJson ? 'default' : 'grab' }}
                >
                  {type}
                </Button>
              ))}
            </Box>
          </Grid>

          <Grid size={12} sx={{ pt: '0 !important' }}>
            <NodeEditor locked={editingJson} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
