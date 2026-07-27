import type React from 'react'
import { memo } from 'react'
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { NumberField } from '../number-field/NumberField'
import { useValueInput } from './useValueInput'
import type { NullableFieldType } from '../../../types'
import { pathsEqual } from '../../../lib/pathsEqual'

interface ValueInputProps {
  value: unknown
  path: Array<string | number>
  nodeType: NullableFieldType
  locked: boolean
  labelId?: string
}

function compareValueInputProps(prev: ValueInputProps, next: ValueInputProps): boolean {
  return (
    prev.value === next.value
    && prev.nodeType === next.nodeType
    && prev.locked === next.locked
    && prev.labelId === next.labelId
    && pathsEqual(prev.path, next.path)
  )
}

/**
 * Atom: renders the appropriate value input for a JSON node based on its type.
 * - string → TextField
 * - number → NumberField
 * - boolean → Select (true/false)
 * - object/array/null → nothing
 *
 * Used inside InlineNodeEditor and the root NodeEditor.
 */
export const ValueInput = memo(function ValueInput(props: ValueInputProps): React.JSX.Element | null {
  const { value, path, nodeType, locked, labelId } = props
  const { handleStringChange, handleNumberChange, handleBooleanChange } = useValueInput(path)

  if (nodeType === 'object' || nodeType === 'array' || nodeType === 'null') return null

  if (nodeType === 'string') {
    return (
      <TextField
        size="small"
        value={value ?? ''}
        variant="outlined"
        disabled={locked}
        onChange={(e) => handleStringChange(e.target.value)}
        sx={{ flex: 1 }}
      />
    )
  }

  if (nodeType === 'number') {
    return (
      <NumberField
        value={value as number}
        disabled={locked}
        onChange={(n) => {
          if (!locked) handleNumberChange(n)
        }}
      />
    )
  }

  if (nodeType === 'boolean') {
    return (
      <FormControl size="small" sx={{ minWidth: 90 }}>
        <InputLabel id={labelId ?? `bool-${path.join('-')}`}>Valor</InputLabel>
        <Select
          labelId={labelId ?? `bool-${path.join('-')}`}
          value={String(value)}
          label="Valor"
          disabled={locked}
          onChange={(e) => handleBooleanChange(e.target.value === 'true')}
        >
          <MenuItem value="true">true</MenuItem>
          <MenuItem value="false">false</MenuItem>
        </Select>
      </FormControl>
    )
  }

  return null
}, compareValueInputProps)
