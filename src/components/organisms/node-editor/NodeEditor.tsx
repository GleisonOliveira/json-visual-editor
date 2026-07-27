import type React from 'react'
import { Box, Button } from '@mui/material'
import { TypeSelector } from '../../atoms/type-selector/TypeSelector'
import { ValueInput } from '../../atoms/value-input/ValueInput'
import { ContainerDropZone } from '../../atoms/container-drop-zone/ContainerDropZone'
import { useNodeEditor } from './useNodeEditor'

/**
 * Organism: the root recursive JSON tree editor.
 * Renders the root node type selector and value input, expand/collapse-all buttons,
 * and recursively renders child nodes via ObjectItem/ArrayItem.
 * This is the main editing interface for the visual JSON tree.
 */
export function NodeEditor({ locked }: { locked: boolean }): React.JSX.Element {
  const {
    value, nodeType,
    collapseAll, expandAll,
    hasComplex,
    renderChildren,
  } = useNodeEditor(locked)

  if (nodeType !== 'object' && nodeType !== 'array') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TypeSelector path={[]} nodeType={nodeType} locked={locked} labelId="type-root" />
        <ValueInput value={value} path={[]} nodeType={nodeType} locked={locked} labelId="bool-root" />
      </Box>
    )
  }

  return (
    <Box>
      {hasComplex && (
        <Box sx={{ display: 'flex', mb: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" size="small" onClick={() => expandAll([])}>
            Expandir todos
          </Button>
          <Button variant="outlined" size="small" onClick={() => collapseAll()}>
            Recolher todos
          </Button>
        </Box>
      )}
      {renderChildren(value, [])}
      <ContainerDropZone parentPath={[]} parentKind={Array.isArray(value) ? 'array' : 'object'} locked={locked} />
    </Box>
  )
}
