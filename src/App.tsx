import { useEffect, useMemo, useState } from 'react'
import {
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
  Switch,
  TextField,
  Tooltip,
  Typography,
  Box,
} from '@mui/material'
import { Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
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

  // Sincroniza quando o valor externo muda (ex: troca de tipo)
  const valueStr = String(value ?? 0)
  if (text !== valueStr && Number(text) !== value) {
    setText(valueStr)
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
        } else {
          setText(String(value ?? 0))
        }
      }}
    />
  )
}

function NodeEditor(props: {
  value: JsonValue
  path: Array<string | number>
  onUpdate: (path: Array<string | number>, next: any) => void
}) {
  const { value, path, onUpdate } = props
  const [, setDropHover] = useState<null | { kind: 'object'; key: string } | { kind: 'array'; index: number }>(null)
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
        onChange={(e) => onUpdate(path, e.target.value)}
        sx={{ flex: 1 }}
      />
    ) : nodeType === 'number' ? (
      <NumberField value={value as number} onChange={(n) => onUpdate(path, n)} />
    ) : nodeType === 'boolean' ? (
      <FormControl size="small" sx={{ minWidth: 90 }}>
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
    ) : nodeType === 'null' ? (
      <TextField size="small" value="null" variant="outlined" disabled sx={{ flex: 1 }} />
    ) : null

  const isComplexValue = (v: JsonValue) =>
    Array.isArray(v) || (typeof v === 'object' && v !== null)

  const renderObjectItems = (obj: JsonObject, parentPath: Array<string | number>) =>
    Object.entries(obj).map(([k, v]) => (
      <Box
        key={k}
        onDragEnter={() => setDropHover({ kind: 'object', key: k })}
        onDragLeave={() =>
          setDropHover((cur) => (cur?.kind === 'object' && cur.key === k ? null : cur))
        }
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const raw = e.dataTransfer.getData('application/jsonve-dnd')
          if (!raw) return
          const data = JSON.parse(raw) as { containerId: string; kind: 'object' | 'array'; fromKey?: string; fromIndex?: number }
          if (data.containerId !== JSON.stringify(parentPath)) return
          if (data.kind !== 'object' || !data.fromKey) return
          onUpdate(parentPath, moveObjectKey(obj, data.fromKey, k))
          setDropHover(null)
        }}
        sx={{ mb: 1.5 }}
      >
        {/* Linha principal */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
          <Box
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/jsonve-dnd',
                JSON.stringify({ containerId: JSON.stringify(parentPath), kind: 'object', fromKey: k })
              )
              e.dataTransfer.effectAllowed = 'move'
            }}
            sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.secondary' }}
          >
            <GripVertical size={14} />
          </Box>
          <Tooltip title={`Deletar ${k}`} arrow>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                const obj2 = { ...obj }
                delete obj2[k]
                onUpdate(parentPath, obj2)
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
          <TextField
            size="small"
            defaultValue={k}
            variant="outlined"
            sx={{ width: 120 }}
            onBlur={(e) => {
              const nextKey = e.target.value.trim()
              if (!nextKey || nextKey === k) return
              const obj2 = { ...obj }
              obj2[nextKey] = obj2[k]
              delete obj2[k]
              onUpdate(parentPath, obj2)
            }}
          />
          <NodeEditor value={v} path={[...parentPath, k]} onUpdate={onUpdate} />
          {isComplexValue(v) && (
            <Tooltip title={collapsed.has(JSON.stringify([...parentPath, k])) ? 'Expandir' : 'Recolher'} arrow>
              <IconButton
                size="small"
                onClick={() => toggleCollapse(JSON.stringify([...parentPath, k]))}
                sx={{ ml: 'auto' }}
              >
                {collapsed.has(JSON.stringify([...parentPath, k]))
                  ? <ChevronRight size={16} />
                  : <ChevronDown size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {/* Filhos indentados */}
        {isComplexValue(v) && !collapsed.has(JSON.stringify([...parentPath, k])) && (
          <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5 }}>
            {renderChildren(v, [...parentPath, k])}
          </Box>
        )}
      </Box>
    ))

  const renderArrayItems = (arr: JsonArray, parentPath: Array<string | number>) =>
    arr.map((item, i) => (
      <Box
        key={i}
        onDragEnter={() => setDropHover({ kind: 'array', index: i })}
        onDragLeave={() =>
          setDropHover((cur) => (cur?.kind === 'array' && cur.index === i ? null : cur))
        }
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const raw = e.dataTransfer.getData('application/jsonve-dnd')
          if (!raw) return
          const data = JSON.parse(raw) as { containerId: string; kind: 'object' | 'array'; fromKey?: string; fromIndex?: number }
          if (data.containerId !== JSON.stringify(parentPath)) return
          if (data.kind !== 'array' || typeof data.fromIndex !== 'number') return
          onUpdate(parentPath, moveArrayItem(arr, data.fromIndex, i))
          setDropHover(null)
        }}
        sx={{ mb: 1.5 }}
      >
        {/* Linha principal */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
          <Box
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/jsonve-dnd',
                JSON.stringify({ containerId: JSON.stringify(parentPath), kind: 'array', fromIndex: i })
              )
              e.dataTransfer.effectAllowed = 'move'
            }}
            sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.secondary' }}
          >
            <GripVertical size={14} />
          </Box>
          <Tooltip title={`Deletar [${i}]`} arrow>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                const arr2 = [...arr]
                arr2.splice(i, 1)
                onUpdate(parentPath, arr2)
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 28, fontFamily: 'monospace' }}>
            [{i}]
          </Typography>
          <NodeEditor value={item} path={[...parentPath, i]} onUpdate={onUpdate} />
          {isComplexValue(item) && (
            <Tooltip title={collapsed.has(JSON.stringify([...parentPath, i])) ? 'Expandir' : 'Recolher'} arrow>
              <IconButton
                size="small"
                onClick={() => toggleCollapse(JSON.stringify([...parentPath, i]))}
                sx={{ ml: 'auto' }}
              >
                {collapsed.has(JSON.stringify([...parentPath, i]))
                  ? <ChevronRight size={16} />
                  : <ChevronDown size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {/* Filhos indentados */}
        {isComplexValue(item) && !collapsed.has(JSON.stringify([...parentPath, i])) && (
          <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'divider', mt: 0.5 }}>
            {renderChildren(item, [...parentPath, i])}
          </Box>
        )}
      </Box>
    ))

  const renderChildren = (v: JsonValue, parentPath: Array<string | number>) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return <Typography variant="body2" color="text.secondary">Sem itens</Typography>
      return <>{renderArrayItems(v, parentPath)}</>
    }
    if (typeof v === 'object' && v !== null) {
      const entries = Object.entries(v as JsonObject)
      if (entries.length === 0) return <Typography variant="body2" color="text.secondary">Sem campos</Typography>
      return <>{renderObjectItems(v as JsonObject, parentPath)}</>
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
      <Box sx={{ mt: 1 }}>
        {hasComplex && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronDown size={14} />}
              onClick={() => setCollapsed(new Set())}
            >
              Expandir todos
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronRight size={14} />}
              onClick={() => setCollapsed(new Set(collectComplexKeys(value, path)))}
            >
              Recolher todos
            </Button>
          </Box>
        )}
        {renderChildren(value, path)}
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
    <Box component="main" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid className="topbar">
        <Grid>
          <Grid>
            <Grid>
              <Grid>
                JSON Visual Editor
              </Grid>
              <Typography component="h1" variant="h5">
                Adicionar dados
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Modelo (visual)" subheader="Edição total + formulário" />
            <CardContent>
              <Grid container spacing={2} sx={{ flexDirection: 'column' }}>
                <Grid size={12}>
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
                        <Button variant="contained" onClick={onAdd} disabled={!selectedTarget}>
                          Adicionar
                        </Button>
                      </Grid>
                    </Grid>

                    <Divider />

                </Grid>

                <Grid size={12}>
                  <NodeEditor
                    value={parsed}
                    path={[]}
                    onUpdate={(p, next) =>
                      setJsonValue((prev: JsonValue) => updatePrimitive(prev, p, next))
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
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
        </Grid>
      </Grid>
    </Box>
  )
}
