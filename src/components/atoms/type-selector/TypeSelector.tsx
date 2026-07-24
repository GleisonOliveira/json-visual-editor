import type React from 'react'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useTypeSelector } from './useTypeSelector'
import type { NullableFieldType } from '../../../types'

/**
 * Atom: dropdown selector for JSON node types.
 * Renders a MUI Select with the six available types (Texto, Número, Boolean, Objeto, Array, Nulo).
 * Used inside InlineNodeEditor and the root NodeEditor to let users change a node's type.
 */
export function TypeSelector(props: {
  path: Array<string | number>
  nodeType: NullableFieldType
  locked: boolean
  labelId?: string
}): React.JSX.Element {
  const { path, nodeType, locked, labelId } = props
  const { setNodeType } = useTypeSelector(path, nodeType)

  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <InputLabel id={labelId ?? `type-${path.join('-')}`}>Tipo</InputLabel>
      <Select
        labelId={labelId ?? `type-${path.join('-')}`}
        value={nodeType}
        label="Tipo"
        disabled={locked}
        onChange={(e) => setNodeType(e.target.value as NullableFieldType)}
      >
        <MenuItem value="string">Texto</MenuItem>
        <MenuItem value="number">Número</MenuItem>
        <MenuItem value="boolean">Boolean</MenuItem>
        <MenuItem value="object">Objeto</MenuItem>
        <MenuItem value="array">Array</MenuItem>
        <MenuItem value="null">Nulo</MenuItem>
      </Select>
    </FormControl>
  )
}
