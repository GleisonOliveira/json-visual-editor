import React from 'react'
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Button } from '@mui/material'
import { Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import type { JsonValue, JsonObject, JsonArray, NullableFieldType } from '../../types'
import { isArray, isObject, buildDefaultValue } from '../../lib/jsonUtils'
import { useJsonStore } from '../../store/jsonStore'
import { useUiStore } from '../../store/uiStore'
import { NumberField } from '../NumberField'
import { ContainerDropZone } from '../ContainerDropZone'
import { useDndItem } from '../../hooks/useDndItem'
import { isPalettePayload, isAncestorOrEqual } from '../../lib/jsonUtils'

// ─── helpers shared locally ─────────────────────────────────────────────────

const isComplexValue = (v: JsonValue): boolean =>
  Array.isArray(v) || (typeof v === 'object' && v !== null)

function expandInserted(parentPath: Array<string | number>, expandPathFn: (p: Array<string | number>) => void): void {
  const newJson = useJsonStore.getState().jsonValue
  let node: JsonValue = newJson
  for (const seg of parentPath) node = (node as Record<string | number, JsonValue>)[seg] as JsonValue
  let newKey: string | number
  if (Array.isArray(node)) newKey = node.length - 1
  else newKey = Object.keys(node as object).at(-1)!
  expandPathFn([...parentPath, newKey])
}

function collectComplexKeys(v: JsonValue, parentPath: Array<string | number>): Array<string> {
  const keys: string[] = []

  if (Array.isArray(v)) {
    v.forEach((item, i) => {
      if (isComplexValue(item)) {
        keys.push(JSON.stringify([...parentPath, i]))
        keys.push(...collectComplexKeys(item, [...parentPath, i]))
      }
    })
  } else if (typeof v === 'object' && v !== null) {
    Object.entries(v as JsonObject).forEach(([k, child]) => {
      if (isComplexValue(child)) {
        keys.push(JSON.stringify([...parentPath, k]))
        keys.push(...collectComplexKeys(child, [...parentPath, k]))
      }
    })
  }

  return keys
}

// ─── ObjectItem ──────────────────────────────────────────────────────────────

function ObjectItem(props: {
  objKey: string
  value: JsonValue
  parentPath: Array<string | number>
  obj: JsonObject
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}): React.JSX.Element {
  const { objKey: k, value: v, parentPath, obj, expanded, toggleExpand, expandPath, renderChildren, locked } = props
  const { handleUpdate, handleMove, handleInsert } = useJsonStore()
  const itemPath = [...parentPath, k]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath, k)
  const expandKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { handleInsert(payload.paletteType, parentPath, k); expandInserted(parentPath, expandPath);

 return }

        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        handleMove(payload, parentPath, k)
      }) : {})}
      sx={{
        mb: 1.5,
        opacity: isDragging ? 0.4 : 1,
        outline: isOver && !locked ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        borderRadius: 1,
        transition: 'opacity 0.15s, outline 0.1s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
        <Box
          {...(!locked ? dragHandleProps : {})}
          sx={{ display: 'flex', alignItems: 'center', color: locked ? 'action.disabled' : 'text.secondary', cursor: locked ? 'default' : 'grab' }}
        >
          <GripVertical size={14} />
        </Box>
        <Tooltip title={`Deletar ${k}`} arrow>
          <span>
            <IconButton size="small" color="error" disabled={locked} onClick={(e) => { e.stopPropagation(); const o = { ...obj }; delete o[k]; handleUpdate(parentPath, o) }}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          size="small"
          defaultValue={k}
          variant="outlined"
          disabled={locked}
          sx={{ width: 120 }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) => {
            if (locked) return
            const nextKey = e.target.value.trim()
            if (!nextKey || nextKey === k) return
            const o = { ...obj }
            o[nextKey] = o[k] as JsonValue
            delete o[k]
            handleUpdate(parentPath, o)
          }}
        />
        <InlineNodeEditor value={v} path={itemPath} locked={locked} />
        {isComplexValue(v) && (
          <Tooltip title={expanded.has(expandKey) ? 'Recolher' : 'Expandir'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(expandKey) }} sx={{ ml: 'auto' }}>
              {expanded.has(expandKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(v) && expanded.has(expandKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(v, itemPath)}
          <ContainerDropZone parentPath={itemPath} parentKind={isArray(v) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}

// ─── ArrayItem ───────────────────────────────────────────────────────────────

function ArrayItem(props: {
  index: number
  item: JsonValue
  parentPath: Array<string | number>
  arr: JsonArray
  expanded: Set<string>
  toggleExpand: (key: string) => void
  expandPath: (path: Array<string | number>) => void
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}): React.JSX.Element {
  const { index: i, item, parentPath, arr, expanded, toggleExpand, expandPath, renderChildren, locked } = props
  const { handleUpdate, handleMove, handleInsert } = useJsonStore()
  const itemPath = [...parentPath, i]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath)
  const expandKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { handleInsert(payload.paletteType, parentPath, i); expandInserted(parentPath, expandPath);

 return }

        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        handleMove(payload, parentPath, i)
      }) : {})}
      sx={{
        mb: 1.5,
        opacity: isDragging ? 0.4 : 1,
        outline: isOver && !locked ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        borderRadius: 1,
        transition: 'opacity 0.15s, outline 0.1s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
        <Box
          {...(!locked ? dragHandleProps : {})}
          sx={{ display: 'flex', alignItems: 'center', color: locked ? 'action.disabled' : 'text.secondary', cursor: locked ? 'default' : 'grab' }}
        >
          <GripVertical size={14} />
        </Box>
        <Tooltip title={`Deletar [${i}]`} arrow>
          <span>
            <IconButton size="small" color="error" disabled={locked} onClick={(e) => { e.stopPropagation(); const a = [...arr]; a.splice(i, 1); handleUpdate(parentPath, a) }}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" sx={{ minWidth: 28, fontFamily: 'monospace' }}>[{i}]</Typography>
        <InlineNodeEditor value={item} path={itemPath} locked={locked} />
        {isComplexValue(item) && (
          <Tooltip title={expanded.has(expandKey) ? 'Recolher' : 'Expandir'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(expandKey) }} sx={{ ml: 'auto' }}>
              {expanded.has(expandKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(item) && expanded.has(expandKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(item, itemPath)}
          <ContainerDropZone parentPath={itemPath} parentKind={isArray(item) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}

// ─── InlineNodeEditor (non-root) ─────────────────────────────────────────────

function InlineNodeEditor({ value, path, locked }: { value: JsonValue; path: Array<string | number>; locked: boolean }): React.JSX.Element {
  const { handleUpdate } = useJsonStore()

  const nodeType: NullableFieldType =
    value === null ? 'null'
    : isArray(value) ? 'array'
    : isObject(value) ? 'object'
    : typeof value === 'string' ? 'string'
    : typeof value === 'number' ? 'number'
    : typeof value === 'boolean' ? 'boolean'
    : 'null'

  const setNodeType = (nextType: NullableFieldType): void => {
    if (nextType === nodeType) return
    const next = buildDefaultValue({
      type: nextType === 'null' ? 'string' : nextType,
      name: 'item',
      valueText: 'item',
      valueNumber: 0,
      valueBoolean: false,
      isNull: nextType === 'null',
    })
    handleUpdate(path, next)
  }

  const TypeSelect = (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
      <Select
        labelId={`type-${path.join('-')}`}
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

  if (nodeType !== 'object' && nodeType !== 'array') {
    const ValueInput =
      nodeType === 'string' ? (
        <TextField size="small" value={value ?? ''} variant="outlined" disabled={locked} onChange={(e) => handleUpdate(path, e.target.value)} sx={{ flex: 1 }} />
      ) : nodeType === 'number' ? (
        <NumberField value={value as number} onChange={(n) => { if (!locked) handleUpdate(path, n) }} />
      ) : nodeType === 'boolean' ? (
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel id={`bool-${path.join('-')}`}>Valor</InputLabel>
          <Select labelId={`bool-${path.join('-')}`} value={String(value)} label="Valor" disabled={locked} onChange={(e) => handleUpdate(path, e.target.value === 'true')}>
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </Select>
        </FormControl>
      ) : null

    return <>{TypeSelect}{ValueInput}</>
  }

  return <>{TypeSelect}</>
}

// ─── NodeEditor (root) ───────────────────────────────────────────────────────

export function NodeEditor({ locked }: { locked: boolean }): React.JSX.Element {
  const { jsonValue, handleUpdate } = useJsonStore()
  const { expanded, toggleExpand, expandPath, collapseAll, expandAll } = useUiStore()
  const value = jsonValue
  const path: Array<string | number> = []

  const nodeType: NullableFieldType =
    value === null ? 'null'
    : isArray(value) ? 'array'
    : isObject(value) ? 'object'
    : typeof value === 'string' ? 'string'
    : typeof value === 'number' ? 'number'
    : typeof value === 'boolean' ? 'boolean'
    : 'null'

  const setNodeType = (nextType: NullableFieldType): void => {
    if (nextType === nodeType) return
    const next = buildDefaultValue({
      type: nextType === 'null' ? 'string' : nextType,
      name: 'item',
      valueText: 'item',
      valueNumber: 0,
      valueBoolean: false,
      isNull: nextType === 'null',
    })
    handleUpdate(path, next)
  }

  const TypeSelect = (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <InputLabel id="type-root">Tipo</InputLabel>
      <Select labelId="type-root" value={nodeType} label="Tipo" disabled={locked} onChange={(e) => setNodeType(e.target.value as NullableFieldType)}>
        <MenuItem value="string">Texto</MenuItem>
        <MenuItem value="number">Número</MenuItem>
        <MenuItem value="boolean">Boolean</MenuItem>
        <MenuItem value="object">Objeto</MenuItem>
        <MenuItem value="array">Array</MenuItem>
        <MenuItem value="null">Nulo</MenuItem>
      </Select>
    </FormControl>
  )

  const renderChildren = (v: JsonValue, parentPath: Array<string | number>): React.ReactNode | null => {
    if (Array.isArray(v)) {
      if (v.length === 0) return null

      return <>
        {v.map((item, i) => (
          <ArrayItem key={i} index={i} item={item} parentPath={parentPath} arr={v} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={locked} />
        ))}
      </>
    }

    if (typeof v === 'object' && v !== null) {
      const entries = Object.entries(v as JsonObject)
      if (entries.length === 0) return null

      return <>
        {entries.map(([k, child]) => (
          <ObjectItem key={k} objKey={k} value={child} parentPath={parentPath} obj={v as JsonObject} expanded={expanded} toggleExpand={toggleExpand} expandPath={expandPath} renderChildren={renderChildren} locked={locked} />
        ))}
      </>
    }

    return null
  }

  if (nodeType !== 'object' && nodeType !== 'array') {
    const ValueInput =
      nodeType === 'string' ? (
        <TextField size="small" value={value ?? ''} variant="outlined" disabled={locked} onChange={(e) => handleUpdate(path, e.target.value)} sx={{ flex: 1 }} />
      ) : nodeType === 'number' ? (
        <NumberField value={value as number} onChange={(n) => { if (!locked) handleUpdate(path, n) }} />
      ) : nodeType === 'boolean' ? (
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel id="bool-root">Valor</InputLabel>
          <Select labelId="bool-root" value={String(value)} label="Valor" disabled={locked} onChange={(e) => handleUpdate(path, e.target.value === 'true')}>
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </Select>
        </FormControl>
      ) : null

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {TypeSelect}
        {ValueInput}
      </Box>
    )
  }

  const allComplexKeys = collectComplexKeys(value, path)
  const hasComplex = allComplexKeys.length > 0

  return (
    <Box>
      {hasComplex && (
        <Box sx={{ display: 'flex', mb: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" size="small" onClick={() => expandAll(allComplexKeys)}>
            Expandir todos
          </Button>
          <Button variant="outlined" size="small" onClick={() => collapseAll()}>
            Recolher todos
          </Button>
        </Box>
      )}
      {renderChildren(value, path)}
      <ContainerDropZone parentPath={path} parentKind={isArray(value) ? 'array' : 'object'} locked={locked} />
    </Box>
  )
}
