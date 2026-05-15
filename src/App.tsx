import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Trash2 } from 'lucide-react'
import { GripVertical } from 'lucide-react'
import { z } from 'zod'

type JsonValue = any
type JsonObject = Record<string, any>
type JsonArray = any[]

type NodeKind = 'object' | 'array' | 'value'

type NodeTarget = {
  label: string
  path: Array<string | number>
  kind: NodeKind
}

function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const copy = arr.slice()
  const [item] = copy.splice(fromIndex, 1)
  // After removal, indices shift left when moving forward.
  const adjustedTo = fromIndex < toIndex ? toIndex - 1 : toIndex
  copy.splice(adjustedTo, 0, item)
  return copy
}

function moveObjectKey<T extends Record<string, any>>(
  obj: T,
  fromKey: string,
  toKey: string
): T {
  if (fromKey === toKey) return obj
  const entries = Object.entries(obj)
  const fromIdx = entries.findIndex(([k]) => k === fromKey)
  const toIdx = entries.findIndex(([k]) => k === toKey)
  if (fromIdx < 0 || toIdx < 0) return obj
  const [moved] = entries.splice(fromIdx, 1)
  entries.splice(toIdx, 0, moved)
  // JS preserves insertion order for string keys.
  return Object.fromEntries(entries) as T
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

  const rootLabel = 'Início'
  if (isObject(root) || isArray(root)) {
    out.push({ label: rootLabel, path: [], kind: isArray(root) ? 'array' : 'object' })
  }
  walk(root, [], rootLabel)

  const seen = new Set<string>()
  return out.filter((t) => {
    if (seen.has(t.label)) return false
    seen.add(t.label)
    return true
  })
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

function NodeEditor(props: {
  value: JsonValue
  path: Array<string | number>
  onUpdate: (path: Array<string | number>, next: any) => void
  hideNodeLabel?: boolean
  inlineHeaderOnly?: boolean
  mode?: 'all' | 'typeValue' | 'childrenOnly'
}) {
  const { value, path, onUpdate, hideNodeLabel, inlineHeaderOnly, mode = 'all' } = props
  const [dropHover, setDropHover] = useState<null | { kind: 'object'; key: string } | { kind: 'array'; index: number }>(
    null
  )
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({})

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
  const isCompactRow = !!hideNodeLabel && !isRoot
  const onlyChildren = mode === 'childrenOnly'
  const pathKey = JSON.stringify(path)
  const isCollapsed = collapsedNodes[pathKey] ?? false

  const setNodeType = (nextType: typeof nodeType) => {
    if (nextType === nodeType) return
    const next = buildDefaultValue({
      // When "null", buildDefaultValue uses `isNull` to force null.
      type: nextType === 'null' ? 'string' : nextType,
      name: 'item',
      valueText: 'item',
      valueNumber: 0,
      valueBoolean: false,
      isNull: nextType === 'null',
    })
    onUpdate(path, next)
  }

  const toggleCollapse = () => {
    setCollapsedNodes((cur) => ({
      ...cur,
      [pathKey]: !cur[pathKey],
    }))
  }

  // Compact mode (used inside object properties list): keep a single-row layout
  // regardless of the selected type, to avoid vertical shifting.
  if (inlineHeaderOnly && mode === 'all' && isCompactRow && ['string', 'number', 'boolean', 'null'].includes(nodeType)) {
    const isNullActive = nodeType === 'null'
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
          <Select
            labelId={`type-${path.join('-')}`}
            value={nodeType}
            label="Tipo"
            onChange={(e) => {
              const nextType = e.target.value as typeof nodeType
              setNodeType(nextType)
            }}
            sx={{ textAlign: 'left', minWidth: 120 }}
          >
            <MenuItem value="object">Objeto</MenuItem>
            <MenuItem value="array">Array</MenuItem>
            <MenuItem value="string">Texto</MenuItem>
            <MenuItem value="number">Número</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="null">Nulo</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ width: 220, maxWidth: '100%', ml: -0.5 }}>
          {nodeType === 'string' ? (
            <TextField
              size="small"
              value={value ?? ''}
              variant="outlined"
              onChange={(e) => onUpdate(path, e.target.value)}
              disabled={isNullActive}
              sx={{ width: '100%', minWidth: 120 }}
            />
          ) : nodeType === 'number' ? (
            <TextField
              size="small"
              value={String(value ?? 0)}
              variant="outlined"
              inputMode="decimal"
              onChange={(e) => {
                const n = Number(e.target.value)
                onUpdate(path, Number.isFinite(n) ? n : 0)
              }}
              disabled={isNullActive}
              sx={{ width: '100%', minWidth: 120 }}
            />
          ) : nodeType === 'boolean' ? (
            <FormControl size="small" fullWidth disabled={isNullActive} sx={{ minWidth: 120 }}>
              <InputLabel id={`bool-${path.join('-')}`}>Valor</InputLabel>
              <Select
                labelId={`bool-${path.join('-')}`}
                value={String(value)}
                label="Valor"
                onChange={(e) => onUpdate(path, e.target.value === 'true')}
                sx={{ textAlign: 'left', minWidth: 120 }}
              >
                <MenuItem value="true">true</MenuItem>
                <MenuItem value="false">false</MenuItem>
              </Select>
            </FormControl>
          ) : (
            // When "Nulo" is selected, keep height stable.
            <Box sx={{ height: 40 }} />
          )}
        </Box>
      </Box>
    )
  }

  // Tipo + valor somente (sem filhos): usado para alinhar na linha do nome/index.
  if (mode === 'typeValue') {
    if (nodeType === 'object' || nodeType === 'array') {
      // Mostra seletor de tipo e garante uma "linha 2" vazia no layout externo.
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
            <Select
              labelId={`type-${path.join('-')}`}
              value={nodeType}
              label="Tipo"
              onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
              sx={{ textAlign: 'left', minWidth: 120 }}
            >
              <MenuItem value="object">Objeto</MenuItem>
              <MenuItem value="array">Array</MenuItem>
              <MenuItem value="string">Texto</MenuItem>
              <MenuItem value="number">Número</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
              <MenuItem value="null">Nulo</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ width: 10 }} />
        </Box>
      )
    }

    // Para primitivos, reutiliza o layout compacto do seletor + input.
    // (mantém o mesmo comportamento de valor/nulo)
    const isNullActive = nodeType === 'null'
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
          <Select
            labelId={`type-${path.join('-')}`}
            value={nodeType}
            label="Tipo"
            onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
            sx={{ textAlign: 'left', minWidth: 120 }}
          >
            <MenuItem value="string">Texto</MenuItem>
            <MenuItem value="number">Número</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="object">Objeto</MenuItem>
            <MenuItem value="array">Array</MenuItem>
            <MenuItem value="null">Nulo</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ width: 220, maxWidth: '100%', ml: -0.5 }}>
          {nodeType === 'string' ? (
            <TextField
              size="small"
              value={value ?? ''}
              variant="outlined"
              onChange={(e) => onUpdate(path, e.target.value)}
              disabled={isNullActive}
              sx={{ width: '100%', minWidth: 120 }}
            />
          ) : nodeType === 'number' ? (
            <TextField
              size="small"
              value={String(value ?? 0)}
              variant="outlined"
              inputMode="decimal"
              onChange={(e) => {
                const n = Number(e.target.value)
                onUpdate(path, Number.isFinite(n) ? n : 0)
              }}
              disabled={isNullActive}
              sx={{ width: '100%', minWidth: 120 }}
            />
          ) : nodeType === 'boolean' ? (
            <FormControl size="small" fullWidth disabled={isNullActive} sx={{ minWidth: 120 }}>
              <InputLabel id={`bool-${path.join('-')}`}>Valor</InputLabel>
              <Select
                labelId={`bool-${path.join('-')}`}
                value={String(value)}
                label="Valor"
                onChange={(e) => onUpdate(path, e.target.value === 'true')}
                sx={{ textAlign: 'left', minWidth: 120 }}
              >
                <MenuItem value="true">true</MenuItem>
                <MenuItem value="false">false</MenuItem>
              </Select>
            </FormControl>
          ) : (
            // Mantém altura estável quando "Nulo" estiver ativo.
            <Box sx={{ height: 40 }} />
          )}
        </Box>
      </Box>
    )
  }

  // Filhos apenas: não renderiza cabeçalho (tipo/valor), apenas as seções object/array abaixo.
  if (onlyChildren) {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!isCollapsed &&
          nodeType === 'object' &&
          Object.entries(value as JsonObject).length > 0 && (
            <Box sx={{ pl: 0.5, ml: -0.25, mt: 0.5, width: '100%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {Object.entries(value as JsonObject).map(([k, v]) => (
                <Box
                  key={k}
                  onDragEnter={() => setDropHover({ kind: 'object', key: k })}
                  onDragLeave={() => {
                    setDropHover((cur) => {
                      if (cur?.kind === 'object' && cur.key === k) return null
                      return cur
                    })
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const raw = e.dataTransfer.getData('application/jsonve-dnd')
                    if (!raw) return
                    const data = JSON.parse(raw) as {
                      containerId: string
                      kind: 'object' | 'array'
                      fromKey?: string
                      fromIndex?: number
                    }
                    if (data.containerId !== JSON.stringify(path)) return
                    if (data.kind !== 'object') return
                    if (!data.fromKey) return
                    onUpdate(path, moveObjectKey(value as JsonObject, data.fromKey, k))
                    setDropHover(null)
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '100%',
                    outline:
                      dropHover?.kind === 'object' && dropHover.key === k
                        ? '2px solid rgba(170,59,255,0.7)'
                        : 'none',
                    outlineOffset: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Box
                        draggable
                        onDragStart={(e) => {
                          const containerId = JSON.stringify(path)
                          e.dataTransfer.setData(
                            'application/jsonve-dnd',
                            JSON.stringify({
                              containerId,
                              kind: 'object',
                              fromKey: k,
                            })
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                      >
                        <GripVertical size={14} />
                      </Box>

                      <Tooltip title={`Deletar ${k}`} arrow>
                        <IconButton
                          size="small"
                          aria-label={`Remover ${k}`}
                          onClick={() => {
                            onUpdate(path, (() => {
                              const obj = { ...(value as JsonObject) }
                              delete obj[k]
                              return obj
                            })())
                          }}
                          color="error"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <TextField
                      size="small"
                      defaultValue={k}
                      variant="outlined"
                      sx={{ width: 160, flex: '0 0 auto', '& input': { fontFamily: 'var(--mono)' } }}
                      onBlur={(e) => {
                        const nextKey = e.target.value.trim()
                        if (!nextKey || nextKey === k) return
                        onUpdate(path, (() => {
                          const obj = { ...(value as JsonObject) }
                          obj[nextKey] = obj[k]
                          delete obj[k]
                          return obj
                        })())
                      }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 auto', minWidth: 0 }}>
                      <NodeEditor value={v} path={[...path, k]} onUpdate={onUpdate} hideNodeLabel={true} mode="typeValue" />
                    </Box>
                  </Box>
                  {Array.isArray(v) || (typeof v === 'object' && v !== null) ? (
                    <Box sx={{ p: 1, border: '1px dashed rgba(0,0,0,0.12)', borderRadius: 1 }}>
                      <NodeEditor value={v} path={[...path, k]} onUpdate={onUpdate} hideNodeLabel={true} mode="childrenOnly" />
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Box>
          )}

        {!isCollapsed && nodeType === 'array' && (value as JsonArray).length > 0 && (
          <Box sx={{ pl: 0.5, ml: -0.25, mt: 0.5, width: '100%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {(value as JsonArray).map((item, i) => (
              <Box
                key={i}
                onDragEnter={() => setDropHover({ kind: 'array', index: i })}
                onDragLeave={() => {
                  setDropHover((cur) => {
                    if (cur?.kind === 'array' && cur.index === i) return null
                    return cur
                  })
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const raw = e.dataTransfer.getData('application/jsonve-dnd')
                  if (!raw) return
                  const data = JSON.parse(raw) as {
                    containerId: string
                    kind: 'object' | 'array'
                    fromKey?: string
                    fromIndex?: number
                  }
                  if (data.containerId !== JSON.stringify(path)) return
                  if (data.kind !== 'array') return
                  if (typeof data.fromIndex !== 'number') return
                  onUpdate(path, moveArrayItem(value as JsonArray, data.fromIndex, i))
                  setDropHover(null)
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  width: '100%',
                  outline:
                    dropHover?.kind === 'array' && dropHover.index === i
                      ? '2px solid rgba(170,59,255,0.7)'
                      : 'none',
                  outlineOffset: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'nowrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                    <Box
                      draggable
                      onDragStart={(e) => {
                        const containerId = JSON.stringify(path)
                        e.dataTransfer.setData(
                          'application/jsonve-dnd',
                          JSON.stringify({
                            containerId,
                            kind: 'array',
                            fromIndex: i,
                          })
                        )
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                    >
                      <GripVertical size={14} />
                    </Box>

                    <Tooltip title={`Deletar [${i}]`} arrow>
                      <IconButton
                        size="small"
                        aria-label={`Remover [${i}]`}
                        onClick={() => {
                          onUpdate(path, (() => {
                            const arr = [...(value as JsonArray)]
                            arr.splice(i, 1)
                            return arr
                          })())
                        }}
                        color="error"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" sx={{ fontFamily: 'var(--mono)', width: 140, flex: '0 0 auto' }}>
                    {`[${i}]`}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 auto', minWidth: 0 }}>
                    <NodeEditor value={item} path={[...path, i]} onUpdate={onUpdate} hideNodeLabel={true} mode="typeValue" />
                  </Box>
                </Box>
                {Array.isArray(item) || (typeof item === 'object' && item !== null) ? (
                  <Box sx={{ p: 1, border: '1px dashed rgba(0,0,0,0.12)', borderRadius: 1 }}>
                    <NodeEditor value={item} path={[...path, i]} onUpdate={onUpdate} hideNodeLabel={true} mode="childrenOnly" />
                  </Box>
                ) : null}
              </Box>
            ))}
          </Box>
        )}

        {!(nodeType === 'object' && Object.entries(value as JsonObject).length > 0) &&
          !(nodeType === 'array' && (value as JsonArray).length > 0) && (
            <Typography variant="body2" sx={{ opacity: 0.6, pl: 0.5, pt: 0.5 }}>
              Sem subitens
            </Typography>
          )}
      </Box>
    )
  }

  // Quando em modo compacto (hideNodeLabel=true) e o nó tem filhos (object/array),
  // separe "Tipo" (linha 1) do bloco dos subitens (linha 2) para não ficarem no mesmo container.
  if (hideNodeLabel && !isRoot && (nodeType === 'object' || nodeType === 'array')) {
    const Header = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
        <FormControl size="small" fullWidth sx={{ minWidth: 170 }}>
          <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
          <Select
            labelId={`type-${path.join('-')}`}
            value={nodeType}
            label="Tipo"
            onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
          >
            <MenuItem value="object">Objeto</MenuItem>
            <MenuItem value="array">Array</MenuItem>
            <MenuItem value="string">Texto</MenuItem>
            <MenuItem value="number">Número</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="null">Nulo</MenuItem>
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          onClick={toggleCollapse}
          sx={{ minWidth: 34, width: 34, height: 32, px: 0, flex: '0 0 auto' }}
          aria-label={isCollapsed ? 'Expandir' : 'Recolher'}
        >
          {isCollapsed ? '+' : '-'}
        </Button>
      </Box>
    )

    const hasChildren =
      nodeType === 'object'
        ? Object.entries(value as JsonObject).length > 0
        : nodeType === 'array'
          ? (value as JsonArray).length > 0
          : false

    const Children = (
      <>
        {!isCollapsed &&
          nodeType === 'object' &&
          Object.entries(value as JsonObject).length > 0 && (
            <Box
              sx={{
                pl: 0.5,
                ml: -0.25,
                mt: 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              {Object.entries(value as JsonObject).map(([k, v]) => (
                <Box
                  key={k}
                  onDragEnter={() => {
                    setDropHover({ kind: 'object', key: k })
                  }}
                  onDragLeave={() => {
                    setDropHover((cur) => {
                      if (cur?.kind === 'object' && cur.key === k) return null
                      return cur
                    })
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const raw = e.dataTransfer.getData('application/jsonve-dnd')
                    if (!raw) return
                    const data = JSON.parse(raw) as {
                      containerId: string
                      kind: 'object' | 'array'
                      fromKey?: string
                      fromIndex?: number
                    }
                    if (data.containerId !== JSON.stringify(path)) return
                    if (data.kind !== 'object') return
                    if (!data.fromKey) return
                    onUpdate(path, moveObjectKey(value as JsonObject, data.fromKey, k))
                    setDropHover(null)
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 1,
                  py: 0.5,
                  width: '100%',
                  userSelect: 'none',
                  cursor: 'default',
                  outline:
                    dropHover?.kind === 'object' && dropHover.key === k
                      ? '2px solid rgba(170,59,255,0.7)'
                      : 'none',
                  outlineOffset: 1,
                }}
              >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Box
                        draggable
                        onDragStart={(e) => {
                          const containerId = JSON.stringify(path)
                          e.dataTransfer.setData(
                            'application/jsonve-dnd',
                            JSON.stringify({
                              containerId,
                              kind: 'object',
                              fromKey: k,
                            })
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                      >
                        <GripVertical size={14} />
                      </Box>

                      <IconButton
                        size="small"
                        aria-label={`Remover ${k}`}
                        onClick={() => {
                          onUpdate(path, (() => {
                            const obj = { ...(value as JsonObject) }
                            delete obj[k]
                            return obj
                          })())
                        }}
                        color="error"
                      >
                        <Tooltip title={`Deletar ${k}`} arrow>
                          <Trash2 size={16} />
                        </Tooltip>
                      </IconButton>
                    </Box>

                    <TextField
                      size="small"
                      defaultValue={k}
                      variant="outlined"
                      sx={{ width: 160, flex: '0 0 auto', '& input': { fontFamily: 'var(--mono)' } }}
                      onBlur={(e) => {
                        const nextKey = e.target.value.trim()
                        if (!nextKey || nextKey === k) return
                        onUpdate(path, (() => {
                          const obj = { ...(value as JsonObject) }
                          obj[nextKey] = obj[k]
                          delete obj[k]
                          return obj
                        })())
                      }}
                    />

                    <Box
                      sx={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        p: Array.isArray(v) || (typeof v === 'object' && v !== null) ? 1 : 0,
                        border:
                          Array.isArray(v) || (typeof v === 'object' && v !== null)
                            ? '1px dashed rgba(0,0,0,0.12)'
                            : 'none',
                        borderRadius:
                          Array.isArray(v) || (typeof v === 'object' && v !== null) ? 1 : undefined,
                      }}
                    >
                      <NodeEditor value={v} path={[...path, k]} onUpdate={onUpdate} hideNodeLabel={true} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

        {!isCollapsed && nodeType === 'array' && (value as JsonArray).length > 0 && (
          <Box sx={{ pl: 0.5, ml: -0.25, mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {(value as JsonArray).map((item, i) => (
              <Box
                key={i}
                onDragEnter={() => setDropHover({ kind: 'array', index: i })}
                onDragLeave={() => {
                  setDropHover((cur) => {
                    if (cur?.kind === 'array' && cur.index === i) return null
                    return cur
                  })
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const raw = e.dataTransfer.getData('application/jsonve-dnd')
                  if (!raw) return
                  const data = JSON.parse(raw) as {
                    containerId: string
                    kind: 'object' | 'array'
                    fromKey?: string
                    fromIndex?: number
                  }
                  if (data.containerId !== JSON.stringify(path)) return
                  if (data.kind !== 'array') return
                  if (typeof data.fromIndex !== 'number') return
                  onUpdate(path, moveArrayItem(value as JsonArray, data.fromIndex, i))
                  setDropHover(null)
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 1,
                  py: 0.5,
                  width: '100%',
                  userSelect: 'none',
                  cursor: 'grab',
                  outline:
                    dropHover?.kind === 'array' && dropHover.index === i
                      ? '2px solid rgba(170,59,255,0.7)'
                      : 'none',
                  outlineOffset: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'nowrap' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', flex: '0 0 auto' }}>
                    <Box
                      draggable
                      onDragStart={(e) => {
                        const containerId = JSON.stringify(path)
                        e.dataTransfer.setData(
                          'application/jsonve-dnd',
                          JSON.stringify({
                            containerId,
                            kind: 'array',
                            fromIndex: i,
                          })
                        )
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                    >
                      <GripVertical size={14} />
                    </Box>

                    <Tooltip title={`Deletar [${i}]`} arrow>
                      <IconButton
                        size="small"
                        aria-label={`Remover [${i}]`}
                        onClick={() => {
                          onUpdate(path, (() => {
                            const arr = [...(value as JsonArray)]
                            arr.splice(i, 1)
                            return arr
                          })())
                        }}
                        color="error"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" sx={{ fontFamily: 'var(--mono)', width: 140, flex: '0 0 auto' }}>
                    {`[${i}]`}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 auto', minWidth: 0 }}>
                    <NodeEditor
                      value={item}
                      path={[...path, i]}
                      onUpdate={onUpdate}
                      hideNodeLabel={true}
                      mode="typeValue"
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    p: Array.isArray(item) ? 1 : 0,
                    border: Array.isArray(item) ? '1px dashed rgba(0,0,0,0.12)' : 'none',
                    borderRadius: Array.isArray(item) ? 1 : undefined,
                  }}
                >
                  <NodeEditor value={item} path={[...path, i]} onUpdate={onUpdate} hideNodeLabel={true} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {!hasChildren && (
          <Typography variant="body2" sx={{ opacity: 0.6, pl: 0.5, pt: 0.5 }}>
            Sem subitens
          </Typography>
        )}
      </>
    )

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0, gap: 1 }}>
        {Header}
        {Children}
      </Box>
    )
  }

  return (
    <Box sx={{ mt: hideNodeLabel ? 0 : 1 }}>
      {!isRoot && !onlyChildren && (
        <>
          {isCompactRow && ['string', 'number', 'boolean', 'null'].includes(nodeType) ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
                <Select
                  labelId={`type-${path.join('-')}`}
                  value={nodeType}
                  label="Tipo"
                  onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
                >
                  <MenuItem value="object">object</MenuItem>
                  <MenuItem value="array">array</MenuItem>
                  <MenuItem value="string">string</MenuItem>
                  <MenuItem value="number">number</MenuItem>
                  <MenuItem value="boolean">boolean</MenuItem>
                  <MenuItem value="null">null</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* value editor will render below, but we keep this header row compact */}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: hideNodeLabel ? 'flex-start' : 'center',
                gap: 1,
                mb: hideNodeLabel ? 0 : ['string', 'number', 'boolean', 'null'].includes(nodeType) ? 0 : 0.75,
                height: hideNodeLabel ? 'auto' : undefined,
                minHeight: hideNodeLabel ? 40 : undefined,
                flexDirection: hideNodeLabel ? 'column' : 'row',
                width: hideNodeLabel ? 'fit-content' : 'auto',
              }}
            >
              {!hideNodeLabel ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    opacity: 0.7,
                    width: 72,
                    flex: '0 0 auto',
                  }}
                >
                  {String(path[path.length - 1])}
                </Typography>
              ) : null}

              <FormControl size="small" fullWidth>
                <InputLabel id={`type-${path.join('-')}`}>Tipo</InputLabel>
                <Select
                  labelId={`type-${path.join('-')}`}
                  value={nodeType === 'null' ? 'string' : nodeType}
                  label="Tipo"
                  onChange={(e) => setNodeType(e.target.value as typeof nodeType)}
                >
                  <MenuItem value="object">Objeto</MenuItem>
                  <MenuItem value="array">Array</MenuItem>
                  <MenuItem value="string">Texto</MenuItem>
                  <MenuItem value="number">Número</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                </Select>
              </FormControl>
              {nodeType === 'object' || nodeType === 'array' ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={toggleCollapse}
                  sx={{ minWidth: 34, width: 34, height: 32, px: 0, flex: '0 0 auto' }}
                  aria-label={isCollapsed ? 'Expandir' : 'Recolher'}
                >
                  {isCollapsed ? '+' : '-'}
                </Button>
              ) : null}
            </Box>
          )}
        </>
      )}

      {!isCollapsed && nodeType === 'object' &&
        Object.entries(value as JsonObject).length > 0 && (
          <Box
            sx={{
              pl: hideNodeLabel ? 0.5 : 1.5,
              ml: 0,
              mt: 0,
            }}
          >
            {Object.entries(value as JsonObject).map(([k, v]) => (
              <Box
                key={k}
                onDragEnter={() => {
                  setDropHover({ kind: 'object', key: k })
                }}
                onDragLeave={() => {
                  setDropHover((cur) => {
                    if (cur?.kind === 'object' && cur.key === k) return null
                    return cur
                  })
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const raw = e.dataTransfer.getData('application/jsonve-dnd')
                  if (!raw) return
                  const data = JSON.parse(raw) as {
                    containerId: string
                    kind: 'object' | 'array'
                    fromKey?: string
                    fromIndex?: number
                  }
                  if (data.containerId !== JSON.stringify(path)) return
                  if (data.kind !== 'object') return
                  if (!data.fromKey) return
                  onUpdate(path, moveObjectKey(value as JsonObject, data.fromKey, k))
                  setDropHover(null)
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  py: 0.5,
                  userSelect: 'none',
                  cursor: 'default',
                  outline:
                    dropHover?.kind === 'object' && dropHover.key === k
                      ? '2px solid rgba(170,59,255,0.7)'
                      : 'none',
                  outlineOffset: 1,
                }}
              >
                {/* Linha 1: nome + ações */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                    <Box
                      draggable
                      onDragStart={(e) => {
                        const containerId = JSON.stringify(path)
                        e.dataTransfer.setData(
                          'application/jsonve-dnd',
                          JSON.stringify({
                            containerId,
                            kind: 'object',
                            fromKey: k,
                          })
                        )
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                    >
                      <GripVertical size={14} />
                    </Box>

                    <IconButton
                      size="small"
                      aria-label={`Remover ${k}`}
                      onClick={() => {
                        onUpdate(path, (() => {
                          const obj = { ...(value as JsonObject) }
                          delete obj[k]
                          return obj
                        })())
                      }}
                      color="error"
                    >
                      <Tooltip title={`Deletar ${k}`} arrow>
                        <Trash2 size={16} />
                      </Tooltip>
                    </IconButton>
                  </Box>

                  <TextField
                    size="small"
                    defaultValue={k}
                    variant="outlined"
                    sx={{ width: 160, '& input': { fontFamily: 'var(--mono)' } }}
                    onBlur={(e) => {
                      const nextKey = e.target.value.trim()
                      if (!nextKey || nextKey === k) return
                      onUpdate(path, (() => {
                        const obj = { ...(value as JsonObject) }
                        obj[nextKey] = obj[k]
                        delete obj[k]
                        return obj
                      })())
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NodeEditor
                      value={v}
                      path={[...path, k]}
                      onUpdate={onUpdate}
                      hideNodeLabel={true}
                      mode="typeValue"
                    />
                  </Box>
                </Box>

                {/* Linha 2: só para nós com filhos (object/array) */}
                {Array.isArray(v) || (typeof v === 'object' && v !== null) ? (
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      p: 1,
                      border: '1px dashed rgba(0,0,0,0.12)',
                      borderRadius: 1,
                    }}
                  >
                    <NodeEditor
                      value={v}
                      path={[...path, k]}
                      onUpdate={onUpdate}
                      hideNodeLabel={true}
                      mode="childrenOnly"
                    />
                  </Box>
                ) : null}
              </Box>
            ))}
          </Box>
        )}

      {!isCollapsed && nodeType === 'array' &&
        (value as JsonArray).length > 0 && (
          <Box
            sx={{
              pl: hideNodeLabel ? 0.5 : 1.5,
              ml: 0,
              mt: 0,
            }}
          >
            {(value as JsonArray).map((item, i) => (
              <Box
                key={i}
                onDragEnter={() => {
                  setDropHover({ kind: 'array', index: i })
                }}
                onDragLeave={() => {
                  setDropHover((cur) => {
                    if (cur?.kind === 'array' && cur.index === i) return null
                    return cur
                  })
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const raw = e.dataTransfer.getData('application/jsonve-dnd')
                  if (!raw) return
                  const data = JSON.parse(raw) as {
                    containerId: string
                    kind: 'object' | 'array'
                    fromKey?: string
                    fromIndex?: number
                  }
                  if (data.containerId !== JSON.stringify(path)) return
                  if (data.kind !== 'array') return
                  if (typeof data.fromIndex !== 'number') return
                  onUpdate(path, moveArrayItem(value as JsonArray, data.fromIndex, i))
                  setDropHover(null)
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  py: 0.5,
                  userSelect: 'none',
                  cursor: 'grab',
                  outline:
                    dropHover?.kind === 'array' && dropHover.index === i
                      ? '2px solid rgba(170,59,255,0.7)'
                      : 'none',
                  outlineOffset: 1,
                }}
              >
                {/* Ações à esquerda (antes do índice) */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                  <Box
                    draggable
                    onDragStart={(e) => {
                      const containerId = JSON.stringify(path)
                      e.dataTransfer.setData(
                        'application/jsonve-dnd',
                        JSON.stringify({
                          containerId,
                          kind: 'array',
                          fromIndex: i,
                        })
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    sx={{ display: 'inline-flex', cursor: 'grab', color: 'rgba(0,0,0,0.35)' }}
                  >
                    <GripVertical size={14} />
                  </Box>

                  <Tooltip title={`Deletar [${i}]`} arrow>
                    <IconButton
                      size="small"
                      aria-label={`Remover [${i}]`}
                      onClick={() => {
                        onUpdate(path, (() => {
                          const arr = [...(value as JsonArray)]
                          arr.splice(i, 1)
                          return arr
                        })())
                      }}
                      color="error"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography variant="body2" sx={{ fontFamily: 'var(--mono)', width: 140 }}>
                  {`[${i}]`}
                </Typography>

                  {/* Tipo + value na mesma linha do índice */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NodeEditor
                      value={item}
                      path={[...path, i]}
                      onUpdate={onUpdate}
                      hideNodeLabel={true}
                      mode="typeValue"
                    />
                  </Box>

                {/* Linha 2: só para nós com filhos (object/array) */}
                {Array.isArray(item) || (typeof item === 'object' && item !== null) ? (
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      p: 1,
                      border: '1px dashed rgba(0,0,0,0.12)',
                      borderRadius: 1,
                    }}
                  >
                    <NodeEditor
                      value={item}
                      path={[...path, i]}
                      onUpdate={onUpdate}
                      hideNodeLabel={true}
                      mode="childrenOnly"
                    />
                  </Box>
                ) : null}
              </Box>
            ))}
          </Box>
        )}

      {nodeType === 'string' && (
        <Box sx={{ display: isCompactRow ? 'flex' : 'block', alignItems: 'center', gap: 1, mt: 0 }}>
          <TextField
            size="small"
            value={value ?? ''}
            variant="outlined"
            onChange={(e) => onUpdate(path, e.target.value)}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Box>
      )}

      {nodeType === 'number' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0 }}>
          <TextField
            size="small"
            value={String(value ?? 0)}
            variant="outlined"
            inputMode="decimal"
            onChange={(e) => {
              const n = Number(e.target.value)
              onUpdate(path, Number.isFinite(n) ? n : 0)
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Box>
      )}

      {nodeType === 'boolean' && (
        <Box sx={{ mt: 0 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id={`bool-${path.join('-')}`}>Valor</InputLabel>
            <Select
              labelId={`bool-${path.join('-')}`}
              value={String(value)}
              label="Valor"
              onChange={(e) => onUpdate(path, e.target.value === 'true')}
            >
              <MenuItem value="true">true</MenuItem>
              <MenuItem value="false">false</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {nodeType === 'null' && (
        <Box sx={{ mt: 0 }}>
          <TextField
            size="small"
            value="null"
            variant="outlined"
            fullWidth
            disabled
          />
        </Box>
      )}
    </Box>
  )
}

export default function App() {
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

  const parsed = useMemo(() => jsonValue, [jsonValue])

  const targets = useMemo(() => {
    // Always show root even if empty object.
    const baseRoot = jsonValue ?? {}
    return enumerateTargets(baseRoot)
  }, [jsonValue])

  const selectedTarget = useMemo(() => {
    return targets.find((t) => t.label === targetLabel) ?? targets[0]
  }, [targets, targetLabel])

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
    <>
      <Box className="topbar">
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.2,
                  py: 0.6,
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: 'rgba(192,132,252,0.5)',
                  background: 'rgba(170,59,255,0.1)',
                  color: 'rgba(170,59,255,1)',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                JSON Visual Editor
              </Box>
              <Typography component="h1" variant="h5">
                Adicionar dados
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: '100%',
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'stretch',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Card sx={{ flex: 1 }}>
            <CardHeader title="Modelo (visual)" subheader="Edição total + formulário" />
            <CardContent>
              <Box sx={{ p: 1.0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Adicionar dados ao JSON
                  </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                      <FormControl size="small" sx={{ flex: '2 1 260px' }}>
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

                      <FormControl size="small" sx={{ flex: '1 1 180px' }}>
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

                      <TextField
                        label="Nome do campo"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="nome do campo"
                        variant="outlined"
                        size="small"
                        sx={{ flex: '1 1 180px' }}
                        disabled={selectedTarget?.kind === 'array'}
                        helperText={selectedTarget?.kind === 'array' ? 'Pai é um array' : (nameError ?? ' ')}
                        error={!!nameError}
                      />

                      {fieldType === 'string' ? (
                        <TextField
                          label="Valor"
                          value={valueText}
                          onChange={(e) => setValueText(e.target.value)}
                          size="small"
                          variant="outlined"
                          disabled={valueIsNull}
                          sx={{ flex: '1 1 180px' }}
                          error={!!valueError}
                          helperText={valueError ?? ' '}
                        />
                      ) : null}

                      {fieldType === 'number' ? (
                        <TextField
                          label="Valor"
                          value={valueNumberText}
                          onChange={(e) => setValueNumberText(e.target.value)}
                          size="small"
                          variant="outlined"
                          disabled={valueIsNull}
                          inputMode="decimal"
                          sx={{ flex: '1 1 180px' }}
                          error={!!valueError}
                          helperText={valueError ?? ' '}
                        />
                      ) : null}

                      {fieldType === 'boolean' ? (
                        <FormControl
                          size="small"
                          sx={{ flex: '1 1 180px' }}
                          disabled={valueIsNull}
                        >
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
                      ) : null}

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: '1 1 180px',
                          height: 40,
                        }}
                      >
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ opacity: 0.9, whiteSpace: 'nowrap', lineHeight: 1 }}
                        >
                          Deixar como nulo
                        </Typography>
                        <Switch
                          checked={valueIsNull}
                          onChange={(e) => setValueIsNull(e.target.checked)}
                          disabled={false}
                        />
                      </Box>

                      <Button
                        variant="contained"
                        onClick={onAdd}
                        disabled={!selectedTarget}
                        sx={{ flex: '1 1 140px', height: 40 }}
                      >
                        Adicionar
                      </Button>

                      <Divider sx={{ width: '100%', mt: 0.5 }} />
                    </Box>

                </Box>

                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                  <NodeEditor
                    value={parsed}
                    path={[]}
                    onUpdate={(p, next) =>
                      setJsonValue((prev: JsonValue) => updatePrimitive(prev, p, next))
                    }
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardHeader title="JSON Final" subheader="Somente leitura" />
            <CardContent>
              <TextField
                value={JSON.stringify(parsed, null, 2)}
                multiline
                minRows={12}
                maxRows={30}
                fullWidth
                disabled
                sx={{
                  '& textarea': {
                    fontFamily: 'var(--mono)',
                    fontSize: 14,
                    lineHeight: 1.5,
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  )
}
