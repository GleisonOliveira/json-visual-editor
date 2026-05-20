import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Divider,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Grid,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Box,
} from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Trash2, GripVertical, ChevronDown, ChevronRight, Type, Hash, ToggleLeft, Braces, List, Ban, Pencil, X, CheckCheck, Sun, Moon } from 'lucide-react'
import { z } from 'zod'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { lightTheme, darkTheme, codeMirrorLightTheme, codeMirrorDarkTheme, codeMirrorLightSyntax, codeMirrorDarkSyntax } from './theme'

type JsonValue = any
type JsonObject = Record<string, any>
type JsonArray = any[]

type NodeKind = 'object' | 'array' | 'value'

type NodeTarget = {
  label: string
  path: Array<string | number>
  kind: NodeKind
}


type DndPayload = {
  fromPath: Array<string | number>
  fromKey?: string
} | {
  fromPalette: true
  paletteType: string
}

function isPalettePayload(p: DndPayload): p is { fromPalette: true; paletteType: string } {
  return 'fromPalette' in p && p.fromPalette === true
}

function getAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
  let cur = root
  for (const seg of path) cur = cur[seg]
  return cur
}

function removeAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
  if (path.length === 0) return root
  return setAtPath(root, path.slice(0, -1), (parent: any) => {
    const key = path[path.length - 1]
    if (Array.isArray(parent)) {
      const copy = [...parent]
      copy.splice(key as number, 1)
      return copy
    } else {
      const copy = { ...parent }
      delete copy[key as string]
      return copy
    }
  })
}

function insertAtPath(
  root: JsonValue,
  parentPath: Array<string | number>,
  key: string | number | null,
  value: JsonValue,
  originalKey?: string,
  insertAfter?: boolean
): JsonValue {
  return setAtPath(root, parentPath, (parent: any) => {
    if (Array.isArray(parent)) {
      const copy = [...parent]
      let idx = key === null ? copy.length : (key as number)
      if (insertAfter && key !== null) idx = (key as number) + 1
      copy.splice(idx, 0, value)
      return copy
    } else {
      const wantedKey: string = originalKey ?? `field${Object.keys(parent).length}`
      const finalKey = (wantedKey in parent)
        ? `${wantedKey}_${Object.keys(parent).length}`
        : wantedKey
      const entries = Object.entries(parent)
      if (key !== null) {
        const toIdx = entries.findIndex(([k]) => k === (key as string))
        if (toIdx < 0) return { ...parent, [finalKey]: value }
        entries.splice(insertAfter ? toIdx + 1 : toIdx, 0, [finalKey, value])
      } else {
        entries.push([finalKey, value])
      }
      return Object.fromEntries(entries)
    }
  })
}

// Returns true if candidateAncestor is an ancestor-or-equal of path
function isAncestorOrEqual(candidateAncestor: Array<string | number>, path: Array<string | number>): boolean {
  if (candidateAncestor.length > path.length) return false
  return candidateAncestor.every((seg, i) => seg === path[i])
}

function moveNode(
  root: JsonValue,
  payload: DndPayload,
  toParentPath: Array<string | number>,
  toKey: string | number | null
): JsonValue {
  if (isPalettePayload(payload)) return root
  const { fromPath, fromKey } = payload
  // Prevent dropping into own subtree
  if (isAncestorOrEqual(fromPath, toParentPath)) return root
  // Prevent dropping item onto itself (same parent + same key)
  const fromParentPath = fromPath.slice(0, -1)
  const fromSlot = fromPath[fromPath.length - 1]
  if (
    JSON.stringify(fromParentPath) === JSON.stringify(toParentPath) &&
    toKey === fromSlot
  ) return root
  const value = getAtPath(root, fromPath)
  const sameParent = JSON.stringify(fromParentPath) === JSON.stringify(toParentPath)
  // Determine if we're moving down (from above to below) within same parent
  const movingDown = sameParent && toKey !== null && (
    typeof toKey === 'number'
      ? (fromSlot as number) < (toKey as number)
      : Object.keys(getAtPath(root, toParentPath)).indexOf(fromSlot as string) <
        Object.keys(getAtPath(root, toParentPath)).indexOf(toKey as string)
  )
  // For arrays moving within same parent, toKey already accounts for pre-removal position;
  // after removing the item, target index shifts down by 1 when moving forward — but we use
  // insertAfter on the adjusted index instead.
  let adjustedKey = toKey
  if (sameParent && toKey !== null && typeof toKey === 'number' && movingDown) {
    adjustedKey = (toKey as number) - 1
  }
  const afterRemove = removeAtPath(root, fromPath)
  return insertAtPath(afterRemove, toParentPath, adjustedKey, value, fromKey, movingDown)
}

function insertFromPalette(
  root: JsonValue,
  paletteType: string,
  toParentPath: Array<string | number>,
  toKey: string | number | null
): JsonValue {
  const value = buildDefaultValue({ type: paletteType, name: 'newField', valueText: '', valueNumber: 0, valueBoolean: false, isNull: paletteType === 'null' })
  return insertAtPath(root, toParentPath, toKey, value, toKey === null ? 'newField' : undefined)
}

const isObject = (v: unknown): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isArray = (v: unknown): v is JsonArray => Array.isArray(v)

function setAtPath(
  root: JsonValue,
  path: Array<string | number>,
  updater: (node: any) => any
): JsonValue {
  const clone = structuredClone(root) as any
  if (path.length === 0) {
    return updater(clone)
  }
  let cur = clone
  for (let i = 0; i < path.length; i++) {
    const seg = path[i]
    if (i === path.length - 1) {
      cur[seg as any] = updater(cur[seg as any])
    } else {
      cur = cur[seg as any]
    }
  }
  return clone
}

function buildDefaultValue(opts: {
  type: string
  name: string
  valueText: string
  valueNumber: number
  valueBoolean: boolean
  isNull: boolean
}): JsonValue {
  if (opts.isNull) return null
  switch (opts.type) {
    case 'string':
      return opts.valueText ?? opts.name ?? 'item'
    case 'number':
      return Number.isFinite(opts.valueNumber) ? opts.valueNumber : 0
    case 'boolean':
      return opts.valueBoolean
    case 'object':
      return {}
    case 'array':
      return []
    default:
      return null
  }
}

function enumerateTargets(root: JsonValue): NodeTarget[] {
  const out: NodeTarget[] = []
  const walk = (value: JsonValue, path: Array<string | number>, label: string) => {
    const kind: NodeKind = isArray(value) ? 'array' : isObject(value) ? 'object' : 'value'
    if (kind !== 'value') out.push({ label, path: [...path], kind })
    if (isObject(value)) {
      for (const [k, v] of Object.entries(value)) walk(v, [...path, k], `${label}.${k}`)
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) walk(value[i], [...path, i], `${label}[${i}]`)
    }
  }
  walk(root, [], 'Início')
  return out
}

function applyInsert(
  root: JsonValue,
  target: NodeTarget,
  name: string,
  type: string,
  insertValue: {
    valueText: string
    valueNumber: number
    valueBoolean: boolean
    isNull: boolean
  }
): JsonValue {
  const cleanName = (name ?? '').trim()
  const valueToInsert = buildDefaultValue({
    type,
    name: cleanName,
    valueText: insertValue.valueText,
    valueNumber: insertValue.valueNumber,
    valueBoolean: insertValue.valueBoolean,
    isNull: insertValue.isNull,
  })

  if (target.kind === 'object') {
    return setAtPath(root, target.path, (obj: any) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        obj[cleanName || 'newField'] = valueToInsert
      }
      return obj
    })
  }

  if (target.kind === 'array') {
    return setAtPath(root, target.path, (arr: any) => {
      if (Array.isArray(arr)) arr.push(valueToInsert)
      return arr
    })
  }

  return root
}

function updatePrimitive(
  root: JsonValue,
  path: Array<string | number>,
  next: any
): JsonValue {
  return setAtPath(root, path, () => next)
}

function NumberField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value ?? 0))
  const prevValueRef = React.useRef(value)

  // Sync only when external value changes (e.g. type switch), not during typing
  if (prevValueRef.current !== value) {
    prevValueRef.current = value
    const cur = Number(text)
    const typing = text.endsWith('.') || text.endsWith('-')
    if (!typing && cur !== value) {
      setText(String(value ?? 0))
    }
  }

  return (
    <TextField
      size="small"
      value={text}
      variant="outlined"
      inputMode="decimal"
      sx={{ flex: 1 }}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => {
        const n = Number(e.target.value)
        if (Number.isFinite(n)) {
          onChange(n)
          setText(String(n))
        } else {
          onChange(0)
          setText('0')
        }
      }}
    />
  )
}

function useDndItem(path: Array<string | number>, fromKey?: string) {
  const [isOver, setIsOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const depth = React.useRef(0)

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

  const dropZoneProps = (onDrop: (payload: DndPayload) => void) => ({
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); depth.current++; setIsOver(true) },
    onDragLeave: (e: React.DragEvent) => { e.stopPropagation(); depth.current--; if (depth.current === 0) setIsOver(false) },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move' },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      depth.current = 0; setIsOver(false)
      const raw = e.dataTransfer.getData('application/jsonve-dnd')
      if (!raw) return
      onDrop(JSON.parse(raw) as DndPayload)
    },
  })

  return { isOver, isDragging, dragHandleProps, dropZoneProps }
}

function ContainerDropZone(props: {
  parentPath: Array<string | number>
  onMove: (payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  onInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
  parentKind: 'object' | 'array'
  locked?: boolean
}) {
  const { parentPath, onMove, onInsert, locked } = props
  const [isOver, setIsOver] = useState(false)
  const depth = React.useRef(0)
  return (
    <Box
      onDragEnter={(e) => { if (locked) return; e.preventDefault(); e.stopPropagation(); depth.current++; setIsOver(true) }}
      onDragLeave={(e) => { e.stopPropagation(); depth.current--; if (depth.current === 0) setIsOver(false) }}
      onDragOver={(e) => { if (locked) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={(e) => {
        if (locked) return
        e.preventDefault(); e.stopPropagation()
        depth.current = 0; setIsOver(false)
        const raw = e.dataTransfer.getData('application/jsonve-dnd')
        if (!raw) return
        const payload = JSON.parse(raw) as DndPayload
        if (isPalettePayload(payload)) { onInsert(payload.paletteType, parentPath, null); return }
        if (isAncestorOrEqual(payload.fromPath, parentPath)) return
        onMove(payload, parentPath, null)
      }}
      sx={{
        height: 36,
        borderRadius: 1,
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'border-color 0.1s, background-color 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="caption" color={isOver ? 'primary' : 'text.disabled'}>
        Arraste itens para cá
      </Typography>
    </Box>
  )
}

function ObjectItem(props: {
  objKey: string
  value: JsonValue
  parentPath: Array<string | number>
  obj: JsonObject
  onUpdate: (path: Array<string | number>, next: any) => void
  onMove: (payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  onInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
  collapsed: Set<string>
  toggleCollapse: (key: string) => void
  isComplexValue: (v: JsonValue) => boolean
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}) {
  const { objKey: k, value: v, parentPath, obj, onUpdate, onMove, onInsert, collapsed, toggleCollapse, isComplexValue, renderChildren, locked } = props
  const itemPath = [...parentPath, k]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath, k)
  const collapseKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { onInsert(payload.paletteType, parentPath, k); return }
        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        onMove(payload, parentPath, k)
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
            <IconButton size="small" color="error" disabled={locked} onClick={(e) => { e.stopPropagation(); const o = { ...obj }; delete o[k]; onUpdate(parentPath, o) }}>
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
            o[nextKey] = o[k]
            delete o[k]
            onUpdate(parentPath, o)
          }}
        />
        <NodeEditor value={v} path={itemPath} onUpdate={onUpdate} onMove={onMove} onInsert={onInsert} locked={locked} />
        {isComplexValue(v) && (
          <Tooltip title={collapsed.has(collapseKey) ? 'Expandir' : 'Recolher'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleCollapse(collapseKey) }} sx={{ ml: 'auto' }}>
              {collapsed.has(collapseKey) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(v) && !collapsed.has(collapseKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(v, itemPath)}
          <ContainerDropZone parentPath={itemPath} onMove={onMove} onInsert={onInsert} parentKind={isArray(v) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}

function ArrayItem(props: {
  index: number
  item: JsonValue
  parentPath: Array<string | number>
  arr: JsonArray
  onUpdate: (path: Array<string | number>, next: any) => void
  onMove: (payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  onInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
  collapsed: Set<string>
  toggleCollapse: (key: string) => void
  isComplexValue: (v: JsonValue) => boolean
  renderChildren: (v: JsonValue, path: Array<string | number>) => React.ReactNode
  locked: boolean
}) {
  const { index: i, item, parentPath, arr, onUpdate, onMove, onInsert, collapsed, toggleCollapse, isComplexValue, renderChildren, locked } = props
  const itemPath = [...parentPath, i]
  const { isOver, isDragging, dragHandleProps, dropZoneProps } = useDndItem(itemPath)
  const collapseKey = JSON.stringify(itemPath)

  return (
    <Box
      {...(!locked ? dropZoneProps((payload) => {
        if (isPalettePayload(payload)) { onInsert(payload.paletteType, parentPath, i); return }
        if (isAncestorOrEqual(payload.fromPath, itemPath)) return
        onMove(payload, parentPath, i)
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
            <IconButton size="small" color="error" disabled={locked} onClick={(e) => { e.stopPropagation(); const a = [...arr]; a.splice(i, 1); onUpdate(parentPath, a) }}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" sx={{ minWidth: 28, fontFamily: 'monospace' }}>[{i}]</Typography>
        <NodeEditor value={item} path={itemPath} onUpdate={onUpdate} onMove={onMove} onInsert={onInsert} locked={locked} />
        {isComplexValue(item) && (
          <Tooltip title={collapsed.has(collapseKey) ? 'Expandir' : 'Recolher'} arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleCollapse(collapseKey) }} sx={{ ml: 'auto' }}>
              {collapsed.has(collapseKey) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isComplexValue(item) && !collapsed.has(collapseKey) && (
        <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5, py: 1 }}>
          {renderChildren(item, itemPath)}
          <ContainerDropZone parentPath={itemPath} onMove={onMove} onInsert={onInsert} parentKind={isArray(item) ? 'array' : 'object'} locked={locked} />
        </Box>
      )}
    </Box>
  )
}

function NodeEditor(props: {
  value: JsonValue
  path: Array<string | number>
  onUpdate: (path: Array<string | number>, next: any) => void
  onMove: (payload: DndPayload, toParentPath: Array<string | number>, toKey: string | number | null) => void
  onInsert: (paletteType: string, toParentPath: Array<string | number>, toKey: string | number | null) => void
  locked: boolean
}) {
  const { value, path, onUpdate, onMove, onInsert, locked } = props
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleCollapse = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const nodeType: 'null' | 'object' | 'array' | 'string' | 'number' | 'boolean' =
    value === null
      ? 'null'
      : isArray(value)
        ? 'array'
        : isObject(value)
          ? 'object'
          : typeof value === 'string'
            ? 'string'
            : typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
                ? 'boolean'
                : 'null'

  const isRoot = path.length === 0

  const setNodeType = (nextType: typeof nodeType) => {
    if (nextType === nodeType) return
    const next = buildDefaultValue({
      type: nextType === 'null' ? 'string' : nextType,
      name: 'item',
      valueText: 'item',
      valueNumber: 0,
      valueBoolean: false,
      isNull: nextType === 'null',
    })
    onUpdate(path, next)
  }

  const TypeSelect = (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
      <Select
        labelId={`type-${path.join('-')}`}
        value={nodeType}
        label="Tipo"
        disabled={locked}
        onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
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

  const ValueInput =
    nodeType === 'string' ? (
      <TextField
        size="small"
        value={value ?? ''}
        variant="outlined"
        disabled={locked}
        onChange={(e) => onUpdate(path, e.target.value)}
        sx={{ flex: 1 }}
      />
    ) : nodeType === 'number' ? (
      <NumberField value={value as number} onChange={(n) => { if (!locked) onUpdate(path, n) }} />
    ) : nodeType === 'boolean' ? (
      <FormControl size="small" sx={{ minWidth: 90 }}>
        <InputLabel id={`bool-${path.join('-')}`}>Valor</InputLabel>
        <Select
          labelId={`bool-${path.join('-')}`}
          value={String(value)}
          label="Valor"
          disabled={locked}
          onChange={(e) => onUpdate(path, e.target.value === 'true')}
        >
          <MenuItem value="true">true</MenuItem>
          <MenuItem value="false">false</MenuItem>
        </Select>
      </FormControl>
    ) : null

  const isComplexValue = (v: JsonValue) =>
    Array.isArray(v) || (typeof v === 'object' && v !== null)

  const renderChildren = (v: JsonValue, parentPath: Array<string | number>): React.ReactNode => {
    if (Array.isArray(v)) {
      if (v.length === 0) return null
      return <>
        {v.map((item, i) => (
          <ArrayItem
            key={i}
            index={i}
            item={item}
            parentPath={parentPath}
            arr={v}
            onUpdate={onUpdate}
            onMove={onMove}
            onInsert={onInsert}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            isComplexValue={isComplexValue}
            renderChildren={renderChildren}
            locked={locked}
          />
        ))}
      </>
    }
    if (typeof v === 'object' && v !== null) {
      const entries = Object.entries(v as JsonObject)
      if (entries.length === 0) return null
      return <>
        {entries.map(([k, child]) => (
          <ObjectItem
            key={k}
            objKey={k}
            value={child}
            parentPath={parentPath}
            obj={v as JsonObject}
            onUpdate={onUpdate}
            onMove={onMove}
            onInsert={onInsert}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            isComplexValue={isComplexValue}
            renderChildren={renderChildren}
            locked={locked}
          />
        ))}
      </>
    }
    return null
  }

  const collectComplexKeys = (v: JsonValue, parentPath: Array<string | number>): string[] => {
    const keys: string[] = []
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (isComplexValue(item)) {
          const key = JSON.stringify([...parentPath, i])
          keys.push(key)
          keys.push(...collectComplexKeys(item, [...parentPath, i]))
        }
      })
    } else if (typeof v === 'object' && v !== null) {
      Object.entries(v as JsonObject).forEach(([k, child]) => {
        if (isComplexValue(child)) {
          const key = JSON.stringify([...parentPath, k])
          keys.push(key)
          keys.push(...collectComplexKeys(child, [...parentPath, k]))
        }
      })
    }
    return keys
  }

  // Nó raiz: renderiza apenas os filhos
  if (isRoot) {
    if (nodeType !== 'object' && nodeType !== 'array') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {TypeSelect}
          {ValueInput}
        </Box>
      )
    }
    const hasComplex = collectComplexKeys(value, path).length > 0
    return (
      <Box >
        {hasComplex && (
          <Box sx={{ display: 'flex', mb: 1.5, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCollapsed(new Set())}
            >
              Expandir todos
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCollapsed(new Set(collectComplexKeys(value, path)))}
            >
              Recolher todos
            </Button>
          </Box>
        )}
        {renderChildren(value, path)}
        <ContainerDropZone parentPath={path} onMove={onMove} onInsert={onInsert} parentKind={isArray(value) ? 'array' : 'object'} locked={locked} />
      </Box>
    )
  }

  // Nó folha (primitivo/null): exibe apenas tipo + valor inline (sem drag/delete — esses ficam no pai)
  if (nodeType !== 'object' && nodeType !== 'array') {
    return (
      <>
        {TypeSelect}
        {ValueInput}
      </>
    )
  }

  // Nó complexo (object/array) não-raiz: exibe apenas o seletor de tipo inline (filhos renderizados pelo pai)
  return <>{TypeSelect}</>
}

function useColorMode() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('color-mode')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const toggle = () =>
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('color-mode', next)
      return next
    })

  return { mode, toggle }
}

export default function App() {
  const { mode, toggle } = useColorMode()
  const muiTheme = mode === 'dark' ? darkTheme : lightTheme
  const cmTheme = mode === 'dark' ? codeMirrorDarkTheme : codeMirrorLightTheme
  const cmSyntax = mode === 'dark' ? codeMirrorDarkSyntax : codeMirrorLightSyntax

  const [jsonValue, setJsonValue] = useState<JsonValue>(() => ({}))

  const [fieldName, setFieldName] = useState('newField')
  const [fieldType, setFieldType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array'>(
    'string'
  )
  const [targetLabel, setTargetLabel] = useState<string>('Início')
  const [nameError, setNameError] = useState<string | null>(null)
  const [valueError, setValueError] = useState<string | null>(null)

  const [valueText, setValueText] = useState('item')
  const [valueNumberText, setValueNumberText] = useState('0')
  const [valueBoolean, setValueBoolean] = useState(false)
  const [valueIsNull, setValueIsNull] = useState(false)

  const valueNumber = useMemo(() => {
    const n = Number(valueNumberText)
    return Number.isFinite(n) ? n : 0
  }, [valueNumberText])

  const [editingJson, setEditingJson] = useState(false)
  const [editingText, setEditingText] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const parsed = useMemo(() => jsonValue, [jsonValue])

  const targets = useMemo(() => {
    // Always show root even if empty object.
    const baseRoot = jsonValue ?? {}
    return enumerateTargets(baseRoot)
  }, [jsonValue])

  const selectedTarget = useMemo(() => {
    return targets.find((t) => t.label === targetLabel) ?? targets[0]
  }, [targets, targetLabel])

  useEffect(() => {
    if (!targets.find((t) => t.label === targetLabel)) {
      setTargetLabel(targets[0]?.label ?? 'Início')
    }
  }, [targets])

  // If the parent is an array, the "Nome do campo" is not used.
  // Clear it so the UI reflects that it's inactive.
  useEffect(() => {
    if (selectedTarget?.kind === 'array') setFieldName('')
  }, [selectedTarget?.kind])

  const onAdd = () => {
    if (!selectedTarget) return
    setNameError(null)
    setValueError(null)
    const parentIsArray = selectedTarget.kind === 'array'
    const schema = z
      .object({
        name: parentIsArray
          ? z.string().trim().optional()
          : z.string().trim().min(1, 'Informe um nome.'),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        isNull: z.boolean(),
        valueText: z.string(),
        valueNumberText: z.string(),
        valueBoolean: z.boolean(),
      })
      .superRefine((data, ctx) => {
        if (data.isNull) return
        if (data.type === 'string') {
          if (data.valueText.trim().length === 0)
            ctx.addIssue({ code: 'custom', message: 'Informe um valor.' })
        }
        if (data.type === 'number') {
          const n = Number(data.valueNumberText)
          if (!Number.isFinite(n)) ctx.addIssue({ code: 'custom', message: 'Informe um número válido.' })
        }
        // boolean: no additional validation
      })

    const result = schema.safeParse({
      name: fieldName,
      type: fieldType,
      isNull: valueIsNull,
      valueText,
      valueNumberText: valueNumberText,
      valueBoolean,
    })

    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Dados inválidos.'
      if (msg === 'Informe um nome.') setNameError(msg)
      else setValueError(msg)
      return
    }

    setNameError(null)
    setValueError(null)
    setJsonValue((prev: JsonValue) =>
      applyInsert(prev, selectedTarget, result.data.name ?? '', result.data.type, {
        valueText,
        valueNumber,
        valueBoolean,
        isNull: valueIsNull,
      })
    )
  }

  return (
    <ThemeProvider theme={muiTheme}>
    <CssBaseline />
    <Box component="main" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box
        className="topbar"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          background: 'linear-gradient(135deg, #6a00f4 0%, #aa3bff 60%, #c084fc 100%)',
          boxShadow: '0 4px 20px rgba(170,59,255,0.35)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center'  }}>
          <Braces size={28} color="#fff" />
          <Typography
            component="h1"
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              lineHeight: 1,
              m: 0,
            }}
          >
            JSON Visual Editor
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'} arrow>
            <IconButton
              onClick={toggle}
              sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}
            >
              {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Ver no GitHub" arrow>
            <IconButton
              component="a"
              href="https://github.com/GleisonOliveira/json-visual-editor"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ alignItems: 'stretch', p: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Modelo (visual)" subheader="Edição total + formulário" />
            <CardContent>
              <Grid container sx={{ flexDirection: 'column' }}>
                <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Typography variant="subtitle2">
                    Adicionar dados ao JSON
                  </Typography>

                    <Grid container spacing={1.25}>
                      <Grid size={{ xs: 12, md: 'grow' }}>
                        <FormControl size="small" fullWidth>
                        <InputLabel id="target-label">Inserir em</InputLabel>
                        <Select
                          labelId="target-label"
                          value={selectedTarget?.label ?? 'Início'}
                          label="Inserir em"
                          onChange={(e) => setTargetLabel(e.target.value)}
                          disabled={targets.length === 0}
                          sx={{
                            '& .MuiSelect-select': { textAlign: 'left' },
                          }}
                        >
                          {targets.map((t) => (
                            <MenuItem key={t.label} value={t.label}>
                              {t.label} ({t.kind})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 'grow' }}>
                        <FormControl size="small" fullWidth>
                        <InputLabel id="fieldType-label">Tipo</InputLabel>
                        <Select
                          labelId="fieldType-label"
                          value={fieldType}
                          label="Tipo"
                          disabled={valueIsNull}
                          onChange={(e) => {
                            const nextType = e.target.value as typeof fieldType
                            setFieldType(nextType)
                            setValueIsNull(false)
                            // Reset the "Valor" inputs when switching type so they reflect the selected kind.
                            if (nextType === 'string') setValueText('item')
                            if (nextType === 'boolean') setValueBoolean(false)
                            if (nextType === 'string') setValueIsNull(false)
                            if (nextType === 'number') setValueNumberText('0')
                            if (nextType === 'object' || nextType === 'array') {
                              // No value inputs for object/array; keep stale values from affecting later adds.
                              setValueText('item')
                              setValueNumberText('0')
                              setValueBoolean(false)
                            }
                          }}
                          sx={{
                            '& .MuiSelect-select': { textAlign: 'left' },
                          }}
                        >
                          <MenuItem value="string">Texto</MenuItem>
                          <MenuItem value="number">Número</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                          <MenuItem value="object">Objeto</MenuItem>
                          <MenuItem value="array">Array</MenuItem>
                        </Select>
                      </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 'grow' }}>
                        <TextField
                        label="Nome do campo"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="nome do campo"
                        variant="outlined"
                        size="small"
                        fullWidth
                        disabled={selectedTarget?.kind === 'array'}
                        helperText={selectedTarget?.kind === 'array' ? 'Pai é um array' : (nameError ?? ' ')}
                        error={!!nameError}
                      />
                      </Grid>

                      {fieldType === 'string' ? (
                        <Grid size={{ xs: 12, md: 'grow' }}>
                          <TextField
                          label="Valor"
                          value={valueText}
                          onChange={(e) => setValueText(e.target.value)}
                          size="small"
                          variant="outlined"
                          fullWidth
                          disabled={valueIsNull}
                          error={!!valueError}
                          helperText={valueError ?? ' '}
                        />
                        </Grid>
                      ) : null}

                      {fieldType === 'number' ? (
                        <Grid size={{ xs: 12, md: 'grow' }}>
                          <TextField
                          label="Valor"
                          value={valueNumberText}
                          onChange={(e) => setValueNumberText(e.target.value)}
                          size="small"
                          variant="outlined"
                          fullWidth
                          disabled={valueIsNull}
                          inputMode="decimal"
                          error={!!valueError}
                          helperText={valueError ?? ' '}
                        />
                        </Grid>
                      ) : null}

                      {fieldType === 'boolean' ? (
                        <Grid size={{ xs: 12, md: 'grow' }}>
                          <FormControl size="small" fullWidth disabled={valueIsNull}>
                          <InputLabel id="bool-label">Valor</InputLabel>
                          <Select
                            labelId="bool-label"
                            value={String(valueBoolean)}
                            label="Valor"
                            onChange={(e) => setValueBoolean(e.target.value === 'true')}
                            sx={{
                              '& .MuiSelect-select': { textAlign: 'left' },
                            }}
                          >
                            <MenuItem value="true">true</MenuItem>
                            <MenuItem value="false">false</MenuItem>
                          </Select>
                        </FormControl>
                        </Grid>
                      ) : null}

                      <Grid size={{ xs: 12, md: 'grow' }}>
                        <Grid>
                          <Switch
                            checked={valueIsNull}
                            onChange={(e) => setValueIsNull(e.target.checked)}
                            disabled={false}
                          />
                                                    <Typography component="span" variant="body2">
                            Nulo
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid container spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
                      <Grid size={{ xs: 12, md: 'auto' }}>
                        <Button variant="outlined" onClick={onAdd} disabled={!selectedTarget || editingJson}>
                          Adicionar
                        </Button>
                      </Grid>
                    </Grid>

                    <Divider sx={{ mt: 3 }} />

                </Grid>

                <Grid size={12} sx={{ display: { xs: 'none', md: 'block' }, pt: { md: '0 !important' } }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1.5 }}>
                    {([
                      { type: 'string', icon: <Type size={14} /> },
                      { type: 'number', icon: <Hash size={14} /> },
                      { type: 'boolean', icon: <ToggleLeft size={14} /> },
                      { type: 'object', icon: <Braces size={14} /> },
                      { type: 'array', icon: <List size={14} /> },
                      { type: 'null', icon: <Ban size={14} /> },
                    ]).map(({ type, icon }) => (
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
                  <NodeEditor
                    value={parsed}
                    path={[]}
                    locked={editingJson}
                    onUpdate={(p, next) =>
                      setJsonValue((prev: JsonValue) => updatePrimitive(prev, p, next))
                    }
                    onMove={(payload, toParentPath, toKey) =>
                      setJsonValue((prev: JsonValue) => moveNode(prev, payload, toParentPath, toKey))
                    }
                    onInsert={(paletteType, toParentPath, toKey) =>
                      setJsonValue((prev: JsonValue) => insertFromPalette(prev, paletteType, toParentPath, toKey))
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="JSON Final"
              subheader={editingJson ? 'Modo edição manual — valide ou cancele para continuar' : 'Somente leitura'}
            />
            <CardContent>
              {editingJson ? (
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, justifyContent: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<X size={14} />}
                    onClick={() => {
                      setEditingJson(false)
                      setEditError(null)
                      setEditingText('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCheck size={14} />}
                    onClick={() => {
                      try {
                        const parsed2 = JSON.parse(editingText)
                        setJsonValue(parsed2)
                        setEditingJson(false)
                        setEditError(null)
                        setEditingText('')
                        setToast({ msg: 'JSON válido aplicado com sucesso.', severity: 'success' })
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : 'JSON inválido.'
                        setEditError(msg)
                        setToast({ msg: `JSON inválido: ${msg}`, severity: 'error' })
                      }
                    }}
                  >
                    Validar
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mb: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Pencil size={14} />}
                    onClick={() => {
                      setEditingText(JSON.stringify(parsed, null, 2))
                      setEditingJson(true)
                      setEditError(null)
                    }}
                  >
                    Editar JSON
                  </Button>
                </Box>
              )}
              {editingJson ? (
                <Box>
                  <CodeMirror
                    value={editingText}
                    theme="none"
                    extensions={[json(), cmTheme, cmSyntax]}
                    onChange={(val) => { setEditingText(val); setEditError(null) }}
                    style={{
                      fontSize: 14,
                      textAlign: 'left',
                      border: editError ? '2px solid #d32f2f' : '1px solid rgba(0,0,0,0.23)',
                      borderRadius: 4,
                      minHeight: 300,
                    }}
                  />
                  {editError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {editError}
                    </Typography>
                  )}
                </Box>
              ) : (
                <CodeMirror
                  value={JSON.stringify(parsed, null, 2)}
                  theme="none"
                  extensions={[json(), cmTheme, cmSyntax]}
                  editable={false}
                  style={{
                    fontSize: 14,
                    textAlign: 'left',
                    border: '1px solid rgba(0,0,0,0.23)',
                    borderRadius: 4,
                    minHeight: 300,
                  }}
                />
              )}
            </CardContent>

          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'info'} onClose={() => setToast(null)} variant="filled">
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
    </ThemeProvider>
  )
}
