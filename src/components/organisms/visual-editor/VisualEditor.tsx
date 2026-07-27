import type React from 'react'
import { memo } from 'react'
import { Card, CardContent, CardHeader, Grid } from '@mui/material'
import { PalettePanel } from '../../molecules/palette-panel/PalettePanel'
import { AddFieldForm } from '../../molecules/add-field-form/AddFieldForm'
import { NodeEditor } from '../node-editor/NodeEditor'
import { useVisualEditor } from './useVisualEditor'

/**
 * Organism: the left-panel visual editor.
 * Renders the drag-and-drop palette on desktop, AddFieldForm on mobile,
 * and the NodeEditor tree.
 */
export const VisualEditor = memo(function VisualEditor(): React.JSX.Element {
  const { editingJson } = useVisualEditor()

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Modelo (visual)" subheader="Edição total + formulário" />
      <CardContent>
        <Grid container sx={{ flexDirection: 'column' }}>
          <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
            <AddFieldForm />
          </Grid>

          <Grid size={12} sx={{ display: { xs: 'none', md: 'block' }, pt: { md: '0 !important' } }}>
            <PalettePanel />
          </Grid>

          <Grid size={12} sx={{ pt: '0 !important' }}>
            <NodeEditor locked={editingJson} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
})
