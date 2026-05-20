import { startTransition, useEffect, useMemo } from 'react'
import {
Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { z } from 'zod'
import { useUiStore } from '../../store/uiStore'
import { useJsonStore } from '../../store/jsonStore'
import { enumerateTargets } from '../../lib/jsonUtils'
import type { FieldType } from '../../types'

export function AddFieldForm() {
  const {
    fieldName, fieldType, targetLabel, nameError, valueError,
    valueText, valueNumberText, valueBoolean, valueIsNull,
    setFieldName, setFieldType, setTargetLabel, setNameError, setValueError,
    setValueText, setValueNumberText, setValueBoolean, setValueIsNull,
    editingJson,
  } = useUiStore()

  const { jsonValue, handleApplyInsert } = useJsonStore()

  const targets = useMemo(() => enumerateTargets(jsonValue ?? {}), [jsonValue])

  const selectedTarget = useMemo(
    () => targets.find((t) => t.label === targetLabel) ?? targets[0],
    [targets, targetLabel]
  )

  useEffect(() => {
    if (!targets.find((t) => t.label === targetLabel)) {
      startTransition(() => setTargetLabel(targets[0]?.label ?? 'Início'))
    }
  }, [targets, targetLabel, setTargetLabel])

  useEffect(() => {
    if (selectedTarget?.kind === 'array') startTransition(() => setFieldName(''))
  }, [selectedTarget?.kind, setFieldName])

  const valueNumber = useMemo(() => {
    const n = Number(valueNumberText)
    return Number.isFinite(n) ? n : 0
  }, [valueNumberText])

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
        if (data.type === 'string' && data.valueText.trim().length === 0)
          ctx.addIssue({ code: 'custom', message: 'Informe um valor.' })
        if (data.type === 'number' && !Number.isFinite(Number(data.valueNumberText)))
          ctx.addIssue({ code: 'custom', message: 'Informe um número válido.' })
      })

    const result = schema.safeParse({ name: fieldName, type: fieldType, isNull: valueIsNull, valueText, valueNumberText, valueBoolean })
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Dados inválidos.'
      if (msg === 'Informe um nome.') setNameError(msg)
      else setValueError(msg)
      return
    }

    setNameError(null)
    setValueError(null)
    handleApplyInsert(selectedTarget, result.data.name ?? '', result.data.type, {
      valueText,
      valueNumber,
      valueBoolean,
      isNull: valueIsNull,
    })
  }

  return (
    <>
      <Typography variant="subtitle2">Adicionar dados ao JSON</Typography>
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
              sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}
            >
              {targets.map((t) => (
                <MenuItem key={t.label} value={t.label}>{t.label} ({t.kind})</MenuItem>
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
                const nextType = e.target.value as FieldType
                setFieldType(nextType)
                setValueIsNull(false)
                if (nextType === 'string') { setValueText('item'); setValueIsNull(false) }
                if (nextType === 'boolean') setValueBoolean(false)
                if (nextType === 'number') setValueNumberText('0')
                if (nextType === 'object' || nextType === 'array') {
                  setValueText('item'); setValueNumberText('0'); setValueBoolean(false)
                }
              }}
              sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}
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

        {fieldType === 'string' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <TextField label="Valor" value={valueText} onChange={(e) => setValueText(e.target.value)} size="small" variant="outlined" fullWidth disabled={valueIsNull} error={!!valueError} helperText={valueError ?? ' '} />
          </Grid>
        )}

        {fieldType === 'number' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <TextField label="Valor" value={valueNumberText} onChange={(e) => setValueNumberText(e.target.value)} size="small" variant="outlined" fullWidth disabled={valueIsNull} inputMode="decimal" error={!!valueError} helperText={valueError ?? ' '} />
          </Grid>
        )}

        {fieldType === 'boolean' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <FormControl size="small" fullWidth disabled={valueIsNull}>
              <InputLabel id="bool-label">Valor</InputLabel>
              <Select labelId="bool-label" value={String(valueBoolean)} label="Valor" onChange={(e) => setValueBoolean(e.target.value === 'true')} sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}>
                <MenuItem value="true">true</MenuItem>
                <MenuItem value="false">false</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 'grow' }}>
          <Grid>
            <Switch checked={valueIsNull} onChange={(e) => setValueIsNull(e.target.checked)} />
            <Typography component="span" variant="body2">Nulo</Typography>
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
    </>
  )
}
