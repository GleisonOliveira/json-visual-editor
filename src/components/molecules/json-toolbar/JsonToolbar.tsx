import type React from 'react'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import { Pencil, Copy, X, CheckCheck, Download } from 'lucide-react'
import { useJsonToolbar } from './useJsonToolbar'

/**
 * Molecule: toolbar for the JSON panel with actions (edit, copy, copy minified, download).
 * Shows icon-only buttons on mobile and text buttons on desktop.
 * When editing, shows Cancelar/Validar instead of the action buttons.
 */
export function JsonToolbar(): React.JSX.Element {
  const {
    editingJson, isSmall,
    handleEdit, handleCancel, handleValidate,
    handleCopy, handleCopyMinified, handleDownload,
  } = useJsonToolbar()

  if (editingJson) {
    return (
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, justifyContent: 'center' }}>
        {isSmall ? (
          <>
            <Tooltip title="Cancelar">
              <IconButton size="small" color="error" onClick={handleCancel}>
                <X size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Validar">
              <IconButton size="small" color="success" onClick={handleValidate}>
                <CheckCheck size={16} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Button size="small" variant="outlined" color="error" startIcon={<X size={14} />} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button size="small" variant="outlined" color="success" startIcon={<CheckCheck size={14} />} onClick={handleValidate}>
              Validar
            </Button>
          </>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 1.5, display: 'flex', gap: 1, justifyContent: 'center' }}>
      {isSmall ? (
        <>
          <Tooltip title="Editar JSON">
            <IconButton size="small" color="primary" onClick={handleEdit}>
              <Pencil size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copiar">
            <IconButton size="small" color="primary" onClick={handleCopy}>
              <Copy size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copiar minificado">
            <IconButton size="small" color="primary" onClick={handleCopyMinified}>
              <Copy size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Baixar">
            <IconButton size="small" color="primary" onClick={handleDownload}>
              <Download size={16} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Button size="small" variant="outlined" startIcon={<Pencil size={14} />} onClick={handleEdit}>
            Editar JSON
          </Button>
          <Button size="small" variant="outlined" startIcon={<Copy size={14} />} onClick={handleCopy}>
            Copiar
          </Button>
          <Button size="small" variant="outlined" startIcon={<Copy size={14} />} onClick={handleCopyMinified}>
            Copiar minificado
          </Button>
          <Button size="small" variant="outlined" startIcon={<Download size={14} />} onClick={handleDownload}>
            Baixar
          </Button>
        </>
      )}
    </Box>
  )
}
